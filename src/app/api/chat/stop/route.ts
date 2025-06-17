import redis from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { streamId } = await req.json();

    if (!streamId) {
      return new NextResponse("streamId is required", { status: 400 });
    }
    
    // Publish a stop message to the stream's channel
    await redis.publish(`stop-stream:${streamId}`, "stop");

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