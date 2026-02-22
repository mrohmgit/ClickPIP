import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  users,
  attendanceRecords,
  tasks,
  pipRecords,
  assessmentSubmissions,
} from "@/db/schema";
import { eq, count, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["admin", "super_admin", "manager"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");

    // Gather aggregate data for insights
    const totalEmployees = await db.select({ total: count() }).from(users);

    const activePips = await db
      .select({ total: count() })
      .from(pipRecords)
      .where(eq(pipRecords.status, "active"));

    const pendingTasks = await db
      .select({ total: count() })
      .from(tasks)
      .where(eq(tasks.status, "todo"));

    const overdueTasks = await db
      .select({ total: count() })
      .from(tasks)
      .where(eq(tasks.status, "in_progress"));

    const recommendations: string[] = [];

    if ((activePips[0]?.total ?? 0) > 0) {
      recommendations.push(
        `There are ${activePips[0]?.total} active PIPs requiring manager attention.`
      );
    }
    if ((pendingTasks[0]?.total ?? 0) > 10) {
      recommendations.push(
        `${pendingTasks[0]?.total} tasks are pending assignment or action.`
      );
    }

    const insights = [
      {
        type: "summary",
        title: "Workforce Overview",
        data: {
          totalEmployees: totalEmployees[0]?.total ?? 0,
          activePips: activePips[0]?.total ?? 0,
          pendingTasks: pendingTasks[0]?.total ?? 0,
          inProgressTasks: overdueTasks[0]?.total ?? 0,
        },
      },
      {
        type: "recommendation",
        title: "Actionable Insights",
        items: recommendations,
      },
    ];

    return NextResponse.json(insights);
  } catch (error) {
    console.error("GET /api/ai-hr/insights error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
