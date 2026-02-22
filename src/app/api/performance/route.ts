import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  assessmentSubmissions,
  attendanceRecords,
  tasks,
  pipRecords,
  users,
} from "@/db/schema";
import { eq, and, gte, lte, count, avg } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const departmentId = searchParams.get("departmentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!userId && !departmentId) {
      return NextResponse.json(
        { error: "userId or departmentId is required" },
        { status: 400 }
      );
    }

    if (userId) {
      // Individual performance
      const [latestAssessment] = await db
        .select()
        .from(assessmentSubmissions)
        .where(eq(assessmentSubmissions.employeeId, userId))
        .orderBy(assessmentSubmissions.createdAt)
        .limit(1);

      const taskStats = await db
        .select({
          total: count(),
        })
        .from(tasks)
        .where(eq(tasks.assignedTo, userId));

      const completedTasks = await db
        .select({
          total: count(),
        })
        .from(tasks)
        .where(and(eq(tasks.assignedTo, userId), eq(tasks.status, "done")));

      const activePips = await db
        .select({ total: count() })
        .from(pipRecords)
        .where(and(eq(pipRecords.employeeId, userId), eq(pipRecords.status, "active")));

      return NextResponse.json({
        userId,
        assessment: latestAssessment
          ? {
              finalScore: latestAssessment.finalScore,
              finalGrade: latestAssessment.finalGrade,
            }
          : null,
        tasks: {
          total: taskStats[0]?.total ?? 0,
          completed: completedTasks[0]?.total ?? 0,
        },
        activePips: activePips[0]?.total ?? 0,
      });
    }

    // Department performance
    if (departmentId) {
      const deptUsers = await db.query.users.findMany({
        where: eq(users.departmentId, departmentId),
      });

      const userIds = deptUsers.map((u) => u.id);

      const totalTasks = await db
        .select({ total: count() })
        .from(tasks)
        .where(eq(tasks.departmentId, departmentId));

      const completedTasks = await db
        .select({ total: count() })
        .from(tasks)
        .where(and(eq(tasks.departmentId, departmentId), eq(tasks.status, "done")));

      return NextResponse.json({
        departmentId,
        employeeCount: deptUsers.length,
        tasks: {
          total: totalTasks[0]?.total ?? 0,
          completed: completedTasks[0]?.total ?? 0,
        },
      });
    }
  } catch (error) {
    console.error("GET /api/performance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
