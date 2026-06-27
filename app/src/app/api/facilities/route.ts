import { prisma } from "@/lib/prisma";

export async function GET() {
  const facilities = await prisma.facility.findMany({
    where: { status: "active" },
    include: {
      organization: { select: { id: true, name: true } },
      counters: { where: { status: "active" }, orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  return Response.json(facilities);
}
