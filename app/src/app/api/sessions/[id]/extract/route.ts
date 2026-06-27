import { prisma } from "@/lib/prisma";
import { eventBus } from "@/lib/event-bus";
import { extractor } from "@/lib/extraction";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { text, transcriptEntryId } = body;

  const session = await prisma.session.findUnique({
    where: { id },
    include: { counter: { include: { facility: true } } },
  });

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const candidates = await extractor.extract(text, {
    facilityType: session.counter.facility.facilityType,
    language: session.language,
  });

  const items = await Promise.all(
    candidates.map((c) =>
      prisma.importantItem.create({
        data: {
          id: randomUUID(),
          sessionId: id,
          sourceTranscriptEntryId: transcriptEntryId || null,
          itemType: c.itemType,
          title: c.title,
          body: c.body,
          priority: c.priority,
          extractionSource: "rule",
          reviewStatus: "candidate",
          metadataJson: c.metadata ? JSON.stringify(c.metadata) : null,
        },
      })
    )
  );

  for (const item of items) {
    eventBus.emit({
      type: "important_item.candidate",
      sessionId: id,
      data: item,
    });
  }

  return Response.json(items, { status: 201 });
}
