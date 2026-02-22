import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dynamic import to avoid build-time errors when DATABASE_URL is missing
    const { db } = await import('@/db');
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 503 }
    );
  }
}
