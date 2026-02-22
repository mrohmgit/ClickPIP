import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pipRecords } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const record = await db.query.pipRecords.findFirst({
      where: eq(pipRecords.id, id),
      with: {
        employee: true,
        manager: true,
        goals: true,
        checkins: { with: { creator: true } },
        comments: { with: { user: true } },
        evaluations: { with: { evaluator: true } },
      },
    });

    if (!record) return NextResponse.json({ error: "PIP record not found" }, { status: 404 });

    return NextResponse.json(record);
  } catch (error) {
    console.error("GET /api/pip/[id] error:", error);
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
      .update(pipRecords)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(pipRecords.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "PIP record not found" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/pip/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const [deleted] = await db.delete(pipRecords).where(eq(pipRecords.id, id)).returning();

    if (!deleted) return NextResponse.json({ error: "PIP record not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/pip/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
