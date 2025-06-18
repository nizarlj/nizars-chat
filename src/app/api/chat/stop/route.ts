import redis from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { getToken } from "@/lib/auth-server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken();
    if (!token) {
      return new NextResponse("Not authenticated", { status: 401 });
    }

    const { streamId, content, reasoning } = await req.json();
    if (!streamId) {
      return new NextResponse("streamId is required", { status: 400 });
    }
    
    // Publish a stop message to the stream's channel
    await redis.publish(`stop-stream:${streamId}`, "stop");

    // Guarantee the status change
    await fetchMutation(
        api.messages.upsertAssistantMessage,
        {
            streamId,
            content,
            reasoning,
            status: "error",
            error: "Stopped by user",
        },
        { token }
    );

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error stopping stream:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(JSON.stringify({ error: "Failed to stop stream", details: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 