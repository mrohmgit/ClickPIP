import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  attendanceRecords,
  attendanceSettings,
  notifications,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Get all active employees
    const allUsers = await db.query.users.findMany({
      where: eq(users.role, "employee"),
    });

    // Check who has no attendance record for today
    const absent: string[] = [];
    for (const user of allUsers) {
      const record = await db.query.attendanceRecords.findFirst({
        where: and(
          eq(attendanceRecords.userId, user.id),
          eq(attendanceRecords.date, today)
        ),
      });

      if (!record) {
        absent.push(user.id);

        // Create absent record
        await db.insert(attendanceRecords).values({
          userId: user.id,
          date: today,
          status: "absent",
        });

        // Notify manager if exists
        if (user.managerId) {
          await db.insert(notifications).values({
            userId: user.managerId,
            type: "attendance_alert",
            title: "Employee Absent",
            body: `${user.name} has no attendance record for today.`,
            link: "/attendance",
          });
        }
      }
    }

    return NextResponse.json({
      date: today,
      checked: allUsers.length,
      absent: absent.length,
    });
  } catch (error) {
    console.error("POST /api/cron/attendance-check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
