import { NextResponse } from "next/server";
import { databaseConfigured, razorpayConfigured } from "@/lib/env";
import { findOrderByOrderId } from "@/lib/orders";
import { fetchRazorpayOrder } from "@/lib/razorpay-server";
import { verifyReceiptToken, createReceiptToken } from "@/lib/receipt-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StatusResponse =
  | { ok: true; paymentStatus: string; orderStatus: string; orderId: string; razorpayOrderId?: string; receiptToken?: string }
  | { ok: false; error: string };

/**
 * Checks the payment status of an order by its order ID.
 *
 * Uses the receipt token for authorization (same as the order-success page).
 * First checks the local database, then optionally verifies against Razorpay
 * if the local status is still pending but a Razorpay order exists.
 * Returns a receipt token when payment is confirmed paid, so the frontend can
 * navigate to the success page without the original callback.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!databaseConfigured()) {
    return NextResponse.json<StatusResponse>(
      { ok: false, error: "Payment is unavailable right now." },
      { status: 503 }
    );
  }

  const access = verifyReceiptToken(orderId, token);
  if (!access.ok) {
    return NextResponse.json<StatusResponse>(
      { ok: false, error: "Invalid or expired token." },
      { status: 401 }
    );
  }

  const order = await findOrderByOrderId(orderId);
  if (!order) {
    return NextResponse.json<StatusResponse>(
      { ok: false, error: "Order not found." },
      { status: 404 }
    );
  }

  if (order.paymentStatus === "paid") {
    return NextResponse.json<StatusResponse>({
      ok: true,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      orderId: order.orderId,
      razorpayOrderId: order.razorpayOrderId ?? undefined,
      receiptToken: createReceiptToken(orderId),
    });
  }

  if (order.razorpayOrderId && razorpayConfigured()) {
    try {
      const razorpayOrder = await fetchRazorpayOrder(order.razorpayOrderId);
      const rzpStatus = String((razorpayOrder as { status?: unknown }).status ?? "");

      if (rzpStatus === "paid") {
        return NextResponse.json<StatusResponse>({
          ok: true,
          paymentStatus: "paid",
          orderStatus: order.orderStatus,
          orderId: order.orderId,
          razorpayOrderId: order.razorpayOrderId,
          receiptToken: createReceiptToken(orderId),
        });
      }

      if (rzpStatus === "attempted" || rzpStatus === "created") {
        return NextResponse.json<StatusResponse>({
          ok: true,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          orderId: order.orderId,
          razorpayOrderId: order.razorpayOrderId,
        });
      }
    } catch {
      // If Razorpay check fails, fall through to local status
    }
  }

  return NextResponse.json<StatusResponse>({
    ok: true,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    orderId: order.orderId,
    razorpayOrderId: order.razorpayOrderId ?? undefined,
  });
}