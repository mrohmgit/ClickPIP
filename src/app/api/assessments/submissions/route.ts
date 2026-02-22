import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { assessmentSubmissions } from "@/db/schema";
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
    if (cycleId) conditions.push(eq(assessmentSubmissions.cycleId, cycleId));
    if (employeeId) conditions.push(eq(assessmentSubmissions.employeeId, employeeId));
    if (status) conditions.push(eq(assessmentSubmissions.status, status as any));

    const submissions = await db.query.assessmentSubmissions.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { employee: true, manager: true, cycle: true },
      orderBy: (assessmentSubmissions, { desc }) => [desc(assessmentSubmissions.createdAt)],
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("GET /api/assessments/submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const [submission] = await db.insert(assessmentSubmissions).values(body).returning();

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("POST /api/assessments/submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
