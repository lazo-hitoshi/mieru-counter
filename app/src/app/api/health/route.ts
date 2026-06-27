export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {};

  checks.DATABASE_URL_SET = !!process.env.DATABASE_URL;
  checks.DATABASE_URL_PREFIX = process.env.DATABASE_URL?.substring(0, 30) + "...";

  try {
    const { prisma } = await import("@/lib/prisma");
    checks.PRISMA_IMPORT = "ok";

    const count = await prisma.organization.count();
    checks.DB_CONNECTION = "ok";
    checks.ORG_COUNT = count;
  } catch (e: unknown) {
    const err = e as Error;
    checks.ERROR = err.message;
    checks.ERROR_STACK = err.stack?.split("\n").slice(0, 5);
  }

  return Response.json(checks, { status: checks.ERROR ? 500 : 200 });
}
