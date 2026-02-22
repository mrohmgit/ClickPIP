import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, ilike, type SQL } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const departmentId = searchParams.get("departmentId");
    const search = searchParams.get("search");

    const conditions: SQL[] = [];
    if (role) conditions.push(eq(users.role, role as any));
    if (departmentId) conditions.push(eq(users.departmentId, departmentId));
    if (search) conditions.push(ilike(users.name, `%${search}%`));

    const result = await db.query.users.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { department: true },
      orderBy: (users, { asc }) => [asc(users.name)],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/users error:", error);
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
    const [newUser] = await db.insert(users).values(body).returning();

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
