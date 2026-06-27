import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const facilityId = request.nextUrl.searchParams.get("facilityId");

  if (!facilityId) {
    return Response.json(
      { error: "facilityId is required" },
      { status: 400 }
    );
  }

  const counters = await prisma.counter.findMany({
    where: { facilityId, status: "active" },
    orderBy: { name: "asc" },
  });

  return Response.json(counters);
}
