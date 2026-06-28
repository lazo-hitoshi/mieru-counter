import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const facilityId = request.nextUrl.searchParams.get("facilityId");
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  const category = request.nextUrl.searchParams.get("category");
  const includeInactive = request.nextUrl.searchParams.get("includeInactive");

  const where: Record<string, unknown> = {};
  if (!includeInactive) where.isActive = true;
  if (facilityId) where.facilityId = facilityId;
  if (organizationId) where.organizationId = organizationId;
  if (category) where.category = category;

  const templates = await prisma.messageTemplate.findMany({
    where,
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return Response.json(templates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { category, title, bodyText, sortOrder } = body;

  if (!category || !title || !bodyText) {
    return Response.json(
      { error: "category, title, bodyText は必須です" },
      { status: 400 }
    );
  }

  const org = await prisma.organization.findFirst();
  if (!org) {
    return Response.json(
      { error: "組織データが見つかりません" },
      { status: 500 }
    );
  }

  const maxSort = await prisma.messageTemplate.aggregate({
    _max: { sortOrder: true },
    where: { category },
  });

  const template = await prisma.messageTemplate.create({
    data: {
      organizationId: org.id,
      category,
      title,
      body: bodyText,
      sortOrder: sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  return Response.json(template, { status: 201 });
}
