import crypto from "node:crypto";
import { signingSecret } from "@/lib/env";

/**
 * A receipt link lets the customer revisit their order after a refresh without
 * exposing customer details to anyone who guesses an order ID. The token is an
 * HMAC over the order ID and an expiry, so it cannot be forged or reused for a
 * different order.
 */
const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const unb64url = (input: string) =>
  Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");

const sign = (payload: string, secret: string) =>
  b64url(crypto.createHmac("sha256", secret).update(payload).digest());

export const RECEIPT_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function createReceiptToken(
  orderId: string,
  ttlMs: number = RECEIPT_TOKEN_TTL_MS
): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${orderId}.${expiresAt}`;
  return `${b64url(payload)}.${sign(payload, signingSecret())}`;
}

export function verifyReceiptToken(
  orderId: string,
  token: unknown
): { ok: true } | { ok: false; reason: string } {
  if (typeof token !== "string" || token.length === 0) {
    return { ok: false, reason: "missing_token" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed_token" };

  const [encodedPayload, signature] = parts;
  const payload = unb64url(encodedPayload).toString("utf8");
  const dot = payload.lastIndexOf(".");

  if (dot < 1) return { ok: false, reason: "malformed_token" };

  const tokenOrderId = payload.slice(0, dot);
  const expiresAt = Number(payload.slice(dot + 1));

  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return { ok: false, reason: "expired_token" };
  }

  if (tokenOrderId !== orderId) return { ok: false, reason: "order_mismatch" };

  const expected = sign(payload, signingSecret());
  const received = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");
  if (received.length !== computed.length) return { ok: false, reason: "bad_signature" };
  if (!crypto.timingSafeEqual(received, computed)) {
    return { ok: false, reason: "bad_signature" };
  }

  return { ok: true };
}