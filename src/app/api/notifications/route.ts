import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const conditions = [eq(notifications.userId, session.user.id)];
    if (unreadOnly) conditions.push(eq(notifications.isRead, false));

    const result = await db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { ids, markAll } = body;

    if (markAll) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, session.user.id),
            eq(notifications.isRead, false)
          )
        );
      return NextResponse.json({ success: true });
    }

    if (ids && Array.isArray(ids)) {
      for (const id of ids) {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(
            and(eq(notifications.id, id), eq(notifications.userId, session.user.id))
          );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
