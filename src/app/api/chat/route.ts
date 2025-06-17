import {
  streamText,
  createDataStream,
  Message,
  appendClientMessage,
  generateId,
  smoothStream,
  LanguageModelV1,
  experimental_generateImage as generateImage,
  generateText,
} from 'ai';
import { createResumableStreamContext } from 'resumable-stream/ioredis';
import { after, NextRequest } from 'next/server';
import { Id } from '@convex/_generated/dataModel';
import { fetchAction, fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@convex/_generated/api';
import redis from '@/lib/redis';
import { getModelByInternalId, getDefaultModel, SupportedModelId, getModelById, isImageGenerationModel, ImageModelV1 } from '@/lib/models';
import { ModelParams } from '@convex/schema';
import { createAuth } from '@convex/auth';
import { getToken as getTokenBetterAuth } from '@convex-dev/better-auth/nextjs';

import { betterAuth } from 'better-auth';
import { createCookieGetter } from 'better-auth/cookies';
import { GenericActionCtx } from 'convex/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenericActionCtx = GenericActionCtx<any>;

const getTokenLocalBuild = async (
  createAuth: (ctx: AnyGenericActionCtx) => ReturnType<typeof betterAuth>
) => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const auth = createAuth({} as AnyGenericActionCtx);
  const createCookie = createCookieGetter(auth.options);
  const cookie = createCookie('convex_jwt');
  const token = cookieStore.get(cookie.name);
  const tokenFromCookie = cookieStore.get("better-auth.convex_jwt");

  return token?.value || tokenFromCookie?.value;
};  

// workaround for local build to work with dev convex server
const getToken = async (
  createAuth: (ctx: AnyGenericActionCtx) => ReturnType<typeof betterAuth>
) => {
  if (process.env.LOCAL_BUILD === 'true') return getTokenLocalBuild(createAuth);
  return getTokenBetterAuth(createAuth);
};

// Create Redis clients for publisher and subscriber
const publisher = redis;
const subscriber = redis.duplicate(); // Create a separate connection for subscriber

const streamContext = createResumableStreamContext({
  waitUntil: after,
  publisher,
  subscriber,
});

export const dynamic = 'force-dynamic';

