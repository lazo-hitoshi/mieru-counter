import { prisma } from "@/lib/prisma";
import { eventBus } from "@/lib/event-bus";
import { NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const item = await prisma.importantItem.findUnique({ where: { id } });
  if (!item) {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }
  if (item.reviewStatus === "sent") {
    return Response.json({ error: "Already sent" }, { status: 400 });
  }

  const updated = await prisma.importantItem.update({
    where: { id },
    data: { reviewStatus: "sent", sentAt: new Date() },
  });

  eventBus.emit({
    type: "important_item.sent",
    sessionId: updated.sessionId,
    data: updated,
  });

  return Response.json(updated);
}
