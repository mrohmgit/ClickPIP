import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { overtimeRequests } from "@/db/schema";
import { eq, and, type SQL } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(overtimeRequests.status, status as any));
    if (userId) conditions.push(eq(overtimeRequests.userId, userId));

    const requests = await db.query.overtimeRequests.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { user: true, approver: true },
      orderBy: (overtimeRequests, { desc }) => [desc(overtimeRequests.createdAt)],
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/attendance/overtime error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const [request] = await db
      .insert(overtimeRequests)
      .values({ ...body, userId: body.userId || session.user.id })
      .returning();

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("POST /api/attendance/overtime error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
