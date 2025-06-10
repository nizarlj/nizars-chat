import { google } from '@ai-sdk/google';
import {
  streamText,
  createDataStream,
  Message,
  appendClientMessage,
  generateId,
  smoothStream,
} from 'ai';
import { createResumableStreamContext } from 'resumable-stream/ioredis';
import { after, NextRequest } from 'next/server';
import { Id } from '@convex/_generated/dataModel';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@convex/_generated/api';
import redis from '@/lib/redis';

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
  const { message, threadId: idFromClient }: { message: Message; threadId?: Id<'threads'> } =
    await req.json();

  let threadId = idFromClient;
  let newThreadCreated = false;
  const auth = await convexAuthNextjsToken();

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
    { threadId: threadId!, content: message.content },
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
    .map(m => ({
      id: m._id,
      role: m.role,
      content: m.content!,
      ...(m.metadata && { data: { metadata: m.metadata } }),
    }));

  // Append the new message to the previous messages
  const messages = appendClientMessage({
    messages: previousMessages,
    message,
  });

  const partialStreamId = generateId();
  const streamId = `${threadId}-${partialStreamId}`;

  // Create an empty assistant message with streaming status
  await fetchMutation(
    api.messages.upsertAssistantMessage,
    { threadId: threadId, streamId },
    { token: auth }
  );

  const startTime = Date.now();
  const dataStream = createDataStream({
    execute: (stream) => {
      // If a new thread was created send its ID to the client
      if (newThreadCreated && threadId) {
        stream.writeData({ type: 'thread-created', id: threadId });
      }

      try {
        const result = streamText({
          model: google('gemini-2.0-flash'),
          messages,
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
                content: "An error occurred during the stream.",
              },
              { token: auth }
            );
          },
        });

        result.consumeStream();
        result.mergeIntoDataStream(stream);
      } catch (e) {
        console.error("Error during streamText:", e);
        fetchMutation(
          api.messages.upsertAssistantMessage,
          {
            streamId,
            status: "error",
            content: "An error occurred during the stream.",
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
