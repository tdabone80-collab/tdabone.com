import { NextResponse } from 'next/server';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import syncClerkUser from '@/lib/syncClerk';

export async function POST(req: Request) {
  try {
    // Using getAuth here — its types expect a Next.js request-like object; narrow the cast
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const payload = await req.json();
  const { name, email, whatsapp, gender, city, occupation } = payload || {};

  // Determine whether the profile should be considered "complete".
  // Rule (reasonable default): if the user provided a name and either an email or whatsapp, mark complete.
  const profileComplete = Boolean(name && (email || whatsapp));
  const profileCompletedAt = profileComplete ? new Date() : null;

    // Update Clerk public metadata server-side so client and server stay consistent
    const client = await clerkClient();
    try {
      // Clerk SDK types can be strict; pass an explicit object and let the client accept it.
      const updatePayload = {
        publicMetadata: {
          whatsapp,
          gender,
          city,
          occupation,
        },
        fullName: name || undefined,
      };

      await client.users.updateUser(userId, updatePayload as unknown as Record<string, unknown>);
    } catch (updateErr) {
      // non-fatal: continue to sync DB even if Clerk update fails
      console.error('Failed to update Clerk user:', updateErr);
    }

    // Upsert into our Postgres via Drizzle
    const res = await syncClerkUser({
      clerkUserId: userId,
      email: email || '',
      fullName: name || null,
      whatsappE164: whatsapp || null,
      profileCompletedAt,
    });

    return NextResponse.json({ ok: true, synced: res });
  } catch (err) {
    const e = err as Error | undefined;
    console.error('profile route error', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
