import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  asInteger,
  asOptionalInteger,
  asOptionalText,
  jsonBody,
  uniqueViolation,
} from "@/lib/admin-api";
import { normaliseCouponCode } from "@/lib/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DISCOUNT_TYPES = new Set(["percentage", "fixed"]);

/**
 * Creates a coupon. Codes are normalised to upper case and matched that way at
 * checkout, so the stored code is whatever the admin types, uppercased and
 * trimmed.
 */
export async function POST(request: Request) {
  const email = await requireAdminApi();
  if (!email) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const parsed = await jsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const rawCode = asOptionalText(body.code, "Code");
  if (!rawCode.ok) return NextResponse.json({ error: rawCode.message }, { status: 400 });
  const code = normaliseCouponCode(rawCode.value ?? "");
  if (!code) {
    return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
  }

  const discountType = asOptionalText(body.discountType, "Discount type");
  if (!discountType.ok || !DISCOUNT_TYPES.has(discountType.value ?? "")) {
    return NextResponse.json(
      { error: "Discount type must be percentage or fixed." },
      { status: 400 }
    );
  }

  const value = asInteger(body.discountValue, "Discount value", {
    min: discountType.value === "percentage" ? 1 : 0,
    max: discountType.value === "percentage" ? 100 : Number.MAX_SAFE_INTEGER,
  });
  if (!value.ok || value.value <= 0) {
    return NextResponse.json(
      { error: "Discount value must be at least 1." },
      { status: 400 }
    );
  }

  const minimumOrderAmount = asOptionalInteger(body.minimumOrderAmount, "Minimum order", { min: 0 });
  if (!minimumOrderAmount.ok) {
    return NextResponse.json({ error: minimumOrderAmount.message }, { status: 400 });
  }

  const usageLimit = asOptionalInteger(body.usageLimit, "Usage limit", { min: 1 });
  if (!usageLimit.ok) return NextResponse.json({ error: usageLimit.message }, { status: 400 });

  const expiresRaw = asOptionalText(body.expiresAt, "Expiry");
  if (!expiresRaw.ok) return NextResponse.json({ error: expiresRaw.message }, { status: 400 });
  const expiresAt = expiresRaw.value ? new Date(expiresRaw.value) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "Expiry must be a valid date." }, { status: 400 });
  }

  const active = body.active === undefined ? true : body.active === true;

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountType: discountType.value as "percentage" | "fixed",
        discountValue: value.value,
        minimumOrderAmount: minimumOrderAmount.value,
        usageLimit: usageLimit.value,
        expiresAt,
        active,
      },
      select: { id: true, code: true, discountType: true, active: true },
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    if (uniqueViolation(error)) {
      return NextResponse.json(
        { error: "A coupon with that code already exists." },
        { status: 409 }
      );
    }
    console.error("[mongo] admin create coupon failed", error);
    return NextResponse.json({ error: "The coupon could not be created." }, { status: 500 });
  }
}