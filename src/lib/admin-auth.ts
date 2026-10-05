import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { optionalEnv, signingSecret } from "@/lib/env";

export const ADMIN_COOKIE = "ncj_admin_session";

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const unb64url = (input: string) =>
  Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");

export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

/**
 * Shares ORDER_SIGNING_SECRET with receipt links so one secret protects both
 * surfaces. Falls back through AUTH_SECRET and the Razorpay secret rather than
 * failing open; rotating it invalidates existing admin sessions and receipt links.
 */
const sessionSecret = () => signingSecret();

export function createAdminSession(email: string, ttlMs = ADMIN_SESSION_TTL_MS): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${email}.${expiresAt}`;
  const signature = b64url(
    crypto.createHmac("sha256", sessionSecret()).update(payload).digest()
  );
  return `${b64url(payload)}.${signature}`;
}

export function verifyAdminSession(token: unknown): { ok: boolean; email?: string } {
  if (typeof token !== "string" || !token) return { ok: false };

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false };

  let payload: string;
  try {
    payload = unb64url(parts[0]).toString("utf8");
  } catch {
    return { ok: false };
  }

  const dot = payload.lastIndexOf(".");
  if (dot < 1) return { ok: false };

  const email = payload.slice(0, dot);
  const expiresAt = Number(payload.slice(dot + 1));

  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return { ok: false };

  const expected = b64url(
    crypto.createHmac("sha256", sessionSecret()).update(payload).digest()
  );
  const received = Buffer.from(parts[1], "utf8");
  const computed = Buffer.from(expected, "utf8");
  if (received.length !== computed.length) return { ok: false };
  if (!crypto.timingSafeEqual(received, computed)) return { ok: false };

  const adminEmail = optionalEnv("ADMIN_EMAIL");
  if (adminEmail && email.toLowerCase() !== adminEmail.toLowerCase()) {
    return { ok: false };
  }

  return { ok: true, email };
}

/** Constant-time credential check. Both sides are hashed first so the length of
 *  the stored secret does not leak through timing. */
export function checkAdminCredentials(email: string, password: string): boolean {
  const expectedEmail = optionalEnv("ADMIN_EMAIL");
  const expectedPassword = optionalEnv("ADMIN_PASSWORD");
  if (!expectedEmail || !expectedPassword) return false;

  const digest = (value: string) =>
    crypto.createHash("sha256").update(value, "utf8").digest();

  const emailOk = crypto.timingSafeEqual(
    digest(email.trim().toLowerCase()),
    digest(expectedEmail.trim().toLowerCase())
  );
  const passwordOk = crypto.timingSafeEqual(
    digest(password),
    digest(expectedPassword)
  );

  return emailOk && passwordOk;
}

export function adminIsConfigured(): boolean {
  return Boolean(optionalEnv("ADMIN_EMAIL") && optionalEnv("ADMIN_PASSWORD"));
}

/** Guard for every protected admin page. Redirects to the login screen. */
export async function requireAdmin(): Promise<string> {
  const store = await cookies();
  const session = verifyAdminSession(store.get(ADMIN_COOKIE)?.value);
  if (!session.ok) redirect("/admin/login");
  return session.email as string;
}

export const adminCookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
};