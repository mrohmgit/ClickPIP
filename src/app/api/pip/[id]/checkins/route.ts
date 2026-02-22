import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pipCheckins } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const checkins = await db.query.pipCheckins.findMany({
      where: eq(pipCheckins.pipId, id),
      with: { creator: true },
      orderBy: (pipCheckins, { desc }) => [desc(pipCheckins.createdAt)],
    });

    return NextResponse.json(checkins);
  } catch (error) {
    console.error("GET /api/pip/[id]/checkins error:", error);
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
    const [checkin] = await db
      .insert(pipCheckins)
      .values({ ...body, pipId: id, createdBy: session.user.id })
      .returning();

    return NextResponse.json(checkin, { status: 201 });
  } catch (error) {
    console.error("POST /api/pip/[id]/checkins error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
