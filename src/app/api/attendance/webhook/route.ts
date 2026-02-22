import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceRecords, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    if (secret !== process.env.ATTENDANCE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }

    const body = await req.json();
    const { employeeCode, timestamp, type } = body;

    // Look up user by employee code
    const user = await db.query.users.findFirst({
      where: eq(users.employeeCode, employeeCode),
    });

    if (!user) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const scanDate = new Date(timestamp);
    const dateStr = scanDate.toISOString().split("T")[0];

    if (type === "clock_in") {
      const [record] = await db
        .insert(attendanceRecords)
        .values({
          userId: user.id,
          date: dateStr,
          clockIn: scanDate,
          status: "present",
          rawData: body,
        })
        .returning();
      return NextResponse.json(record, { status: 201 });
    }

    if (type === "clock_out") {
      // Find existing record for today and update clock out
      const existing = await db.query.attendanceRecords.findFirst({
        where: eq(attendanceRecords.userId, user.id),
      });

      if (existing) {
        const [updated] = await db
          .update(attendanceRecords)
          .set({ clockOut: scanDate, rawData: body })
          .where(eq(attendanceRecords.id, existing.id))
          .returning();
        return NextResponse.json(updated);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/attendance/webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
