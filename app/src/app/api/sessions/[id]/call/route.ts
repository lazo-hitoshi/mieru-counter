import { prisma } from "@/lib/prisma";
import { eventBus } from "@/lib/event-bus";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const notification = await prisma.callNotification.create({
    data: {
      id: randomUUID(),
      sessionId: id,
      counterId: body.counterId || session.counterId,
      callNumber: body.callNumber || null,
      title: body.title || "呼び出し",
      body: body.body || `${body.callNumber}番の方、窓口へお越しください`,
      priority: body.priority || "high",
      sentByUserId: body.sentByUserId || null,
      sentAt: new Date(),
    },
  });

  eventBus.emit({
    type: "call.sent",
    sessionId: id,
    data: notification,
  });

  return Response.json(notification, { status: 201 });
}
