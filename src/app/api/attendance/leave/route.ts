import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { eq, and, type SQL } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(leaveRequests.status, status as any));
    if (userId) conditions.push(eq(leaveRequests.userId, userId));

    const requests = await db.query.leaveRequests.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { user: true, leaveType: true, approver: true },
      orderBy: (leaveRequests, { desc }) => [desc(leaveRequests.createdAt)],
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/attendance/leave error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const [request] = await db
      .insert(leaveRequests)
      .values({ ...body, userId: body.userId || session.user.id })
      .returning();

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("POST /api/attendance/leave error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
