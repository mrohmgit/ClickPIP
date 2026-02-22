import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pipComments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const comments = await db.query.pipComments.findMany({
      where: eq(pipComments.pipId, id),
      with: { user: true },
      orderBy: (pipComments, { desc }) => [desc(pipComments.createdAt)],
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET /api/pip/[id]/comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const [comment] = await db
      .insert(pipComments)
      .values({ ...body, pipId: id, userId: session.user.id })
      .returning();

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/pip/[id]/comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
