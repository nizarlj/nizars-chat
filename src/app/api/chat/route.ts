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
import { getToken } from '@/lib/auth-server';

import { betterAuth } from 'better-auth';
import { createCookieGetter } from 'better-auth/cookies';
import { GenericActionCtx } from 'convex/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenericActionCtx = GenericActionCtx<any>;

interface ChatRequest {
  message: Message;
  threadId?: Id<'threads'>;
  selectedModelId: SupportedModelId | undefined;
  modelParams: ModelParams;
  attachmentIds?: Id<'attachments'>[];
  assistantClientId?: string;
  startTime: number;
}

interface ChatContext {
  token: string;
  modelToUse: ReturnType<typeof getDefaultModel>;
  userApiKey: string | null;
  apiKey: { id: Id<'apiKeys'>, provider: string } | null;
  useOpenRouterForAll: boolean;
  attachments: Array<{
    _id: Id<"attachments">;
    fileName: string;
    mimeType: string;
    url: string;
  }>;
  threadId: Id<'threads'>;
  newThreadCreated: boolean;
  streamId: string;
  modelInstance: LanguageModelV1 | ImageModelV1;
  messages: Message[];
  startTime: number;
  assistantId: string;
}

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

async function parseRequest(req: NextRequest): Promise<ChatRequest> {
  return await req.json();
}

async function getUserPreferencesAndApiKey(token: string, modelToUse: ReturnType<typeof getDefaultModel>) {
  let userApiKey: { key: string, provider: string, _id: Id<'apiKeys'> } | null = null;
  let useOpenRouterForAll = false;

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
    userApiKey = await fetchAction(
      api.apiKeys.getApiKeyForProvider,
      { provider: providerToUse },
      { token }
    ) as { key: string, provider: string, _id: Id<'apiKeys'> } | null;
  } catch (error) {
    console.error('Error fetching user API key or preferences:', error);
  }

  return { userApiKey, useOpenRouterForAll };
}

async function fetchAttachments(attachmentIds: Id<'attachments'>[] | undefined, token: string) {
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

  return attachments;
}

async function handleThread(
  threadId: Id<'threads'> | undefined,
  message: Message,
  modelToUse: ReturnType<typeof getDefaultModel>,
  token: string
): Promise<{ threadId: Id<'threads'>; newThreadCreated: boolean }> {
  let finalThreadId = threadId;
  let newThreadCreated = false;

   // If no threadId create a new thread
  if (!finalThreadId) {
    const newThreadId = await fetchMutation(
      api.threads.createThreadForChat,
      { firstMessage: message.content, model: modelToUse.id },
      { token }
    );
    finalThreadId = newThreadId;
    newThreadCreated = true;

    // Generate title asynchronously without blocking the response
    after(() => generateThreadTitle(message.content, newThreadId, token));
  }

  return { threadId: finalThreadId, newThreadCreated };
}

async function handleMessages(
  threadId: Id<'threads'>,
  message: Message,
  modelToUse: ReturnType<typeof getDefaultModel>,
  attachmentIds: Id<'attachments'>[] | undefined,
  newThreadCreated: boolean,
  token: string
): Promise<Message[]> {
  // Persist the user message
  await fetchMutation(
    api.messages.addUserMessage,
    { 
      threadId, 
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
  
  return previousConvexMessages
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
}

function prepareFinalMessages(
  previousMessages: Message[],
  message: Message,
  attachments: Array<{
    _id: Id<"attachments">;
    fileName: string;
    mimeType: string;
    url: string;
  }>
): Message[] {
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
  return appendClientMessage({
    messages: previousMessages,
    message: currentMessage,
  });
}

async function setupStream(
  threadId: Id<'threads'>,
  modelToUse: ReturnType<typeof getDefaultModel>,
  modelParams: ModelParams,
  token: string,
  apiKey: { id: Id<'apiKeys'>, provider: string } | null,
  assistantClientId?: string
): Promise<{ streamId: string, assistantId: string }> {
  const partialStreamId = generateId();
  const streamId = `${threadId}-${partialStreamId}`;

  // Create an empty assistant message with streaming status
  const assistantId = await fetchMutation(
    api.messages.upsertAssistantMessage,
    {
      threadId,
      streamId,
      model: modelToUse.id,
      modelParams,
      clientId: assistantClientId,
      metadata: {
        ...(apiKey && { apiKey })
      }
    },
    { token }
  );

  return { streamId, assistantId };
}

function getContextString(context: "image" | "text" | "unknown"): string {
  const contextMap = {
    "image": "image generation",
    "text": "text generation",
    "unknown": "unknown error"
  };
  return contextMap[context];
}

function isResponseAborted(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'ResponseAborted' || error.name === 'AbortError';
  }
  if (error instanceof Object && 'error' in error) {
    const innerError = error.error;
    return innerError instanceof Error && (innerError.name === 'ResponseAborted' || innerError.name === 'AbortError');
  }
  return false;
}

function createErrorHandler(
  streamId: string,
  token: string,
  apiKey: { id: Id<'apiKeys'>, provider: string } | null
) {
  return (
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
        error: isResponseAborted(error) ? "Stopped by user" : `An error occurred during ${contextString}.`,
        metadata: {
          ...(apiKey && { apiKey })
        }
      },
      { token }
    );
  };
}