async function generateThreadTitle(
  message: string, 
  threadId: Id<'threads'>, 
  auth: string
): Promise<void> {
  try {
    const titleModel = getModelByInternalId('gemini-2.0-flash') as LanguageModelV1;
    if (!titleModel) {
      throw new Error('Title generation model not available');
    }

    const result = await generateText({
      model: titleModel,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates concise, descriptive titles for chat conversations. 
          
          Rules:
          - Generate a title that captures the main topic or intent of the user's message
          - Keep it under 60 characters
          - Make it descriptive but concise
          - Don't use quotes around the title
          - Focus on the key subject matter or question being asked
          - If it's a coding question, mention the technology/language
          - If it's a general question, capture the main topic
          
          Examples:
          - "How to center a div in CSS" => "CSS Div Centering"
          - "Explain quantum physics" => "Quantum Physics Explanation"
          - "Help me debug this Python code" => "Python Code Debugging"
          - "What's the weather like?" => "Weather Inquiry"
          - "Plan a trip to Japan" => "Japan Travel Planning"`
        },
        {
          role: "user",
          content: `Generate a title for this message: "${message}"`
        }
      ],
      maxTokens: 20,
      temperature: 0.3,
    });

    await fetchMutation(
      api.threads.updateThreadTitle,
      { 
        threadId, 
        title: result.text.trim() 
      },
      { token: auth }
    );
  } catch (error) {
    console.error("Failed to generate title:", error);
    // Title generation failed - we'll keep the fallback title
  }
}

export async function POST(req: NextRequest) {
  const { 
    message, 
    threadId: idFromClient, 
    selectedModelId, 
    modelParams,
    attachmentIds,
  }: { 
    message: Message; 
    threadId?: Id<'threads'>; 
    selectedModelId: SupportedModelId | undefined;
    modelParams: ModelParams;
    attachmentIds?: Id<'attachments'>[];
  } = await req.json();

  const modelToUse = selectedModelId ? getModelById(selectedModelId) : getDefaultModel();

  let threadId = idFromClient;
  let newThreadCreated = false;
  const token = await getToken(createAuth);

  // Get user's API key and preferences
  let userApiKey: string | null = null;
  let useOpenRouterForAll = false;
  if (token) {
    try {
      // Get user preferences
      const preferences = await fetchQuery(
        api.userPreferences.getUserPreferences,
        {},
        { token }
      );
      useOpenRouterForAll = preferences.useOpenRouterForAll;

      // Get appropriate API key - OpenRouter if using it for all, otherwise provider-specific
      const providerToUse = useOpenRouterForAll ? 'openrouter' : modelToUse.provider;
      const apiKeyData = await fetchAction(
        api.apiKeys.getApiKeyForProvider,
        { provider: providerToUse },
        { token }
      );
      userApiKey = apiKeyData?.key || null;
    } catch (error) {
      console.error('Error fetching user API key or preferences:', error);
    }
  }

  let attachments: Array<{
    _id: Id<"attachments">;
    fileName: string;
    mimeType: string;
    url: string;
  }> = [];
  if (attachmentIds && attachmentIds.length > 0) {
    attachments = await fetchQuery(
      api.attachments.getAttachments,
      { attachmentIds },
      { token }
    );
  }

  // If no threadId create a new thread
  if (!threadId) {
    const newThreadId = await fetchMutation(
      api.threads.createThreadForChat,
      { firstMessage: message.content, model: modelToUse.id },
      { token }
    );
    threadId = newThreadId;
    newThreadCreated = true;

    // Generate title asynchronously without blocking the response
    after(() => generateThreadTitle(message.content, newThreadId, token!));
  }

  // Persist the user message
  await fetchMutation(
    api.messages.addUserMessage,
    { 
      threadId: threadId!, 
      content: message.content, 
      model: modelToUse.id, 
      attachmentIds,
      clientId: message.id // Save the client ID for reconciliation
    },
    { token }
  );

  // Load the previous messages from the server unless new thread
  const previousConvexMessages =
    !newThreadCreated
      ? await fetchQuery(
          api.messages.getThreadMessages,
          { threadId },
          { token }
        )
      : [];
  
  const previousMessages: Message[] = previousConvexMessages
    .filter(m => m.content)
    .map(m => {
      const baseMessage: Message = {
        id: m._id,
        role: m.role,
        content: m.content!,
        ...(m.metadata && { data: { metadata: m.metadata } }),
      };

      if (m.attachments && m.attachments.length > 0) {
        return {
          ...baseMessage,
          experimental_attachments: m.attachments.map(attachment => ({
            name: attachment.fileName,
            contentType: attachment.mimeType,
            url: attachment.url,
          })),
        };
      }

      return baseMessage;
    });

  let currentMessage = { ...message };
  if (attachments.length > 0) {
    currentMessage = {
      ...message,
      experimental_attachments: attachments.map(attachment => ({
        name: attachment.fileName,
        contentType: attachment.mimeType,
        url: attachment.url,
      })),
    };
  }

  // Append the new message to the previous messages
  const messages = appendClientMessage({
    messages: previousMessages,
    message: currentMessage,
  });

  const partialStreamId = generateId();
  const streamId = `${threadId}-${partialStreamId}`;

  // Create an empty assistant message with streaming status
  await fetchMutation(
    api.messages.upsertAssistantMessage,
    { threadId: threadId, streamId, model: modelToUse.id, modelParams },
    { token }
  );

  const startTime = Date.now();
  
  // Get the actual model instance
  const modelInstance = getModelByInternalId(modelToUse.id, userApiKey, useOpenRouterForAll);
  if (!modelInstance) {
    throw new Error(`Model ${modelToUse.id} not found`);
  }
  const getContextString = (context: "image" | "text" | "unknown") => {
    const contextMap = {
      "image": "image generation",
      "text": "text generation",
      "unknown": "unknown error"
    };
    return contextMap[context];
  };

  const isResponseAborted = (error: unknown): boolean => {
    if (error instanceof Error) {
      return error.name === 'ResponseAborted' || error.name === 'AbortError';
    }
    if (error instanceof Object && 'error' in error) {
      const innerError = error.error;
      return innerError instanceof Error && (innerError.name === 'ResponseAborted' || innerError.name === 'AbortError');
    }
    return false;
  };

  const handleError = (
    error: unknown, 
    errorContext: "image" | "text" | "unknown",
    partialContent?: string,
    partialReasoning?: string
  ) => {
    const contextString = getContextString(errorContext);
    if (isResponseAborted(error)) {
      console.log(`Stream stopped by user during ${contextString}.`);
    } else {
      console.error(`Error during ${contextString}:`, JSON.stringify(error));
    }
    
    fetchMutation(
      api.messages.upsertAssistantMessage,
      {
        streamId,
        ...(partialContent && { content: partialContent }),
        ...(partialReasoning && { reasoning: partialReasoning }),
        status: "error",
        error: isResponseAborted(error) ? "Stopped by user" : `An error occurred during ${contextString}.`
      },
      { token }
    );
  };

  const dataStream = createDataStream({
    execute: async (stream) => {
      // Send streamId to client
      stream.writeData({ type: 'stream-started', streamId });

      // If a new thread was created send its ID to the client
      if (newThreadCreated && threadId) {
        stream.writeData({ type: 'thread-created', id: threadId });
      }
      
      const abortController = new AbortController();
      const redisSubscriber = redis.duplicate();
      let cleanedUp = false;

      const shutdown = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        
        if (!abortController.signal.aborted) {
          abortController.abort();
        }
        redisSubscriber.unsubscribe();
        redisSubscriber.disconnect();
      };
      
      redisSubscriber.subscribe(`stop-stream:${streamId}`, (err) => {
        if (err) {
          console.error("Error subscribing to stop channel:", err);
          return;
        }
      });
      
      redisSubscriber.on('message', (channel, message) => {
        if (channel === `stop-stream:${streamId}` && message === 'stop') {
          shutdown();
        }
      });
      
      try {
        if (isImageGenerationModel(modelToUse)) {
          // Handle image generation
          try {
            const imageModel = modelInstance as ImageModelV1
            const { image, images } = await generateImage({
              model: imageModel,
              prompt: message.content,
              abortSignal: abortController.signal,
              ...(modelParams.size && { size: modelParams.size as `${number}x${number}` }),
              n: modelParams.n || 1,
              seed: modelParams.seed,
              ...(modelParams.quality && { 
                providerOptions: { 
                  openai: { 
                    quality: modelParams.quality,
                    ...(modelParams.style && { style: modelParams.style })
                  } 
                } 
              }),
            });

            const generatedImages = images || [image];

            const attachmentIds = await Promise.all(
              generatedImages.map(async (img, index) => {
                const base64Data = img.base64.split(',')[1] || img.base64;
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'image/png' });

                const uploadUrl = await fetchMutation(
                  api.attachments.generateUploadUrl,
                  {},
                  { token }
                );

                const uploadResponse = await fetch(uploadUrl, {
                  method: 'POST',
                  body: blob,
                });

                if (!uploadResponse.ok) {
                  throw new Error('Failed to upload image');
                }

                const { storageId } = await uploadResponse.json();

                const attachmentId = await fetchMutation(
                  api.attachments.createAttachment,
                  {
                    storageId,
                    fileName: `generated-image-${index + 1}.png`,
                    mimeType: 'image/png',
                  },
                  { token }
                );

                return attachmentId;
              })
            );

            await fetchMutation(
              api.messages.upsertAssistantMessage,
              {
                streamId,
                content: `Generated ${generatedImages.length} image${generatedImages.length === 1 ? '' : 's'}`,
                status: "completed",
                metadata: {
                  duration: Date.now() - startTime,
                },
              },
              { token }
            );

            await fetchMutation(
              api.messages.addAttachmentsToMessage,
              {
                streamId,
                attachmentIds,
              },
              { token }
            );
          } catch (error) {
            handleError(error, "image");
          } finally {
            shutdown();
          }
        } else {
          // Handle text generation
          let partialContent = "";
          let partialReasoning = "";
          
          const result = streamText({
            model: modelInstance as LanguageModelV1,
            messages,
            temperature: modelParams.temperature,
            topP: modelParams.topP,
            topK: modelParams.topK,
            maxTokens: modelParams.maxTokens,
            presencePenalty: modelParams.presencePenalty,
            frequencyPenalty: modelParams.frequencyPenalty,
            seed: modelParams.seed,
            abortSignal: abortController.signal,
            experimental_transform: smoothStream(),
            async onFinish({ text, usage, reasoning }) {
              await fetchMutation(
                api.messages.upsertAssistantMessage,
                {
                  streamId,
                  content: text,
                  status: "completed",
                  reasoning: reasoning,
                  metadata: {
                    usage: {
                      promptTokens: usage.promptTokens,
                      completionTokens: usage.completionTokens,
                      totalTokens: usage.totalTokens,
                    },
                    duration: Date.now() - startTime,
                  },
                },
                { token }
              );
              shutdown();
            },
            onChunk({ chunk }) {
              if(chunk.type === "reasoning") partialReasoning += chunk.textDelta;
              else if(chunk.type === "text-delta") partialContent += chunk.textDelta;
            },
            onError(error) {
              handleError(error, "text", partialContent, partialReasoning);
              shutdown();
            },
          });

          result.consumeStream({
            onError(error) {
              handleError(error, "text", partialContent, partialReasoning);
              shutdown();
            },
          });
          result.mergeIntoDataStream(stream, {
            sendReasoning: true,
          });
        }
      } catch (e) {
        handleError(e, "unknown");
        shutdown();
      }
    },
  });

  const resumableStream = await streamContext.resumableStream(
    streamId,
    () => dataStream
  );

  return new Response(resumableStream);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const threadId = searchParams.get('threadId') as Id<'threads'> | null;

  if (!threadId || threadId === 'undefined') {
    return new Response('chatId is required and could not be determined.', { status: 400 });
  }

  const token = await getToken(createAuth);
  if (!token) {
    return new Response("Not authenticated", { status: 401 });
  }

  const lastAssistantMessage = await fetchQuery(
    api.messages.getLatestThreadMessage,
    { threadId },
    { token }
  );

  if (!lastAssistantMessage || !lastAssistantMessage.streamId) {
    return new Response('No resumable stream found for this chat.', { status: 404 });
  }
  
  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  return new Response(
    await streamContext.resumableStream(lastAssistantMessage.streamId, () => emptyDataStream),
    { status: 200 },
  );
}
