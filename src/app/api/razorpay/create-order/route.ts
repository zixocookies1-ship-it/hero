import { NextResponse } from "next/server";
import { databaseConfigured, razorpayConfigured } from "@/lib/env";
import { evaluateCoupon } from "@/lib/coupons";
import { databaseEnvPresence } from "@/lib/mongo-diagnostics";
import { applyCoupon, priceCart, PricingError, type CartInputLine } from "@/lib/pricing";
import { loadCatalogueUncached, loadSettingsUncached } from "@/lib/cms";
import {
  createPendingOrder,
  attachRazorpayOrderId,
  findCouponByCode,
  markPaymentFailedByOrderId,
  recordCouponUsage,
} from "@/lib/orders";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/razorpay-server";
import {
  hasErrors,
  normaliseCheckoutDetails,
  validateCheckoutDetails,
} from "@/lib/validation";
import { delhiveryConfigured, delhiveryPincodeServiceable } from "@/lib/delhivery-server";

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
    // The shopper gets a neutral message; the operator gets the actual reason,
    // because "not configured" is nearly always a variable that never reached this
    // runtime rather than an application that is genuinely unconfigured.
    console.error(
      "[checkout] cannot create order: MONGODB_URI is not configured in this runtime",
      { envPresence: databaseEnvPresence(), vercel: Boolean(process.env.VERCEL) }
    );
    return NextResponse.json(
      { error: "We could not start your order. Please try again shortly.", code: "orders_unavailable" },
      { status: 503 }
    );
  }

  if (!razorpayConfigured()) {
    return NextResponse.json(
      { error: "Online payment is unavailable right now. Please contact us on WhatsApp." },
      { status: 503 }
    );
  }

  // The payment switch lives in the settings document so the owner can stop
  // online orders from the admin panel without touching code or credentials.
  // A missing document defaults to enabled so an absent seed never blocks sales.
  const settingsRow = await loadSettingsUncached();
  if (settingsRow && settingsRow.onlinePaymentEnabled === false) {
    return NextResponse.json(
      {
        error: "Online payment is switched off for this store right now. Please contact us on WhatsApp.",
        code: "online_payments_disabled",
      },
      { status: 503 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const body = (payload ?? {}) as {
    details?: Record<string, unknown>;
    couponCode?: unknown;
  };
  const details = normaliseCheckoutDetails(body.details ?? {});

  // The browser runs the same validation, but the server is the authority.
  const fieldErrors = validateCheckoutDetails(details);
  if (hasErrors(fieldErrors)) {
    return NextResponse.json(
      { error: "Some delivery details are invalid.", fieldErrors },
      { status: 422 }
    );
  }

  // Delhivery is the store's only delivery partner, so when it is configured the
  // pincode must be serviceable before an order is even started. A definitive
  // "no" is a hard reject; an unreachable API is logged and allowed through so
  // an outage never blocks a sale.
  if (delhiveryConfigured()) {
    try {
      const serviceable = await delhiveryPincodeServiceable(details.postalCode);
      if (serviceable === false) {
        return NextResponse.json(
          { error: "We do not deliver to this pincode yet." },
          { status: 422 }
        );
      }
    } catch (error) {
      console.error("[checkout] Delhivery pincode check failed", {
        postalCode: details.postalCode,
        error,
      });
    }
  }

  // Amounts are recalculated from the catalogue. Anything the browser claims
  // about price, discount or shipping is ignored. The catalogue is read fresh
  // from the database here — this is the number that gets charged, so it must
  // reflect what the admin has published, not the list baked into the bundle.
  let base;
  try {
    base = priceCart(
      readCartLines(payload),
      process.env,
      await loadCatalogueUncached()
    );
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not price your cart." }, { status: 500 });
  }

  // The coupon is re-checked here, not trusted from the validate call. The code
  // is all the client sends; whether it applies, and for how much, is decided
  // again against the freshly priced subtotal.
  let pricing = base;
  let coupon: { id: string; code: string } | null = null;
  const requestedCode = typeof body.couponCode === "string" ? body.couponCode : "";

  if (requestedCode.trim()) {
    let found: Awaited<ReturnType<typeof findCouponByCode>>;
    try {
      found = await findCouponByCode(requestedCode);
    } catch (error) {
      console.error("coupon lookup failed", error);
      return NextResponse.json(
        { error: "Could not check that coupon. Please try again.", code: "coupon_lookup_failed" },
        { status: 500 }
      );
    }

    const verdict = evaluateCoupon(found, requestedCode, base.subtotal);

    if (!verdict.ok) {
      return NextResponse.json(
        { error: verdict.message, code: "coupon_rejected", reason: verdict.reason },
        { status: 422 }
      );
    }

    // evaluateCoupon only accepts a coupon that exists, so this is unreachable.
    if (!found) {
      return NextResponse.json(
        { error: "That coupon is not available.", code: "coupon_rejected" },
        { status: 422 }
      );
    }

    pricing = applyCoupon(base, verdict.discountInr, verdict.code);
    coupon = { id: found.id, code: verdict.code };
  }

  let pending: { id: string; orderId: string };
  try {
    pending = await createPendingOrder({ pricing, details, coupon });
  } catch (error) {
    console.error("createPendingOrder failed", error);
    return NextResponse.json(
      { error: "We could not start your order. Please try again." },
      { status: 500 }
    );
  }

  if (coupon) {
    // Best effort: the order is already created, so a failure to count the
    // redemption must not fail the checkout.
    await recordCouponUsage(coupon.id).catch((error) => {
      console.error("recordCouponUsage failed", { orderId: pending.orderId, error });
    });
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
        couponCode: pricing.couponCode,
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