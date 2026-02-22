import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { assessmentCycles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { cycleId } = await params;
    const cycle = await db.query.assessmentCycles.findFirst({
      where: eq(assessmentCycles.id, cycleId),
      with: { submissions: { with: { employee: true, manager: true } } },
    });

    if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 });

    return NextResponse.json(cycle);
  } catch (error) {
    console.error("GET /api/assessments/cycles/[cycleId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { cycleId } = await params;
    const body = await req.json();
    const [updated] = await db
      .update(assessmentCycles)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(assessmentCycles.id, cycleId))
      .returning();

    if (!updated) return NextResponse.json({ error: "Cycle not found" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/assessments/cycles/[cycleId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