async function handleImageGeneration(
  modelInstance: ImageModelV1,
  message: Message,
  modelParams: ModelParams,
  abortController: AbortController,
  streamId: string,
  startTime: number,
  token: string,
  handleError: ReturnType<typeof createErrorHandler>,
  apiKey: { id: Id<'apiKeys'>, provider: string } | null
): Promise<void> {
  try {
    const { image, images } = await generateImage({
      model: modelInstance,
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
          ...(apiKey && { apiKey })
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
  }
}

function handleTextGeneration(
  modelInstance: LanguageModelV1,
  messages: Message[],
  modelParams: ModelParams,
  abortController: AbortController,
  streamId: string,
  startTime: number,
  token: string,
  handleError: ReturnType<typeof createErrorHandler>,
  shutdown: () => void,
  stream: any,
  apiKey: { id: Id<'apiKeys'>, provider: string } | null,
  assistantId: string
): void {
  let partialContent = "";
  let partialReasoning = "";
  
  const result = streamText({
    model: modelInstance,
    messages,
    temperature: modelParams.temperature,
    topP: modelParams.topP,
    topK: modelParams.topK,
    maxTokens: modelParams.maxTokens,
    presencePenalty: modelParams.presencePenalty,
    frequencyPenalty: modelParams.frequencyPenalty,
    seed: modelParams.seed,
    abortSignal: abortController.signal,
    experimental_generateMessageId: () => assistantId,
    experimental_transform: smoothStream(),
    async onFinish({ text, usage, reasoning, providerMetadata, sources }) {
      await fetchMutation(
        api.messages.upsertAssistantMessage,
        {
          streamId,
          content: text,
          status: "completed",
          reasoning: reasoning,
          providerMetadata: { ...providerMetadata, ...(sources && { sources }) },
          metadata: {
            usage: {
              promptTokens: usage.promptTokens,
              completionTokens: usage.completionTokens,
              totalTokens: usage.totalTokens,
            },
            duration: Date.now() - startTime,
            ...(apiKey && { apiKey })
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

  result.mergeIntoDataStream(stream, {
    sendReasoning: true,
  });
}

function createStreamExecution(context: ChatContext, request: ChatRequest) {
  return async (stream: any) => {
    // Send streamId to client
    stream.writeData({ type: 'stream-started', streamId: context.streamId });

    // If a new thread was created send its ID to the client
    if (context.newThreadCreated && context.threadId) {
      stream.writeData({ type: 'thread-created', id: context.threadId });
    }
    
    const abortController = new AbortController();
    const redisSubscriber = redis.duplicate();
    let cleanedUp = false;
    const { apiKey } = context;

    const shutdown = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
      redisSubscriber.unsubscribe();
      redisSubscriber.disconnect();
    };
    
    redisSubscriber.subscribe(`stop-stream:${context.streamId}`, (err) => {
      if (err) {
        console.error("Error subscribing to stop channel:", err);
        return;
      }
    });
    
    redisSubscriber.on('message', (channel, message) => {
      if (channel === `stop-stream:${context.streamId}` && message === 'stop') {
        shutdown();
      }
    });

    const handleError = createErrorHandler(context.streamId, context.token, apiKey);
    
    try {
      if (isImageGenerationModel(context.modelToUse)) {
        await handleImageGeneration(
          context.modelInstance as ImageModelV1,
          request.message,
          request.modelParams,
          abortController,
          context.streamId,
          context.startTime,
          context.token,
          handleError,
          apiKey
        );
        shutdown();
      } else {
        handleTextGeneration(
          context.modelInstance as LanguageModelV1,
          context.messages,
          request.modelParams,
          abortController,
          context.streamId,
          context.startTime,
          context.token,
          handleError,
          shutdown,
          stream,
          apiKey,
          context.assistantId
        );
      }
    } catch (e) {
      handleError(e, "unknown");
      shutdown();
    }
  };
}

export async function POST(req: NextRequest) {
  // Parse request
  const request = await parseRequest(req);
  const { message, threadId: idFromClient, selectedModelId, modelParams, attachmentIds, assistantClientId } = request;

  // Get model and auth token
  const modelToUse = selectedModelId ? getModelById(selectedModelId) : getDefaultModel();
  const token = await getToken();

  // Get user preferences and API key
  const { 
    userApiKey, 
    useOpenRouterForAll
  } = await getUserPreferencesAndApiKey(token!, modelToUse);

  // Fetch attachments
  const attachments = await fetchAttachments(attachmentIds, token!);

  // Handle thread creation or retrieval
  const { threadId, newThreadCreated } = await handleThread(idFromClient, message, modelToUse, token!);

  // Handle message persistence and loading
  const previousMessages = await handleMessages(threadId, message, modelToUse, attachmentIds, newThreadCreated, token!);

  // Prepare final messages
  const messages = prepareFinalMessages(previousMessages, message, attachments);

  // Setup stream
  const apiKey = userApiKey ? { id: userApiKey._id, provider: userApiKey.provider } : null;
  const { streamId, assistantId } = await setupStream(threadId, modelToUse, modelParams, token!, apiKey, assistantClientId);

  // Get model instance
  const modelInstance = getModelByInternalId(modelToUse.id, userApiKey?.key, useOpenRouterForAll, modelParams);
  if (!modelInstance) {
    throw new Error(`Model ${modelToUse.id} not found`);
  }

  // Create context for stream execution
  const context: ChatContext = {
    token: token!,
    modelToUse,
    userApiKey: userApiKey?.key || null,
    useOpenRouterForAll,
    apiKey,
    attachments,
    threadId,
    newThreadCreated,
    streamId,
    modelInstance,
    messages,
    startTime: Date.now(),
    assistantId,
  };

  // Create and execute stream
  const dataStream = createDataStream({
    execute: createStreamExecution(context, request),
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

  const token = await getToken();
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
