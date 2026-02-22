import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { attendanceRecords, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    const imported: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => (row[h] = values[idx]));

      try {
        const user = await db.query.users.findFirst({
          where: eq(users.employeeCode, row.employee_code || row.employeeCode),
        });

        if (!user) {
          errors.push(`Row ${i + 1}: Employee not found (${row.employee_code || row.employeeCode})`);
          continue;
        }

        const [record] = await db
          .insert(attendanceRecords)
          .values({
            userId: user.id,
            date: row.date,
            clockIn: row.clock_in ? new Date(row.clock_in) : null,
            clockOut: row.clock_out ? new Date(row.clock_out) : null,
            status: (row.status as any) || "present",
          })
          .returning();

        imported.push(record);
      } catch (err) {
        errors.push(`Row ${i + 1}: ${(err as Error).message}`);
      }
    }

    return NextResponse.json({
      imported: imported.length,
      errors,
    });
  } catch (error) {
    console.error("POST /api/attendance/import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
