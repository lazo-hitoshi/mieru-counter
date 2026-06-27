import { prisma } from "@/lib/prisma";
import { eventBus } from "@/lib/event-bus";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const actions = await prisma.confirmationAction.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(actions);
}

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

  const action = await prisma.confirmationAction.create({
    data: {
      id: randomUUID(),
      sessionId: id,
      actionType: body.actionType,
      targetType: body.targetType || null,
      targetId: body.targetId || null,
      message: body.message || null,
    },
  });

  eventBus.emit({
    type: "confirmation.created",
    sessionId: id,
    data: action,
  });

  return Response.json(action, { status: 201 });
}
