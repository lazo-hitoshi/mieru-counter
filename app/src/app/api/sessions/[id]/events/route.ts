import { eventBus, type SessionEvent } from "@/lib/event-bus";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));

      const unsubscribe = eventBus.subscribe(id, (event: SessionEvent) => {
        const payload = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          unsubscribe();
        }
      });

      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
          unsubscribe();
        }
      }, 15000);

      _request.signal.addEventListener("abort", () => {
        clearInterval(keepalive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
