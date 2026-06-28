import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const { category, title, bodyText, isActive, sortOrder } = body;

  const data: Record<string, unknown> = {};
  if (category !== undefined) data.category = category;
  if (title !== undefined) data.title = title;
  if (bodyText !== undefined) data.body = bodyText;
  if (isActive !== undefined) data.isActive = isActive;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const template = await prisma.messageTemplate.update({
    where: { id },
    data,
  });

  return Response.json(template);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  await prisma.messageTemplate.delete({ where: { id } });

  return Response.json({ ok: true });
}
