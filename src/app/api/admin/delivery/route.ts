import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  asBoolean,
  asInteger,
  asOptionalText,
  jsonBody,
} from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fallback document used when the shippingconfigurations collection is empty.
 * It only fills the fields the schema insists on; admin edits then overwrite
 * the ones the form can change.
 */
const defaults = {
  configVersion: 1,
  shippingEnabled: true,
  shippingDisabledMessage: "Shipping is paused.",
  shippingPolicyNote: "",
  flatShippingPaise: 0,
  handlingPaise: 0,
  freeShippingEnabled: false,
  freeShippingThresholdPaise: 0,
  weightBasedShipping: false,
  weightRatePaisePerKg: 0,
  maxWeightPerOrderGrams: 0,
  codEnabled: false,
  codHandlingPaise: 0,
  codMaxOrderPaise: null as number | null,
  taxEnabled: false,
  taxInclusive: true,
  taxPercent: 0,
  serviceabilityMode: "pin",
  serviceablePincodes: [],
  blockedPincodes: [],
  unknownPincodeMessage: "",
  unserviceableMessage: "",
  showEstimatedDelivery: false,
  defaultEstimatedDeliveryDaysMin: 3,
  defaultEstimatedDeliveryDaysMax: 5,
  allowCancellation: false,
  cancelWindowHours: 0,
  pickupName: "",
  pickupContactName: "",
  pickupContactPhone: "",
  pickupEmail: "",
  pickupAddressLine1: "",
  pickupAddressLine2: "",
  pickupCity: "",
  pickupState: "",
  pickupPincode: "",
  pickupCountry: "",
};

/**
 * Saves the whole delivery settings form into the single
 * shippingconfigurations document. The storefront reads this document for
 * shipping charges on every checkout, so a success here is what the shopper
 * pays moments later. If no document exists yet, one is created.
 */
