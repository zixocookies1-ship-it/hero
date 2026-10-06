import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  asBoolean,
  asInteger,
  asOptionalInteger,
  asOptionalText,
  jsonBody,
  rupeesToPaise,
  uniqueViolation,
} from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Updates one variant. The price and MRP travel as whole rupees and are stored
 * in paise, matching how the catalogue service seeds this collection. The
 * storefront reads the first active variant, so changing price, inventory or the
 * publish flag here changes what a customer is charged immediately.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const email = await requireAdminApi();
  if (!email) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const { id, variantId } = await params;

  const parsed = await jsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const price = rupeesToPaise(body.priceInr, "Selling price", { min: 1 });
  if (!price.ok) return NextResponse.json({ error: price.message }, { status: 400 });

  const mrp = asOptionalInteger(body.mrpInr, "MRP", { min: 1 });
  if (!mrp.ok) return NextResponse.json({ error: mrp.message }, { status: 400 });
  if (mrp.value !== null && mrp.value < price.value / 100) {
    return NextResponse.json(
      { error: "MRP cannot be lower than the selling price." },
      { status: 400 }
    );
  }

  const inventory = asInteger(body.inventory, "Inventory", { min: 0 });
  if (!inventory.ok) return NextResponse.json({ error: inventory.message }, { status: 400 });

  const weightLabel = asOptionalText(body.weightLabel, "Weight");
  if (!weightLabel.ok) return NextResponse.json({ error: weightLabel.message }, { status: 400 });

  const weightGrams = asOptionalInteger(body.weightGrams, "Weight in grams", { min: 0 });
  if (!weightGrams.ok) return NextResponse.json({ error: weightGrams.message }, { status: 400 });

  const packCount = asOptionalInteger(body.packCount, "Pack count", { min: 1 });
  if (!packCount.ok) return NextResponse.json({ error: packCount.message }, { status: 400 });

  const data: Record<string, unknown> = {
    pricePaise: price.value,
    inventory: inventory.value,
  };
  data.mrpPaise = mrp.value;
  if (body.weightLabel !== undefined && weightLabel.value !== null) {
    data.weightLabel = weightLabel.value;
  }
  if (body.weightGrams !== undefined && weightGrams.value !== null) {
    data.weightGrams = weightGrams.value;
  }
  if (body.packCount !== undefined && packCount.value !== null) {
    data.packCount = packCount.value;
  }
  if (body.isActive !== undefined) {
    const isActive = asBoolean(body.isActive, "Published");
    if (!isActive.ok) return NextResponse.json({ error: isActive.message }, { status: 400 });
    data.isActive = isActive.value;
  }

  try {
    const updated = await prisma.productVariant.update({
      where: { id: variantId, productId: id },
      data,
      select: { id: true, sku: true, pricePaise: true, isActive: true, inventory: true },
    });
    return NextResponse.json({ variant: updated });
  } catch (error) {
    if (uniqueViolation(error)) {
      return NextResponse.json({ error: "A variant with that SKU already exists." }, { status: 409 });
    }
    console.error("[mongo] admin update variant failed", error);
    return NextResponse.json({ error: "The variant could not be updated." }, { status: 500 });
  }
}