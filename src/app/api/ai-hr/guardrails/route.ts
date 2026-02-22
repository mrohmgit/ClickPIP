import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { aiGuardrails } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");

    let guardrails;
    if (isActive !== null) {
      guardrails = await db.query.aiGuardrails.findMany({
        where: eq(aiGuardrails.isActive, isActive === "true"),
        orderBy: (aiGuardrails, { desc }) => [desc(aiGuardrails.createdAt)],
      });
    } else {
      guardrails = await db.query.aiGuardrails.findMany({
        orderBy: (aiGuardrails, { desc }) => [desc(aiGuardrails.createdAt)],
      });
    }

    return NextResponse.json(guardrails);
  } catch (error) {
    console.error("GET /api/ai-hr/guardrails error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const [guardrail] = await db.insert(aiGuardrails).values(body).returning();

    return NextResponse.json(guardrail, { status: 201 });
  } catch (error) {
    console.error("POST /api/ai-hr/guardrails error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