export async function PATCH(request: Request) {
  const email = await requireAdminApi();
  if (!email) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const parsed = await jsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const readInr = (raw: unknown, label: string, max: number) => {
    const fee = asInteger(raw, label, { min: 0, max });
    if (!fee.ok) return { ok: false as const, message: fee.message };
    return { ok: true as const, value: fee.value * 100 };
  };

  const shippingEnabled = asBoolean(body.shippingEnabled, "Shipping switch");
  if (!shippingEnabled.ok) return NextResponse.json({ error: shippingEnabled.message }, { status: 400 });

  const flatFeePaise = readInr(body.flatFeeInr, "Flat shipping fee", 1_000_000);
  if (!flatFeePaise.ok) return NextResponse.json({ error: flatFeePaise.message }, { status: 400 });

  const handlingPaise = readInr(body.handlingInr, "Handling fee", 1_000_000);
  if (!handlingPaise.ok) return NextResponse.json({ error: handlingPaise.message }, { status: 400 });

  const freeShippingEnabled = asBoolean(body.freeShippingEnabled, "Free-shipping switch");
  if (!freeShippingEnabled.ok) return NextResponse.json({ error: freeShippingEnabled.message }, { status: 400 });

  const thresholdPaise = readInr(body.freeShippingThresholdInr, "Free-shipping threshold", 10_000_000);
  if (!thresholdPaise.ok) return NextResponse.json({ error: thresholdPaise.message }, { status: 400 });

  const codEnabled = asBoolean(body.codEnabled, "Cash on delivery switch");
  if (!codEnabled.ok) return NextResponse.json({ error: codEnabled.message }, { status: 400 });

  const codHandlingPaise = readInr(body.codHandlingInr, "COD handling fee", 1_000_000);
  if (!codHandlingPaise.ok) return NextResponse.json({ error: codHandlingPaise.message }, { status: 400 });

  const showEstimatedDelivery = asBoolean(body.showEstimatedDelivery, "Delivery estimate switch");
  if (!showEstimatedDelivery.ok) return NextResponse.json({ error: showEstimatedDelivery.message }, { status: 400 });

  const daysMin = asInteger(body.estimateMinDays, "Minimum delivery days", { min: 0, max: 90 });
  if (!daysMin.ok) return NextResponse.json({ error: daysMin.message }, { status: 400 });

  const daysMax = asInteger(body.estimateMaxDays, "Maximum delivery days", { min: 0, max: 90 });
  if (!daysMax.ok) return NextResponse.json({ error: daysMax.message }, { status: 400 });
  if (daysMax.value < daysMin.value) {
    return NextResponse.json(
      { error: "The maximum delivery estimate cannot be shorter than the minimum." },
      { status: 400 }
    );
  }

  const allowCancellation = asBoolean(body.allowCancellation, "Cancellation switch");
  if (!allowCancellation.ok) return NextResponse.json({ error: allowCancellation.message }, { status: 400 });

  const cancelWindowHours = asInteger(body.cancelWindowHours, "Cancellation window", { min: 0, max: 720 });
  if (!cancelWindowHours.ok) return NextResponse.json({ error: cancelWindowHours.message }, { status: 400 });

  const taxEnabled = asBoolean(body.taxEnabled, "Tax switch");
  if (!taxEnabled.ok) return NextResponse.json({ error: taxEnabled.message }, { status: 400 });

  const taxInclusive = asBoolean(body.taxInclusive, "Tax inclusivity");
  if (!taxInclusive.ok) return NextResponse.json({ error: taxInclusive.message }, { status: 400 });

  const taxPercent = asInteger(body.taxPercent, "Tax percentage", { min: 0, max: 50 });
  if (!taxPercent.ok) return NextResponse.json({ error: taxPercent.message }, { status: 400 });

  const readText = (raw: unknown, label: string, max = 500) => {
    const value = asOptionalText(raw, label);
    if (!value.ok) return { ok: false as const, message: value.message };
    const trimmed = (value.value ?? "").trim();
    if (trimmed.length > max) {
      return { ok: false as const, message: `${label} must be ${max} characters or fewer.` };
    }
    return { ok: true as const, value: trimmed };
  };

  const pickup = {
    pickupName: readText(body.pickupName, "Pickup name"),
    pickupContactName: readText(body.pickupContactName, "Pickup contact name"),
    pickupContactPhone: readText(body.pickupContactPhone, "Pickup phone", 30),
    pickupEmail: readText(body.pickupEmail, "Pickup email", 200),
    pickupAddressLine1: readText(body.pickupAddressLine1, "Pickup address line 1"),
    pickupAddressLine2: readText(body.pickupAddressLine2, "Pickup address line 2"),
    pickupCity: readText(body.pickupCity, "Pickup city", 100),
    pickupState: readText(body.pickupState, "Pickup state", 100),
    pickupPincode: readText(body.pickupPincode, "Pickup pincode", 20),
    pickupCountry: readText(body.pickupCountry, "Pickup country", 100),
  };
  const pickupError = Object.values(pickup).find((entry) => !entry.ok);
  if (pickupError) return NextResponse.json({ error: pickupError.message }, { status: 400 });

  const pickupValues = Object.fromEntries(
    Object.entries(pickup).map(([key, entry]) => [key, entry.ok ? entry.value : ""])
  ) as Record<keyof typeof pickup, string>;

  try {
    const existing = await prisma.shippingConfiguration.findFirst();
    const updates = {
      shippingEnabled: shippingEnabled.value,
      flatShippingPaise: flatFeePaise.value,
      handlingPaise: handlingPaise.value,
      freeShippingEnabled: freeShippingEnabled.value,
      freeShippingThresholdPaise: thresholdPaise.value,
      codEnabled: codEnabled.value,
      codHandlingPaise: codHandlingPaise.value,
      showEstimatedDelivery: showEstimatedDelivery.value,
      defaultEstimatedDeliveryDaysMin: daysMin.value,
      defaultEstimatedDeliveryDaysMax: daysMax.value,
      allowCancellation: allowCancellation.value,
      cancelWindowHours: cancelWindowHours.value,
      taxEnabled: taxEnabled.value,
      taxInclusive: taxInclusive.value,
      taxPercent: taxPercent.value,
      pickupName: pickupValues.pickupName,
      pickupContactName: pickupValues.pickupContactName,
      pickupContactPhone: pickupValues.pickupContactPhone,
      pickupEmail: pickupValues.pickupEmail,
      pickupAddressLine1: pickupValues.pickupAddressLine1,
      pickupAddressLine2: pickupValues.pickupAddressLine2,
      pickupCity: pickupValues.pickupCity,
      pickupState: pickupValues.pickupState,
      pickupPincode: pickupValues.pickupPincode,
      pickupCountry: pickupValues.pickupCountry,
    };

    if (existing) {
      await prisma.shippingConfiguration.update({
        where: { id: existing.id },
        data: { ...updates, configVersion: existing.configVersion + 1, updatedAt: new Date() },
      });
    } else {
      await prisma.shippingConfiguration.create({
        data: {
          ...defaults,
          ...updates,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[mongo] admin delivery save failed", error);
    return NextResponse.json({ error: "The delivery settings could not be saved." }, { status: 500 });
  }
}