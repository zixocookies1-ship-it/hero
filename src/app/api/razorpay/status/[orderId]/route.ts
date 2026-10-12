import { NextResponse } from "next/server";
import { databaseConfigured, razorpayConfigured } from "@/lib/env";
import { findOrderByOrderId } from "@/lib/orders";
import { createReceiptToken, verifyReceiptToken } from "@/lib/receipt-token";
import { reconcileOrderPayment } from "@/lib/payment-reconciliation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StatusResponse = {
  ok: boolean;
  orderId: string;
  /** "paid" | "pending" | "failed" | "unavailable" */
  paymentStatus: string;
  orderStatus: string;
  /** Present only once money is actually captured. */
  receiptToken?: string;
  /** Set when Razorpay refused the payment for a reason retrying cannot fix. */
  restricted?: boolean;
  retryable?: boolean;
  message?: string;
  error?: string;
};

/**
 * Reports whether an order has actually been paid, and reconciles it if it has.
 *
 * Access needs the same receipt token as the success page, so a guessed order id
 * reveals nothing.
 *
 * The important rule here: this endpoint never *reports* "paid" on the strength
 * of the browser or of a Razorpay order status alone. It reconciles first, which
 * re-reads the payment server-side and writes the row through the idempotent
 * helpers, and only then issues the receipt token. Returning "paid" without that
 * write would clear the shopper's cart and show a receipt for an order the
 * database still considered pending.
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
      {
        ok: false,
        orderId,
        paymentStatus: "unavailable",
        orderStatus: "unknown",
        error: "Payment is unavailable right now.",
      },
      { status: 503 }
    );
  }

  const access = verifyReceiptToken(orderId, token);
  if (!access.ok) {
    return NextResponse.json<StatusResponse>(
      {
        ok: false,
        orderId,
        paymentStatus: "unavailable",
        orderStatus: "unknown",
        error: "Invalid or expired token.",
      },
      { status: 401 }
    );
  }

  const order = await findOrderByOrderId(orderId);
  if (!order) {
    return NextResponse.json<StatusResponse>(
      {
        ok: false,
        orderId,
        paymentStatus: "unavailable",
        orderStatus: "unknown",
        error: "Order not found.",
      },
      { status: 404 }
    );
  }

  /**
 * Answers "paid" only from the row as it now stands in MongoDB.
 *
 * Re-reading rather than asserting the outcome is the whole point: a receipt
 * token is only minted when the persisted order really is `paid`, so a response
 * can never claim a confirmation the database does not hold.
 */
const settledResponse = async (orderId: string): Promise<NextResponse<StatusResponse>> => {
  const settled = await findOrderByOrderId(orderId);

  if (!settled || settled.paymentStatus !== "paid") {
    return NextResponse.json<StatusResponse>({
      ok: true,
      orderId,
      paymentStatus: "pending",
      orderStatus: settled?.orderStatus ?? "pending",
      retryable: false,
      message:
        "Your payment is being confirmed right now. Please wait a moment and do not pay again.",
    });
  }

  return NextResponse.json<StatusResponse>({
    ok: true,
    orderId,
    paymentStatus: settled.paymentStatus,
    orderStatus: settled.orderStatus,
    receiptToken: createReceiptToken(orderId),
  });
};

  if (order.paymentStatus === "paid") {
    return settledResponse(orderId);
  }

  // Still pending locally. Ask Razorpay what really happened, and settle the row
  // if the money is in. A missing or unreachable Razorpay order must not fail the
  // shopper's cart, so a pending answer is still a successful response.
  if (order.razorpayOrderId && razorpayConfigured()) {
    const result = await reconcileOrderPayment(order.razorpayOrderId);

    if (result.state === "paid") {
      return settledResponse(orderId);
    }

    if (result.state === "failed") {
      const restricted = result.restricted;
      return NextResponse.json<StatusResponse>({
        ok: true,
        orderId,
        paymentStatus: "failed",
        orderStatus: "pending",
        restricted,
        retryable: !restricted,
        message: restricted
          ? "Razorpay has blocked this payment because the website running checkout is not registered to our account. Retrying will not help - please contact us and we will take your order another way."
          : "Your payment did not go through and no money has been taken. You can try again.",
      });
    }

    if (result.state === "authorized") {
      return NextResponse.json<StatusResponse>({
        ok: true,
        orderId,
        paymentStatus: "pending",
        orderStatus: "pending",
        retryable: false,
        message:
          "Your payment is being confirmed by your bank. This page will update shortly - please do not pay again.",
      });
    }

    if (result.state === "unknown_order") {
      // The row lost its Razorpay id. Do not delete anything; report it so the
      // merchant can reconcile by hand rather than silently stranding the order.
      console.error("[status] no local order carries this Razorpay order id", {
        orderId,
        razorpayOrderId: order.razorpayOrderId,
      });
      return NextResponse.json<StatusResponse>({
        ok: true,
        orderId,
        paymentStatus: "unavailable",
        orderStatus: "pending",
        retryable: false,
        message:
          "We could not match this order to a payment yet. Please contact us and we will confirm it - you have not been charged twice.",
      });
    }

    // unavailable: Razorpay could not be reached.
    console.error("[status] Razorpay unavailable while checking payment", {
      orderId,
      razorpayOrderId: order.razorpayOrderId,
      reason: result.reason,
    });
    return NextResponse.json<StatusResponse>({
      ok: true,
      orderId,
      paymentStatus: "pending",
      orderStatus: "pending",
      retryable: false,
      message:
        "We are still confirming your payment with Razorpay. Please wait a moment - if you were charged we will confirm the order shortly.",
    });
  }

  return NextResponse.json<StatusResponse>({
    ok: true,
    orderId,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    retryable: true,
    message: "Payment has not completed yet.",
  });
}