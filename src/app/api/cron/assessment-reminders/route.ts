import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  assessmentCycles,
  assessmentSubmissions,
  notifications,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find open assessment cycles
    const openCycles = await db.query.assessmentCycles.findMany({
      where: eq(assessmentCycles.status, "open"),
      with: {
        submissions: true,
      },
    });

    let remindersSent = 0;

    for (const cycle of openCycles) {
      // Find submissions that are still pending
      const pendingSubmissions = cycle.submissions.filter(
        (s) => s.status === "pending"
      );

      for (const submission of pendingSubmissions) {
        // Check if self-assessment deadline is approaching (within 3 days)
        if (cycle.selfAssessmentDeadline) {
          const deadline = new Date(cycle.selfAssessmentDeadline);
          const now = new Date();
          const daysUntilDeadline = Math.ceil(
            (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilDeadline <= 3 && daysUntilDeadline > 0) {
            await db.insert(notifications).values({
              userId: submission.employeeId,
              type: "assessment_reminder",
              title: "Assessment Deadline Approaching",
              body: `Your self-assessment for "${cycle.name}" is due in ${daysUntilDeadline} day(s).`,
              link: `/assessments/${cycle.id}`,
            });
            remindersSent++;
          }
        }
      }

      // Find submissions waiting for manager review
      const reviewSubmissions = cycle.submissions.filter(
        (s) => s.status === "self_assessed"
      );

      for (const submission of reviewSubmissions) {
        if (submission.managerId && cycle.managerReviewDeadline) {
          const deadline = new Date(cycle.managerReviewDeadline);
          const now = new Date();
          const daysUntilDeadline = Math.ceil(
            (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilDeadline <= 3 && daysUntilDeadline > 0) {
            await db.insert(notifications).values({
              userId: submission.managerId,
              type: "assessment_reminder",
              title: "Manager Review Deadline Approaching",
              body: `Your review for "${cycle.name}" is due in ${daysUntilDeadline} day(s).`,
              link: `/assessments/${cycle.id}/review`,
            });
            remindersSent++;
          }
        }
      }
    }

    return NextResponse.json({
      cyclesChecked: openCycles.length,
      remindersSent,
    });
  } catch (error) {
    console.error("POST /api/cron/assessment-reminders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
