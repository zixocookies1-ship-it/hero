import { NextResponse } from "next/server";
import { databaseConfigured, razorpayConfigured } from "@/lib/env";
import {
  confirmPaidOrder,
  findOrderByOrderId,
  markPaymentFailed,
  OrderError,
} from "@/lib/orders";
import { createReceiptToken } from "@/lib/receipt-token";
import { verifyPaymentSignature } from "@/lib/razorpay-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VerifyBody = {
  razorpay_order_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_signature?: unknown;
};

const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

/**
 * Verifies the Razorpay signature on the server and only then marks the order
 * paid. Safe to call more than once for the same payment: it returns the
 * original order instead of creating a second one.
 */
export async function POST(request: Request) {
  if (!databaseConfigured() || !razorpayConfigured()) {
    return NextResponse.json(
      { error: "Payment is unavailable right now." },
      { status: 503 }
    );
  }

  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const razorpayOrderId = asString(body.razorpay_order_id);
  const razorpayPaymentId = asString(body.razorpay_payment_id);
  const razorpaySignature = asString(body.razorpay_signature);

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json(
      { error: "Payment was not completed." },
      { status: 400 }
    );
  }

  const signatureValid = verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!signatureValid) {
    await markPaymentFailed(razorpayOrderId, "signature_invalid").catch(() => undefined);

    return NextResponse.json(
      { error: "We could not verify that payment. No money has been taken." },
      { status: 400 }
    );
  }

  try {
    const result = await confirmPaidOrder({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    const order = await findOrderByOrderId(result.orderId);

    return NextResponse.json({
      ok: true,
      orderId: result.orderId,
      paymentStatus: result.paymentStatus,
      orderStatus: result.orderStatus,
      alreadyPaid: result.alreadyPaid,
      receiptToken: createReceiptToken(result.orderId),
      total: order ? Number(order.total) : null,
      email: order?.customerEmail ?? null,
    });
  } catch (error) {
    if (error instanceof OrderError) {
      const status = error.code === "not_found" ? 404 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error("confirmPaidOrder failed", error);
    return NextResponse.json(
      { error: "Something went wrong confirming your payment. Please contact us." },
      { status: 500 }
    );
  }
}