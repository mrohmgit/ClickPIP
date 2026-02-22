import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { overtimeRequests } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
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

    const [updated] = await db
      .update(overtimeRequests)
      .set({
        status: body.status,
        approvedBy: session.user.id,
        approvedAt: new Date(),
      })
      .where(eq(overtimeRequests.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/attendance/overtime/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
