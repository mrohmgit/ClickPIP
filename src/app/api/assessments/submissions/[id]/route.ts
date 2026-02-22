import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { assessmentSubmissions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const submission = await db.query.assessmentSubmissions.findFirst({
      where: eq(assessmentSubmissions.id, id),
      with: { employee: true, manager: true, cycle: true },
    });

    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("GET /api/assessments/submissions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const [updated] = await db
      .update(assessmentSubmissions)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(assessmentSubmissions.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/assessments/submissions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
