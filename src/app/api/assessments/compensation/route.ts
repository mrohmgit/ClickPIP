import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { compensationPlans } from "@/db/schema";
import { eq, and, type SQL } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get("cycleId");
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const conditions: SQL[] = [];
    if (cycleId) conditions.push(eq(compensationPlans.assessmentCycleId, cycleId));
    if (employeeId) conditions.push(eq(compensationPlans.employeeId, employeeId));
    if (status) conditions.push(eq(compensationPlans.status, status as any));

    const plans = await db.query.compensationPlans.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { employee: true, assessmentCycle: true, approver: true },
      orderBy: (compensationPlans, { desc }) => [desc(compensationPlans.createdAt)],
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("GET /api/assessments/compensation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const [plan] = await db.insert(compensationPlans).values(body).returning();

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("POST /api/assessments/compensation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
