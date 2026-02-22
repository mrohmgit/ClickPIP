import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { attendanceSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const departmentId = searchParams.get("departmentId");

    let settings;
    if (departmentId) {
      settings = await db.query.attendanceSettings.findFirst({
        where: eq(attendanceSettings.departmentId, departmentId),
      });
    } else if (organizationId) {
      settings = await db.query.attendanceSettings.findFirst({
        where: eq(attendanceSettings.organizationId, organizationId),
      });
    } else {
      settings = await db.query.attendanceSettings.findMany();
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/attendance/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    if (body.id) {
      const [updated] = await db
        .update(attendanceSettings)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(attendanceSettings.id, body.id))
        .returning();
      return NextResponse.json(updated);
    }

    const [created] = await db.insert(attendanceSettings).values(body).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("PUT /api/attendance/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
