import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    // getAuth expects the Next.js request-like object; narrow as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const rows = await db.select().from(users).where(eq(users.clerkUserId, userId));
    if (!rows || rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const u = rows[0];
    // Only expose safe fields
    const out = {
      id: u.id,
      clerkUserId: u.clerkUserId,
      email: u.email,
      fullName: u.fullName,
      whatsappE164: u.whatsappE164,
      role: u.role,
      profileCompletedAt: u.profileCompletedAt,
    };

    return NextResponse.json({ ok: true, user: out });
  } catch (err) {
    console.error('GET /api/users/me error', err);
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}
