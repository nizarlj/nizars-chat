import {
  streamText,
  createDataStream,
  Message,
  appendClientMessage,
  generateId,
  smoothStream,
  LanguageModelV1,
  experimental_generateImage as generateImage,
} from 'ai';
import { createResumableStreamContext } from 'resumable-stream/ioredis';
import { after, NextRequest } from 'next/server';
import { Id } from '@convex/_generated/dataModel';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@convex/_generated/api';
import redis from '@/lib/redis';
import { getModelByInternalId, getDefaultModel, SupportedModelId, getModelById, isImageGenerationModel, ImageModelV1 } from '@/lib/models';
import { ModelParams } from '@convex/schema';

// Create Redis clients for publisher and subscriber
const publisher = redis;
const subscriber = redis.duplicate(); // Create a separate connection for subscriber

const streamContext = createResumableStreamContext({
  waitUntil: after,
  publisher,
  subscriber,
});

export const dynamic = 'force-dynamic';

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
  const auth = await convexAuthNextjsToken();

  let attachments: Array<{
    _id: Id<"attachments">;
    fileName: string;
    mimeType: string;
    url: string;
  }> = [];
  if (attachmentIds && attachmentIds.length > 0) {
    attachments = await fetchQuery(
      api.files.getAttachments,
      { attachmentIds },
      { token: auth }
    );
  }

  // If no threadId create a new thread
  if (!threadId) {
    const newThreadId = await fetchMutation(
      api.threads.createThreadForChat,
      { firstMessage: message.content },
      { token: auth }
    );
    threadId = newThreadId;
    newThreadCreated = true;
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
    { token: auth }
  );

  // Load the previous messages from the server unless new thread
  const previousConvexMessages =
    !newThreadCreated
      ? await fetchQuery(
          api.messages.getThreadMessages,
          { threadId },
          { token: auth }
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
    { token: auth }
  );

  const startTime = Date.now();
  
  // Get the actual model instance
  const modelInstance = getModelByInternalId(modelToUse.id);
  if (!modelInstance) {
    throw new Error(`Model ${modelToUse.id} not found`);
  }

  const dataStream = createDataStream({
    execute: async (stream) => {
      // If a new thread was created send its ID to the client
      if (newThreadCreated && threadId) {
        stream.writeData({ type: 'thread-created', id: threadId });
      }

      try {
        if (isImageGenerationModel(modelToUse)) {
          // Handle image generation
          try {
            const imageModel = modelInstance as ImageModelV1
            const { image, images } = await generateImage({
              model: imageModel,
              prompt: message.content,
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
                  api.files.generateUploadUrl,
                  {},
                  { token: auth }
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
                  api.files.createAttachment,
                  {
                    storageId,
                    fileName: `generated-image-${index + 1}.png`,
                    mimeType: 'image/png',
                  },
                  { token: auth }
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
              { token: auth }
            );

            await fetchMutation(
              api.messages.addAttachmentsToMessage,
              {
                streamId,
                attachmentIds,
              },
              { token: auth }
            );
          } catch (error) {
            console.error("Error during image generation:", error);
            await fetchMutation(
              api.messages.upsertAssistantMessage,
              {
                streamId,
                status: "error",
                content: "An error occurred during image generation."
              },
              { token: auth }
            );
          }
        } else {
          // Handle text generation
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
                { token: auth }
              );
            },
            onError(error) {
              console.error("Error during streamText:", error);
              fetchMutation(
                api.messages.upsertAssistantMessage,
                {
                  streamId,
                  status: "error",
                  content: "An error occurred during the stream."
                },
                { token: auth }
              );
            },
          });

          result.consumeStream();
          result.mergeIntoDataStream(stream, {
            sendReasoning: true,
          });
        }
      } catch (e) {
        console.error("Error during generation:", e);
        fetchMutation(
          api.messages.upsertAssistantMessage,
          {
            streamId,
            status: "error",
            content: "An error occurred during generation."
          },
          { token: auth }
        );
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

  const token = await convexAuthNextjsToken();
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
