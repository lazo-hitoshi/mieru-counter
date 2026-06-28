import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const session = await prisma.session.findUnique({
    where: { sessionCode: code },
    include: {
      counter: { include: { facility: true } },
    },
  });

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status === "ended" || session.status === "expired") {
    return Response.json({ error: "Session is no longer active" }, { status: 410 });
  }

  if (new Date() > session.expiresAt) {
    return Response.json({ error: "Session has expired" }, { status: 410 });
  }

  let staffDisplayName: string | null = null;
  if (session.metadataJson) {
    try {
      const meta = JSON.parse(session.metadataJson);
      if (meta.staffDisplayName) staffDisplayName = meta.staffDisplayName;
    } catch { /* ignore */ }
  }

  return Response.json({
    sessionId: session.id,
    facilityName: session.counter.facility.name,
    counterName: session.counter.name,
    staffDisplayName,
    status: session.status,
    language: session.language,
  });
}
