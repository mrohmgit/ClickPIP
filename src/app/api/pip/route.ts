import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pipRecords, users } from "@/db/schema";
import { eq, and, type SQL } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const departmentId = searchParams.get("departmentId");
    const employeeId = searchParams.get("employeeId");

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(pipRecords.status, status as any));
    if (employeeId) conditions.push(eq(pipRecords.employeeId, employeeId));

    let result = await db.query.pipRecords.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { employee: true, manager: true },
      orderBy: (pipRecords, { desc }) => [desc(pipRecords.createdAt)],
    });

    // Filter by department through the employee relation
    if (departmentId) {
      result = result.filter((r: any) => r.employee?.departmentId === departmentId);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/pip error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["admin", "super_admin", "manager"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const [record] = await db
      .insert(pipRecords)
      .values({ ...body, managerId: body.managerId || session.user.id })
      .returning();

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("POST /api/pip error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
