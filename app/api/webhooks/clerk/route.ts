import { NextResponse } from 'next/server';
import { ensureClerkUserSynced } from '@/lib/syncClerk';
import { Webhook } from 'svix';

/**
 * Clerk webhook handler.
 * - Verifies signature when CLERK_WEBHOOK_SECRET is set (svix).
 * - Calls ensureClerkUserSynced for user.created and user.updated events.
 */
export async function POST(req: Request) {
  try {
    const text = await req.text();

    // Decide whether to verify signature
    const signingSecret = process.env.CLERK_WEBHOOK_SECRET;
    const signatureHeader = req.headers.get('Clerk-Signature') ?? req.headers.get('clerk-signature');

    let body: unknown;

    if (signingSecret) {
      if (!signatureHeader) {
        console.warn('Missing Clerk-Signature header while CLERK_WEBHOOK_SECRET is set');
        return NextResponse.json({ error: 'missing signature' }, { status: 401 });
      }

      try {
        const wh = new Webhook(signingSecret);
        // verify returns the parsed JSON payload (or throws)
        // svix's types may be untyped; treat the result as unknown
  // @ts-expect-error - svix verify may not have perfect types
  body = wh.verify(text, signatureHeader);
      } catch (err) {
        console.error('Invalid webhook signature', err);
        return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
      }
    } else {
      try {
        body = JSON.parse(text || '{}');
      } catch (err) {
        console.error('Failed to parse webhook body as JSON', err);
        return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
      }
    }

    // Safely access properties on the parsed payload
    const asRecord = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {});
    const r = asRecord(body);
    const eventType = (r.type ?? r.event ?? r.name) as string | undefined;
    const data = asRecord(r.data);

    const tryGetIdFromObject = (obj: unknown): string | undefined => {
      if (typeof obj === 'object' && obj !== null) {
        const o = obj as Record<string, unknown>;
        const idCandidate = o['id'] ?? o['user_id'] ?? o['userId'];
        if (typeof idCandidate === 'string') return idCandidate;

        const userObj = o['user'];
        if (typeof userObj === 'object' && userObj !== null) {
          const u = userObj as Record<string, unknown>;
          const nestedId = u['id'] ?? u['user_id'] ?? u['userId'];
          if (typeof nestedId === 'string') return nestedId;
        }
      }
      return undefined;
    };

    const maybeUserId =
      (typeof data.id === 'string' && data.id) ||
      tryGetIdFromObject(data.user) ||
      (typeof data.user_id === 'string' && data.user_id) ||
      (typeof r.user_id === 'string' && (r.user_id as string)) ||
      tryGetIdFromObject(data.object) ||
      undefined;

    if (eventType && (eventType.startsWith('user.') || eventType.includes('user'))) {
      const userId = typeof maybeUserId === 'string' ? maybeUserId : undefined;
      if (userId) {
        ensureClerkUserSynced(userId).catch((err) => {
          console.error('Failed to sync Clerk user from webhook:', err);
        });
      } else {
        console.warn('Clerk webhook user event received but no user id found', { eventType, body });
      }
    } else {
      console.debug('Ignored non-user Clerk webhook event', { eventType });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook handler error', err);
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, note: 'Clerk webhook handler alive' });
}

/*
  Notes:
  - Set CLERK_WEBHOOK_SECRET in your environment to enable signature verification.
  - The handler uses svix's Webhook.verify to validate the `Clerk-Signature` header.
*/
