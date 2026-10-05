import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  adminIsConfigured,
  checkAdminCredentials,
  createAdminSession,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!adminIsConfigured()) {
    return NextResponse.json(
      {
        error:
          "Admin access is not configured on this deployment. Set ADMIN_EMAIL, ADMIN_PASSWORD and ORDER_SIGNING_SECRET.",
      },
      { status: 503 }
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  if (!checkAdminCredentials(email, password)) {
    // Deliberately vague, and slow responses are not needed here because both
    // comparisons are constant time.
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminSession(email.trim().toLowerCase()), adminCookieOptions);
  return response;
}