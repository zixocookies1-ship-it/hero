import {
  confirmPaidOrder,
  findOrderByRazorpayOrderId,
  markPaymentFailed,
  OrderError,
} from "@/lib/orders";
import {
  describeRazorpayError,
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  razorpayConfigured,
} from "@/lib/razorpay-server";

/**
 * Records, in place of the checkout HMAC, that the payment was confirmed from a
 * source that has already authenticated itself: a signature-verified webhook, or
 * Razorpay's own API. There is no browser signature to store in those cases, and
 * the provenance is what the admin panel and the receipt need to see.
 */
export const WEBHOOK_CONFIRMATION = "confirmed:razorpay_server";

/**
 * Razorpay rejects a payment when the website running checkout is not the one
 * registered to the account. It is an account-level restriction enforced on
 * Razorpay's side: no code change clears it, and retrying the same card does not
 * help. Detected so the shopper gets a real message and the merchant gets the
 * request id to quote to Razorpay support.
 */
export function isWebsiteRestrictionFailure(description: string | null | undefined): boolean {
  if (!description) return false;
  const text = description.toLowerCase();
  return (
    text.includes("website") ||
    text.includes("business - website") ||
    text.includes("business – website")
  );
}

export type Reconciliation =
  /** Money is captured and the local row is settled (or already was). */
  | { state: "paid"; orderId: string }
  /** Authorized but not captured: Razorpay will capture or auto-refund later. */
  | { state: "authorized"; orderId: string }
  /** Razorpay definitively refused this payment. */
  | { state: "failed"; orderId: string; reason: string; restricted: boolean }
  /** No local order carries this Razorpay id (not an error to retry). */
  | { state: "unknown_order" }
  /** Razorpay could not be reached, or the keys are absent. */
  | { state: "unavailable"; reason: string };

type RazorpayPaymentShape = {
  id?: string;
  order_id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  error_code?: string | null;
  error_description?: string | null;
  error_source?: string | null;
  error_step?: string | null;
  method?: string | null;
};

/**
 * Brings one order in line with what Razorpay actually holds.
 *
 * Called from the webhook and from the status poll, so both answer the same
 * question the same way. Every write goes through the existing idempotent
 * helpers, so replaying a webhook or polling twice settles exactly one order and
 * never downgrades a captured payment: markPaymentFailed only touches rows that
 * are still `pending`.
 *
 * Nothing here trusts the browser. The payment is re-read from Razorpay's API,
 * and only `captured` marks an order paid.
 */
export async function reconcileOrderPayment(razorpayOrderId: string): Promise<Reconciliation> {
  const order = await findOrderByRazorpayOrderId(razorpayOrderId);
  if (!order || !order.orderId) return { state: "unknown_order" };

  // Already settled. Return before touching Razorpay so a late or duplicate
  // webhook can never re-open the decision or overwrite a captured payment.
  if (order.paymentStatus === "paid") {
    return { state: "paid", orderId: order.orderId };
  }

  if (!razorpayConfigured()) {
    return { state: "unavailable", reason: "razorpay_not_configured" };
  }

  // The Razorpay order carries its payments. Reading them from the order means
  // one round trip and covers an abandoned order with no payments at all.
  let payments: RazorpayPaymentShape[] = [];
  try {
    const rzpOrder = (await fetchRazorpayOrder(razorpayOrderId)) as {
      payments?: RazorpayPaymentShape[];
    };
    payments = Array.isArray(rzpOrder.payments) ? rzpOrder.payments : [];
  } catch (error) {
    const info = describeRazorpayError(error);
    console.error("[payment] could not read the Razorpay order", {
      razorpayOrderId,
      orderId: order.orderId,
      ...info,
    });
    return { state: "unavailable", reason: info.code ?? "razorpay_unreachable" };
  }

  // Newest attempt last in Razorpay's ordering; the last one is the live truth.
  const payment = payments[payments.length - 1];
  if (!payment) {
    return { state: "authorized", orderId: order.orderId };
  }

  const status = String(payment.status ?? "").toLowerCase();

  if (status === "captured") {
    try {
      const result = await confirmPaidOrder({
        razorpayOrderId,
        razorpayPaymentId: String(payment.id ?? ""),
        razorpaySignature: WEBHOOK_CONFIRMATION,
      });
      console.log("[payment] captured payment settled", {
        orderId: result.orderId,
        razorpayPaymentId: payment.id,
        alreadyPaid: result.alreadyPaid,
      });
      return { state: "paid", orderId: result.orderId };
    } catch (error) {
      if (error instanceof OrderError) {
        console.error("[payment] could not settle a captured payment", {
          orderId: order.orderId,
          code: error.code,
          message: error.message,
        });
        return { state: "unavailable", reason: error.code };
      }
      throw error;
    }
  }

  if (status === "authorized") {
    // Capturable, not captured. Reporting this as paid would be a false claim,
    // so the order stays pending until Razorpay confirms capture.
    console.log("[payment] payment authorized, awaiting capture", {
      orderId: order.orderId,
      razorpayPaymentId: payment.id,
    });
    return { state: "authorized", orderId: order.orderId };
  }

  if (status === "failed") {
    const description = payment.error_description ?? null;
    const restricted = isWebsiteRestrictionFailure(description);
    const reason = payment.error_code ?? "payment_failed";

    // Logged without the secret, with the request-level detail Razorpay support
    // needs. The shopper never sees any of this.
    console.error("[payment] Razorpay refused the payment", {
      orderId: order.orderId,
      razorpayOrderId,
      razorpayPaymentId: payment.id,
      errorCode: reason,
      errorDescription: description,
      errorSource: payment.error_source ?? null,
      errorStep: payment.error_step ?? null,
      restricted,
    });

    // Only touches rows still pending, so a captured payment is never demoted.
    await markPaymentFailed(razorpayOrderId, reason).catch(() => undefined);
    return { state: "failed", orderId: order.orderId, reason, restricted };
  }

  return { state: "authorized", orderId: order.orderId };
}

/** Reads one payment directly, for a caller that already holds a payment id. */
export async function reconcilePaymentById(
  razorpayPaymentId: string
): Promise<{ status: string; errorCode: string | null; errorDescription: string | null } | null> {
  if (!razorpayConfigured()) return null;
  try {
    const payment = (await fetchRazorpayPayment(razorpayPaymentId)) as RazorpayPaymentShape;
    return {
      status: String(payment.status ?? "").toLowerCase(),
      errorCode: payment.error_code ?? null,
      errorDescription: payment.error_description ?? null,
    };
  } catch (error) {
    console.error("[payment] could not read a Razorpay payment", {
      razorpayPaymentId,
      ...describeRazorpayError(error),
    });
    return null;
  }
}