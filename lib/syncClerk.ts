import { db } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';

export type SyncClerkUserInput = {
  clerkUserId: string;
  email: string;
  fullName?: string | null;
  whatsappE164?: string | null;
  role?: 'attendee' | 'admin' | 'gate' | 'support';
  profileCompletedAt?: Date | null;
};

/**
 * Upsert a Clerk user into the local Postgres `users` table.
 * This is intentionally small and resilient: it first tries to find
 * an existing user by `clerk_user_id` and then inserts or updates.
 */
export async function syncClerkUser(input: SyncClerkUserInput) {
  const { clerkUserId, email, fullName, whatsappE164, role, profileCompletedAt } = input;

  // Find existing
  const existing = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId));

  if (existing.length > 0) {
    const existingRow = existing[0];
    await db
      .update(users)
      .set({
        email: email ?? existingRow.email,
        fullName: fullName ?? existingRow.fullName,
        whatsappE164: whatsappE164 ?? existingRow.whatsappE164,
        role: role ?? existingRow.role,
        profileCompletedAt: profileCompletedAt ?? existingRow.profileCompletedAt,
      })
      .where(eq(users.clerkUserId, clerkUserId));
    return { action: 'updated' as const, clerkUserId };
  }

  // Insert new
  await db.insert(users).values({
    clerkUserId,
    email,
    fullName: fullName ?? null,
    whatsappE164: whatsappE164 ?? null,
    role: role ?? 'attendee',
    profileCompletedAt: profileCompletedAt ?? null,
  });

  return { action: 'inserted' as const, clerkUserId };
}

export default syncClerkUser;

/**
 * Fetch the Clerk user by id and upsert into the local DB using the mapping logic.
 * This is useful to ensure the DB matches Clerk (authoritative) state.
 */
export async function ensureClerkUserSynced(clerkUserId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);

  const email =
    (user.primaryEmailAddress && user.primaryEmailAddress.emailAddress) ||
    (user.emailAddresses && user.emailAddresses[0] && user.emailAddresses[0].emailAddress) ||
    '';

  const publicMd = (user.publicMetadata || {}) as unknown as Record<string, unknown>;

  return syncClerkUser({
    clerkUserId,
    email,
    fullName: user.fullName ?? null,
    whatsappE164: publicMd.whatsapp ? String(publicMd.whatsapp) : null,
    profileCompletedAt: null,
  });
}
