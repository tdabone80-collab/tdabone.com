// app/api/check-in/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    const { token } = await req.json();
    // TODO: lookup ticket by token, validate, mark checked_in_at, etc.
    return Response.json({ ok: true, token });
}