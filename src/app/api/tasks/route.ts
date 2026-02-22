import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq, and, type SQL } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedTo = searchParams.get("assignedTo");
    const departmentId = searchParams.get("departmentId");

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(tasks.status, status as any));
    if (priority) conditions.push(eq(tasks.priority, priority as any));
    if (assignedTo) conditions.push(eq(tasks.assignedTo, assignedTo));
    if (departmentId) conditions.push(eq(tasks.departmentId, departmentId));

    const result = await db.query.tasks.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { assignee: true, assigner: true, department: true },
      orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const [task] = await db
      .insert(tasks)
      .values({ ...body, assignedBy: body.assignedBy || session.user.id })
      .returning();

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
