import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { assessmentCycles } from "@/db/schema";
import { eq, and, type SQL } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(assessmentCycles.status, status as any));

    const cycles = await db.query.assessmentCycles.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: (assessmentCycles, { desc }) => [desc(assessmentCycles.createdAt)],
    });

    return NextResponse.json(cycles);
  } catch (error) {
    console.error("GET /api/assessments/cycles error:", error);
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
    const [cycle] = await db.insert(assessmentCycles).values(body).returning();

    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    console.error("POST /api/assessments/cycles error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
