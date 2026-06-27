import { prisma } from "@/lib/prisma";
import { eventBus } from "@/lib/event-bus";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const entries = await prisma.transcriptEntry.findMany({
    where: { sessionId: id },
    orderBy: { sequenceNo: "asc" },
  });

  return Response.json(entries);
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
  if (session.status === "ended") {
    return Response.json({ error: "Session has ended" }, { status: 400 });
  }

  const lastEntry = await prisma.transcriptEntry.findFirst({
    where: { sessionId: id },
    orderBy: { sequenceNo: "desc" },
  });

  const sequenceNo = (lastEntry?.sequenceNo ?? 0) + 1;

  const displayText =
    body.displayText || truncateForLens(body.originalText || body.text);

  const entry = await prisma.transcriptEntry.create({
    data: {
      id: randomUUID(),
      sessionId: id,
      speakerType: body.speakerType || "staff",
      speakerName: body.speakerName || null,
      source: body.source || "manual",
      originalText: body.originalText || body.text,
      displayText,
      language: body.language || session.language,
      confidence: body.confidence || null,
      sequenceNo,
      createdByUserId: body.createdByUserId || null,
    },
  });

  if (session.status === "waiting") {
    await prisma.session.update({
      where: { id },
      data: { status: "active", startedAt: new Date() },
    });
  }

  eventBus.emit({
    type: "transcript.created",
    sessionId: id,
    data: entry,
  });

  return Response.json(entry, { status: 201 });
}

function truncateForLens(text: string, maxLen = 40): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "…";
}
