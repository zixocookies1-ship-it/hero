import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import { asOptionalText, isObject, jsonBody } from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEXT_FIELDS = [
  "brandName",
  "tagline",
  "announcement",
  "description",
  "supportEmail",
  "supportPhone",
  "whatsappNumber",
  "instagramHandle",
  "twitterHandle",
  "legalName",
  "gstNumber",
  "fssaiNumber",
  "cinNumber",
  "businessAddressLine1",
  "businessAddressLine2",
  "businessCity",
  "businessState",
  "businessPincode",
  "businessCountry",
  "businessHours",
  "razorpayDisplayName",
] as const;

/**
 * Updates the single businesssettings document behind the brand, contact and
 * address fields the storefront renders. The storefront loads these fresh on
 * every request, so a saved value is live immediately.
 *
 * Json fields like `social` are merged rather than overwritten whole, and
 * anything the form does not edit (notifications, logo, the online payment
 * flag) is left untouched.
 */
export async function PATCH(request: Request) {
  const email = await requireAdminApi();
  if (!email) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const parsed = await jsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const data: Prisma.BusinessSettingsUpdateInput = {};

  for (const field of TEXT_FIELDS) {
    if (body[field] === undefined) continue;
    const value = asOptionalText(body[field], field);
    if (!value.ok) return NextResponse.json({ error: value.message }, { status: 400 });
    (data as Record<string, unknown>)[field] = value.value ?? "";
  }

  if (body.social !== undefined) {
    if (!isObject(body.social)) {
      return NextResponse.json({ error: "social must be an object." }, { status: 400 });
    }
    // Merge over the stored object rather than replacing it, so a key the form
    // does not know about is never dropped by saving the ones it does.
    const merged: Record<string, unknown> = {};
    const existing = await prisma.businessSettings.findFirst({
      select: { social: true },
    });
    if (existing && existing.social && typeof existing.social === "object" && !Array.isArray(existing.social)) {
      for (const [key, value] of Object.entries(existing.social as Record<string, unknown>)) {
        merged[key] = value;
      }
    }
    for (const [key, value] of Object.entries(body.social)) {
      merged[key] = typeof value === "string" ? value : "";
    }
    data.social = merged as Prisma.InputJsonValue;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const existing = await prisma.businessSettings.findFirst({
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "No settings document exists yet; create one first." },
        { status: 404 }
      );
    }

    const settings = await prisma.businessSettings.update({
      where: { id: existing.id },
      data,
      select: { id: true, brandName: true, updatedAt: true },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[mongo] admin update settings failed", error);
    return NextResponse.json({ error: "The settings could not be saved." }, { status: 500 });
  }
}