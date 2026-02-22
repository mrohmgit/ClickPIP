import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  aiGuardrails,
  aiAlerts,
  users,
  attendanceRecords,
  tasks,
  pipRecords,
} from "@/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active guardrails
    const guardrails = await db.query.aiGuardrails.findMany({
      where: eq(aiGuardrails.isActive, true),
    });

    const alertsCreated: string[] = [];

    for (const guardrail of guardrails) {
      const conditions = guardrail.conditions as any;
      if (!conditions) continue;

      // Evaluate guardrail based on rule type
      if (guardrail.ruleType === "monitor_metric") {
        // Example: monitor attendance rate
        if (conditions.metric === "attendance_late_count") {
          const allEmployees = await db.query.users.findMany({
            where: eq(users.role, "employee"),
          });

          for (const employee of allEmployees) {
            const lateRecords = await db
              .select({ total: count() })
              .from(attendanceRecords)
              .where(
                and(
                  eq(attendanceRecords.userId, employee.id),
                  eq(attendanceRecords.isLate, true)
                )
              );

            const threshold = conditions.threshold || 5;
            if ((lateRecords[0]?.total ?? 0) >= threshold) {
              const [alert] = await db
                .insert(aiAlerts)
                .values({
                  guardrailId: guardrail.id,
                  userId: employee.id,
                  severity: "warning",
                  title: `High late attendance count`,
                  description: `${employee.name} has ${lateRecords[0]?.total} late attendance records.`,
                  recommendation: "Consider scheduling a check-in with the employee.",
                  data: { lateCount: lateRecords[0]?.total },
                  organizationId: guardrail.organizationId,
                })
                .returning();
              alertsCreated.push(alert.id);
            }
          }
        }
      }

      if (guardrail.ruleType === "alert_threshold") {
        if (conditions.metric === "overdue_tasks") {
          const overdueTasks = await db
            .select({ total: count() })
            .from(tasks)
            .where(eq(tasks.status, "in_progress"));

          const threshold = conditions.threshold || 20;
          if ((overdueTasks[0]?.total ?? 0) >= threshold) {
            const [alert] = await db
              .insert(aiAlerts)
              .values({
                guardrailId: guardrail.id,
                userId: guardrail.scopeId || "",
                severity: "critical",
                title: "High number of in-progress tasks",
                description: `There are ${overdueTasks[0]?.total} tasks currently in progress.`,
                recommendation: "Review task assignments and deadlines.",
                data: { taskCount: overdueTasks[0]?.total },
                organizationId: guardrail.organizationId,
              })
              .returning();
            alertsCreated.push(alert.id);
          }
        }
      }
    }

    return NextResponse.json({
      guardrailsEvaluated: guardrails.length,
      alertsCreated: alertsCreated.length,
    });
  } catch (error) {
    console.error("POST /api/cron/ai-monitoring error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
