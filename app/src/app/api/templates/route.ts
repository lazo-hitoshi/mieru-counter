import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const facilityId = request.nextUrl.searchParams.get("facilityId");
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  const category = request.nextUrl.searchParams.get("category");

  const where: Record<string, unknown> = { isActive: true };
  if (facilityId) where.facilityId = facilityId;
  if (organizationId) where.organizationId = organizationId;
  if (category) where.category = category;

  const templates = await prisma.messageTemplate.findMany({
    where,
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return Response.json(templates);
}
