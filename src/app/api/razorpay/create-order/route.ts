import { NextResponse } from "next/server";
import { databaseConfigured, razorpayConfigured } from "@/lib/env";
import { priceCart, PricingError, type CartInputLine } from "@/lib/pricing";
import {
  createPendingOrder,
  attachRazorpayOrderId,
  markPaymentFailedByOrderId,
} from "@/lib/orders";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/razorpay-server";
import {
  hasErrors,
  normaliseCheckoutDetails,
  validateCheckoutDetails,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Guards against someone driving the endpoint with a script. */
const MAX_LINES = 25;

function readCartLines(payload: unknown): CartInputLine[] {
  if (!payload || typeof payload !== "object") return [];
  const cart = (payload as { cart?: unknown }).cart;
  if (!Array.isArray(cart)) return [];
  return cart.slice(0, MAX_LINES).flatMap((entry): CartInputLine[] => {
    if (!entry || typeof entry !== "object") return [];
    const slug = (entry as { slug?: unknown }).slug;
    const quantity = (entry as { quantity?: unknown }).quantity;
    if (typeof slug !== "string") return [];
    return [{ slug, quantity: Number(quantity) }];
  });
}

export async function POST(request: Request) {
  if (!databaseConfigured()) {
    return NextResponse.json(
      { error: "Orders are not configured yet. Please contact us." },
      { status: 503 }
    );
  }

  if (!razorpayConfigured()) {
    return NextResponse.json(
      { error: "Online payment is unavailable right now. Please contact us on WhatsApp." },
      { status: 503 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const body = (payload ?? {}) as { details?: Record<string, unknown> };
  const details = normaliseCheckoutDetails(body.details ?? {});

  // The browser runs the same validation, but the server is the authority.
  const fieldErrors = validateCheckoutDetails(details);
  if (hasErrors(fieldErrors)) {
    return NextResponse.json(
      { error: "Some delivery details are invalid.", fieldErrors },
      { status: 422 }
    );
  }

  // Amounts are recalculated from the catalogue. Anything the browser claims
  // about price, discount or shipping is ignored.
  let pricing;
  try {
    pricing = priceCart(readCartLines(payload));
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not price your cart." }, { status: 500 });
  }

  let pending: { id: string; orderId: string };
  try {
    pending = await createPendingOrder({ pricing, details });
  } catch (error) {
    console.error("createPendingOrder failed", error);
    return NextResponse.json(
      { error: "We could not start your order. Please try again." },
      { status: 500 }
    );
  }

  try {
    const razorpay = await createRazorpayOrder({
      amountInPaise: pricing.totalInPaise,
      receipt: pending.orderId,
      notes: { orderId: pending.orderId, phone: details.phone },
    });

    await attachRazorpayOrderId(pending.orderId, razorpay.id);

    return NextResponse.json({
      keyId: getRazorpayKeyId(),
      razorpayOrderId: razorpay.id,
      orderId: pending.orderId,
      amount: pricing.totalInPaise,
      currency: razorpay.currency,
      pricing: {
        subtotal: pricing.subtotal,
        discount: pricing.productDiscount,
        couponDiscount: pricing.couponDiscount,
        deliveryFee: pricing.deliveryFee,
        total: pricing.total,
      },
    });
  } catch (error) {
    console.error("razorpay order creation failed", error);

    // The local row exists but has no Razorpay order, so nothing can ever settle
    // it. Fail it now rather than leaving it pending forever.
    await markPaymentFailedByOrderId(pending.orderId, "razorpay_create_failed").catch(
      () => undefined
    );

    return NextResponse.json(
      { error: "We could not start the payment. Please try again." },
      { status: 502 }
    );
  }
}