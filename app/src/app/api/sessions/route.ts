import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const facilityId = request.nextUrl.searchParams.get("facilityId");
  const status = request.nextUrl.searchParams.get("status");

  const where: Record<string, string> = {};
  if (facilityId) where.facilityId = facilityId;
  if (status) where.status = status;

  const sessions = await prisma.session.findMany({
    where,
    include: {
      counter: true,
      staffUser: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json(sessions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { counterId, staffUserId, visitorLabel, language } = body;

  const counter = await prisma.counter.findUnique({
    where: { id: counterId },
    include: { facility: true },
  });

  if (!counter) {
    return Response.json({ error: "Counter not found" }, { status: 404 });
  }

  const session = await prisma.session.create({
    data: {
      id: randomUUID(),
      organizationId: counter.facility.organizationId,
      facilityId: counter.facilityId,
      counterId: counter.id,
      staffUserId: staffUserId || null,
      sessionCode: randomUUID().slice(0, 8).toUpperCase(),
      status: "waiting",
      visitorLabel: visitorLabel || null,
      language: language || "ja",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    include: {
      counter: true,
      staffUser: { select: { id: true, name: true } },
    },
  });

  return Response.json(session, { status: 201 });
}
