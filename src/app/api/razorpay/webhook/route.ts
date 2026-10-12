import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { databaseConfigured, optionalEnv, razorpayConfigured } from "@/lib/env";
import { reconcileOrderPayment } from "@/lib/payment-reconciliation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay webhook handler.
 *
 * Authenticates the delivery by HMAC over the raw body, then hands the decision
 * to reconcileOrderPayment, which re-reads the payment from Razorpay's own API
 * and only settles on `captured`.
 *
 * The webhook payload carries no checkout signature - that exists only on the
 * browser callback - so authenticity here comes from the webhook HMAC plus the
 * server-side read. Requiring a callback signature would have made this handler
 * a no-op that acknowledged every captured payment without recording it.
 *
 * Idempotent: Razorpay retries until it sees a 2xx, and reconciliation refuses
 * to overwrite a captured payment, so any number of deliveries settles one order.
 */
export async function POST(request: NextRequest) {
  if (!databaseConfigured() || !razorpayConfigured()) {
    return NextResponse.json({ error: "Payment is unavailable right now." }, { status: 503 });
  }

  const webhookSecret = optionalEnv("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret) {
    // Not a payment problem and not retryable by Razorpay: the deployment is
    // missing its secret. Logged loudly because this silently disables recovery.
    console.error(
      "[webhook] RAZORPAY_WEBHOOK_SECRET is not set - payment reconciliation is disabled"
    );
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read request body." }, { status: 400 });
  }

  // Constant-time compare, and only after the lengths match: timingSafeEqual
  // throws on a length mismatch, which would turn a bad signature into a 500.
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const received = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");
  if (received.length !== computed.length || !crypto.timingSafeEqual(received, computed)) {
    console.warn("[webhook] rejected a delivery with an invalid signature", {
      event: request.headers.get("x-razorpay-event") ?? "unknown",
    });
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: unknown; order_id?: unknown } };
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const name = typeof event.event === "string" ? event.event : "";
  const entity = event.payload?.payment?.entity;
  const razorpayPaymentId = String(entity?.id ?? "");
  const razorpayOrderId = String(entity?.order_id ?? "");

  // Orders we can reconcile on: the payment lifecycle. Anything else is
  // acknowledged so Razorpay stops retrying an event we deliberately ignore.
  const PAYMENT_EVENTS = new Set([
    "payment.captured",
    "payment.authorized",
    "payment.failed",
  ]);

  if (!PAYMENT_EVENTS.has(name)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (!razorpayOrderId) {
    console.warn("[webhook] payment event without an order id", { event: name });
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    const result = await reconcileOrderPayment(razorpayOrderId);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    // A 5xx asks Razorpay to retry, which is what we want for a transient fault.
    console.error("[webhook] reconciliation failed", {
      event: name,
      razorpayOrderId,
      razorpayPaymentId,
      error,
    });
    return NextResponse.json({ error: "Failed to process webhook." }, { status: 500 });
  }
}