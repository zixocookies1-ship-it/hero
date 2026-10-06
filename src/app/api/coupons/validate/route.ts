import { NextResponse } from "next/server";

import { evaluateCoupon } from "@/lib/coupons";
import { databaseEnvPresence } from "@/lib/mongo-diagnostics";
import { databaseConfigured } from "@/lib/env";
import { findCouponByCode } from "@/lib/orders";
import { priceCart, PricingError, type CartInputLine } from "@/lib/pricing";
import { loadCatalogueUncached } from "@/lib/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Same guard as create-order: a coupon lookup must not become a free DB query farm. */
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

/**
 * Validates a coupon code against the cart and reports what it is worth.
 *
 * The cart is re-priced here from the catalogue rather than trusting a subtotal
 * from the browser, so the minimum-order and percentage rules are always checked
 * against the real amount. The same evaluateCoupon() call runs again in
 * create-order before anything is charged, so this response only ever drives
 * what the shopper sees, never what they pay.
 */
export async function POST(request: Request) {
  if (!databaseConfigured()) {
    console.error("[coupon] cannot validate: MONGODB_URI is not configured in this runtime", {
      envPresence: databaseEnvPresence(),
      vercel: Boolean(process.env.VERCEL),
    });
    return NextResponse.json(
      {
        error: "Coupon codes are unavailable right now. Please try again shortly.",
        code: "coupons_unavailable",
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

  const body = (payload ?? {}) as { code?: unknown; cart?: unknown };
  const rawCode = typeof body.code === "string" ? body.code : "";

  let subtotal: number;
  try {
    // Priced against the catalogue the admin currently has published, not the
    // list that shipped in the bundle. The uncached loader is used deliberately:
    // React's cache() is scoped to a component render, and a price held across
    // two requests would be a price a coupon could be judged against wrongly.
    subtotal = priceCart(
      readCartLines(payload),
      process.env,
      await loadCatalogueUncached()
    ).subtotal;
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json(
        { error: error.message, code: error.code, ok: false },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Could not price your cart." }, { status: 500 });
  }

  let coupon;
  try {
    coupon = await findCouponByCode(rawCode);
  } catch (error) {
    console.error("[coupon] lookup failed", error);
    return NextResponse.json(
      { error: "Could not check that coupon. Please try again." },
      { status: 500 }
    );
  }

  const result = evaluateCoupon(coupon, rawCode, subtotal);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: result.code, reason: result.reason, error: result.message },
      { status: 422 }
    );
  }

  return NextResponse.json({
    ok: true,
    code: result.code,
    discountInr: result.discountInr,
    description: result.description,
    subtotalInr: subtotal,
  });
}
