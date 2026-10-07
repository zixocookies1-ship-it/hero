import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  asBoolean,
  asInteger,
  asOptionalInteger,
  asOptionalText,
  asRequiredText,
  jsonBody,
} from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type ComboItemInput = { slug: string; name: string; quantity: number };

/** Combo contents: a JSON list of {"slug", "name", "quantity"} rows. */
function validateItems(value: unknown): { ok: true; value: ComboItemInput[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) {
    return { ok: false, error: "Items must be a list of { slug, name, quantity }." };
  }
  const items: ComboItemInput[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      return { ok: false, error: "Each item must be an object with slug, name and quantity." };
    }
    const record = entry as Record<string, unknown>;
    const slug = typeof record.slug === "string" ? record.slug.trim() : "";
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const quantity = Number(record.quantity);
    if (!slug) return { ok: false, error: "Each combo item needs a product slug." };
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { ok: false, error: `Quantity for "${name || slug}" must be a whole number between 1 and 99.` };
    }
    items.push({ slug, name: name || slug, quantity });
  }
  if (items.length === 0) {
    return { ok: false, error: "A combo needs at least one item." };
  }
  return { ok: true, value: items };
}

/** Banner/combo artwork: an absolute URL or an /images/ path, max 500 chars. */
function validateImage(value: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string") return { ok: false, error: "Image must be a URL or an /images/ path." };
  const image = value.trim();
  if (!image || image.length > 500) {
    return { ok: false, error: "Image must be a URL or an /images/ path." };
  }
  if (!/^(https?:\/\/|\/)/.test(image)) {
    return { ok: false, error: "Image must be an absolute URL or an /images/ path." };
  }
  return { ok: true, value: image };
}

/**
 * Creates a combo bundle. The storefront lists it when `isActive`, the cart
 * prices it from `pricePaise`/`mrpPaise`, and checkout charges it like any
 * other line item — so a combo is publishable with just a name, an image, a
 * price and its item list.
 */
export async function POST(request: Request) {
  const email = await requireAdminApi();
  if (!email) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const parsed = await jsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const name = asRequiredText(body.name, "Name");
  if (!name.ok) return NextResponse.json({ error: name.message }, { status: 400 });

  if (body.image === undefined || body.image === null) {
    return NextResponse.json({ error: "A combo needs a photo." }, { status: 400 });
  }
  const image = validateImage(body.image);
  if (!image.ok) return NextResponse.json({ error: image.error }, { status: 400 });

  const priceInr = asInteger(body.priceInr, "Price", { min: 1 });
  if (!priceInr.ok) return NextResponse.json({ error: priceInr.message }, { status: 400 });

  const mrpInr = asOptionalInteger(body.mrpInr, "MRP", { min: 1 });
  if (!mrpInr.ok) return NextResponse.json({ error: mrpInr.message }, { status: 400 });
  if (mrpInr.value !== null && mrpInr.value < priceInr.value) {
    return NextResponse.json(
      { error: "MRP cannot be lower than the combo price." },
      { status: 400 }
    );
  }

  const items = validateItems(body.items);
  if (!items.ok) return NextResponse.json({ error: items.error }, { status: 400 });

  const description =
    body.description === undefined || body.description === null
      ? { ok: true as const, value: "" as string }
      : asOptionalText(body.description, "Description");
  if (!description.ok) return NextResponse.json({ error: description.message }, { status: 400 });
  const descriptionText = description.value ?? "";

  const isActive =
    body.isActive === undefined ? { ok: true as const, value: true } : asBoolean(body.isActive, "Active");
  if (!isActive.ok) return NextResponse.json({ error: isActive.message }, { status: 400 });

  const isFeatured =
    body.isFeatured === undefined ? { ok: true as const, value: false } : asBoolean(body.isFeatured, "Featured");
  if (!isFeatured.ok) return NextResponse.json({ error: isFeatured.message }, { status: 400 });

  const showOnHomepage =
    body.showOnHomepage === undefined ? { ok: true as const, value: true } : asBoolean(body.showOnHomepage, "Show on home");
  if (!showOnHomepage.ok) return NextResponse.json({ error: showOnHomepage.message }, { status: 400 });

  const showOnProducts =
    body.showOnProducts === undefined ? { ok: true as const, value: true } : asBoolean(body.showOnProducts, "Show on products");
  if (!showOnProducts.ok) return NextResponse.json({ error: showOnProducts.message }, { status: 400 });

  const sortOrder =
    body.sortOrder === undefined ? { ok: true as const, value: 0 } : asInteger(body.sortOrder, "Position", { min: 0 });
  if (!sortOrder.ok) return NextResponse.json({ error: sortOrder.message }, { status: 400 });

  try {
    const combo = await prisma.combo.create({
      data: {
        name: name.value,
        description: descriptionText,
        image: image.value,
        pricePaise: priceInr.value * 100,
        mrpPaise: (mrpInr.value ?? priceInr.value) * 100,
        items: items.value,
        isActive: isActive.value,
        isFeatured: isFeatured.value,
        showOnHomepage: showOnHomepage.value,
        showOnProducts: showOnProducts.value,
        sortOrder: sortOrder.value,
      },
      select: { id: true, name: true, isActive: true },
    });

    return NextResponse.json({ combo }, { status: 201 });
  } catch (error) {
    console.error("[mongo] admin create combo failed", error);
    return NextResponse.json({ error: "The combo could not be created." }, { status: 500 });
  }
}