import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { aiAlerts } from "@/db/schema";
import { eq, and, type SQL } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity");
    const isRead = searchParams.get("isRead");
    const isResolved = searchParams.get("isResolved");

    const conditions: SQL[] = [];
    if (severity) conditions.push(eq(aiAlerts.severity, severity as any));
    if (isRead !== null && isRead !== undefined) {
      conditions.push(eq(aiAlerts.isRead, isRead === "true"));
    }
    if (isResolved !== null && isResolved !== undefined) {
      conditions.push(eq(aiAlerts.isResolved, isResolved === "true"));
    }

    const alerts = await db.query.aiAlerts.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { guardrail: true, user: true },
      orderBy: (aiAlerts, { desc }) => [desc(aiAlerts.createdAt)],
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("GET /api/ai-hr/alerts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { ids, isRead, isResolved } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (isRead !== undefined) updateData.isRead = isRead;
    if (isResolved !== undefined) updateData.isResolved = isResolved;

    const updated = [];
    for (const id of ids) {
      const [result] = await db
        .update(aiAlerts)
        .set(updateData)
        .where(eq(aiAlerts.id, id))
        .returning();
      if (result) updated.push(result);
    }

    return NextResponse.json({ updated: updated.length });
  } catch (error) {
    console.error("PATCH /api/ai-hr/alerts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
