import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { attendanceRecords } from "@/db/schema";
import { eq, and, gte, lte, type SQL } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const conditions: SQL[] = [];
    if (userId) conditions.push(eq(attendanceRecords.userId, userId));
    if (startDate) conditions.push(gte(attendanceRecords.date, startDate));
    if (endDate) conditions.push(lte(attendanceRecords.date, endDate));

    const records = await db.query.attendanceRecords.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { user: true },
      orderBy: (attendanceRecords, { desc }) => [desc(attendanceRecords.date)],
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("GET /api/attendance/records error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const [record] = await db.insert(attendanceRecords).values(body).returning();

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("POST /api/attendance/records error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
