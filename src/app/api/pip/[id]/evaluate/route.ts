import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pipEvaluations, pipRecords } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["admin", "super_admin", "manager"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const [evaluation] = await db
      .insert(pipEvaluations)
      .values({
        ...body,
        pipId: id,
        evaluatorId: session.user.id,
      })
      .returning();

    // Update the PIP record with the evaluation result
    if (body.result) {
      await db
        .update(pipRecords)
        .set({
          result: body.result,
          overallRating: body.overallRating,
          status: body.result === "passed" ? "completed" : "failed",
          updatedAt: new Date(),
        })
        .where(eq(pipRecords.id, id));
    }

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    console.error("POST /api/pip/[id]/evaluate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
