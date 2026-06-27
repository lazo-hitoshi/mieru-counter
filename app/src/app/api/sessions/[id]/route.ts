import { prisma } from "@/lib/prisma";
import { eventBus } from "@/lib/event-bus";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      counter: { include: { facility: true } },
      staffUser: { select: { id: true, name: true } },
      transcriptEntries: { orderBy: { sequenceNo: "asc" } },
      importantItems: { orderBy: { createdAt: "asc" } },
      confirmationActions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json(session);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.status === "active" && session.status === "waiting") {
    updateData.status = "active";
    updateData.startedAt = new Date();
  } else if (body.status === "ended") {
    updateData.status = "ended";
    updateData.endedAt = new Date();
  }

  if (body.visitorLabel !== undefined) {
    updateData.visitorLabel = body.visitorLabel;
  }
  if (body.staffUserId !== undefined) {
    updateData.staffUserId = body.staffUserId;
  }

  const updated = await prisma.session.update({
    where: { id },
    data: updateData,
    include: {
      counter: { include: { facility: true } },
      staffUser: { select: { id: true, name: true } },
    },
  });

  eventBus.emit({
    type: body.status === "ended" ? "session.ended" : "session.updated",
    sessionId: id,
    data: updated,
  });

  return Response.json(updated);
}
