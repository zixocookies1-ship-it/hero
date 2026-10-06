import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  asBoolean,
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
 * Edits a coupon or flips it on/off. Deactivating is the supported way to retire
 * a code, so a coupon that ever touched an order can never be destroyed.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await requireAdminApi();
  if (!email) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const { id } = await params;

  const parsed = await jsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const data: Record<string, unknown> = {};

  if (body.code !== undefined) {
    const code = normaliseCouponCode(body.code);
    if (!code) {
      return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
    }
    data.code = code;
  }

  if (body.discountType !== undefined) {
    if (!DISCOUNT_TYPES.has(String(body.discountType))) {
      return NextResponse.json(
        { error: "Discount type must be percentage or fixed." },
        { status: 400 }
      );
    }
    data.discountType = String(body.discountType);
  }

  if (body.discountValue !== undefined) {
    const value = asInteger(body.discountValue, "Discount value", {
      min: String(body.discountType ?? "fixed") === "percentage" ? 1 : 0,
      max: String(body.discountType ?? "fixed") === "percentage" ? 100 : Number.MAX_SAFE_INTEGER,
    });
    if (!value.ok || value.value <= 0) {
      return NextResponse.json({ error: "Discount value must be at least 1." }, { status: 400 });
    }
    data.discountValue = value.value;
  }

  if (body.minimumOrderAmount !== undefined) {
    const minimumOrderAmount = asOptionalInteger(body.minimumOrderAmount, "Minimum order", {
      min: 0,
    });
    if (!minimumOrderAmount.ok) {
      return NextResponse.json({ error: minimumOrderAmount.message }, { status: 400 });
    }
    data.minimumOrderAmount = minimumOrderAmount.value;
  }

  if (body.usageLimit !== undefined) {
    const usageLimit = asOptionalInteger(body.usageLimit, "Usage limit", { min: 1 });
    if (!usageLimit.ok) return NextResponse.json({ error: usageLimit.message }, { status: 400 });
    data.usageLimit = usageLimit.value;
  }

  if (body.expiresAt !== undefined) {
    const expiresRaw = asOptionalText(body.expiresAt, "Expiry");
    if (!expiresRaw.ok) return NextResponse.json({ error: expiresRaw.message }, { status: 400 });
    const expiresAt = expiresRaw.value ? new Date(expiresRaw.value) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: "Expiry must be a valid date." }, { status: 400 });
    }
    data.expiresAt = expiresAt;
  }

  if (body.active !== undefined) {
    const active = asBoolean(body.active, "Active");
    if (!active.ok) return NextResponse.json({ error: active.message }, { status: 400 });
    data.active = active.value;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const coupon = await prisma.coupon.update({
      where: { id },
      data,
      select: { id: true, code: true, active: true, discountType: true },
    });
    return NextResponse.json({ coupon });
  } catch (error) {
    if (uniqueViolation(error)) {
      return NextResponse.json(
        { error: "A coupon with that code already exists." },
        { status: 409 }
      );
    }
    console.error("[mongo] admin update coupon failed", error);
    return NextResponse.json({ error: "The coupon could not be updated." }, { status: 500 });
  }
}