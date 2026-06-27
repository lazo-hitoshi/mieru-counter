import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const item = await prisma.importantItem.findUnique({ where: { id } });
  if (!item) {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.body !== undefined) updateData.body = body.body;
  if (body.itemType !== undefined) updateData.itemType = body.itemType;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.reviewStatus !== undefined)
    updateData.reviewStatus = body.reviewStatus;
  if (body.reviewedByUserId !== undefined)
    updateData.reviewedByUserId = body.reviewedByUserId;

  const updated = await prisma.importantItem.update({
    where: { id },
    data: updateData,
  });

  return Response.json(updated);
}
