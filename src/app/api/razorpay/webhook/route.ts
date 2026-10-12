import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { databaseConfigured, razorpayConfigured, optionalEnv } from "@/lib/env";
import { confirmPaidOrder, markPaymentFailed, OrderError } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay webhook handler.
 *
 * Verifies the webhook signature using the raw request body and the configured
 * webhook secret. Handles payment.captured and payment.failed events to
 * reconcile orders when the browser callback doesn't fire.
 */
export async function POST(request: NextRequest) {
  if (!databaseConfigured() || !razorpayConfigured()) {
    return NextResponse.json(
      { error: "Payment is unavailable right now." },
      { status: 503 }
    );
  }

  const webhookSecret = optionalEnv("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 503 }
    );
  }

  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing webhook signature." },
      { status: 400 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Failed to read request body." },
      { status: 400 }
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const receivedBuffer = Buffer.from(signature, "utf8");
  const computedBuffer = Buffer.from(expectedSignature, "utf8");

  if (receivedBuffer.length !== computedBuffer.length || !crypto.timingSafeEqual(receivedBuffer, computedBuffer)) {
    console.warn("[webhook] Invalid signature");
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  let event: { event: string; payload: { payment: { entity: Record<string, unknown> } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const payment = event.payload?.payment?.entity;
  if (!payment) {
    return NextResponse.json(
      { error: "Missing payment entity." },
      { status: 400 }
    );
  }

  const razorpayPaymentId = String(payment.id ?? "");
  const razorpayOrderId = String(payment.order_id ?? "");
  const razorpaySignature = String(payment.signature ?? "");
  const status = String(payment.status ?? "");

  if (!razorpayOrderId || !razorpayPaymentId) {
    return NextResponse.json(
      { error: "Missing order_id or payment_id." },
      { status: 400 }
    );
  }

  try {
    if (event.event === "payment.captured" || (event.event === "payment.authorized" && status === "captured")) {
      if (!razorpaySignature) {
        console.warn("[webhook] payment.captured but no signature", { razorpayPaymentId, razorpayOrderId });
        return NextResponse.json({ received: true });
      }

      const result = await confirmPaidOrder({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      console.log("[webhook] payment.captured -> order confirmed", {
        orderId: result.orderId,
        alreadyPaid: result.alreadyPaid,
      });

      return NextResponse.json({ received: true, orderId: result.orderId });
    }

    if (event.event === "payment.failed") {
      const errorCode = String(payment.error_code ?? "payment_failed");
      await markPaymentFailed(razorpayOrderId, errorCode).catch(() => undefined);

      console.log("[webhook] payment.failed -> order marked failed", {
        razorpayOrderId,
        razorpayPaymentId,
        errorCode,
      });

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true, ignored: true });
  } catch (error) {
    if (error instanceof OrderError) {
      if (error.code === "not_found") {
        console.warn("[webhook] Order not found for razorpayOrderId", { razorpayOrderId });
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if (error.code === "already_paid") {
        return NextResponse.json({ received: true, alreadyPaid: true });
      }
    }
    console.error("[webhook] Error processing event", { event: event.event, error });
    return NextResponse.json(
      { error: "Failed to process webhook." },
      { status: 500 }
    );
  }
}