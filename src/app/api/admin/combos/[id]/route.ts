import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  asBoolean,
  asInteger,
  asOptionalInteger,
  asOptionalText,
  jsonBody,
} from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ComboItemInput = { slug: string; name: string; quantity: number };

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
 * Updates a combo's name, copy, artwork, pricing, contents or publish flags.
 * All fields are optional; only the ones supplied change.
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

  if (body.name !== undefined) {
    const name = asOptionalText(body.name, "Name");
    if (!name.ok) return NextResponse.json({ error: name.message }, { status: 400 });
    if (name.value === "") return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    data.name = name.value;
  }

  if (body.description !== undefined) {
    const description = asOptionalText(body.description, "Description");
    if (!description.ok) return NextResponse.json({ error: description.message }, { status: 400 });
    data.description = description.value;
  }

  if (body.image !== undefined) {
    const image = validateImage(body.image);
    if (!image.ok) return NextResponse.json({ error: image.error }, { status: 400 });
    data.image = image.value;
  }

  if (body.priceInr !== undefined) {
    const priceInr = asInteger(body.priceInr, "Price", { min: 1 });
    if (!priceInr.ok) return NextResponse.json({ error: priceInr.message }, { status: 400 });
    data.pricePaise = priceInr.value * 100;
  }

  if (body.mrpInr !== undefined) {
    const mrpInr = asOptionalInteger(body.mrpInr, "MRP", { min: 1 });
    if (!mrpInr.ok) return NextResponse.json({ error: mrpInr.message }, { status: 400 });
    data.mrpPaise = mrpInr.value === null ? undefined : mrpInr.value * 100;
  }

  if (body.items !== undefined) {
    const items = validateItems(body.items);
    if (!items.ok) return NextResponse.json({ error: items.error }, { status: 400 });
    data.items = items.value;
  }

  for (const [field, label] of [
    ["isActive", "Active"],
    ["isFeatured", "Featured"],
    ["showOnHomepage", "Show on homepage"],
    ["showOnProducts", "Show on products"],
  ] as const) {
    if (body[field] !== undefined) {
      const value = asBoolean(body[field], label);
      if (!value.ok) return NextResponse.json({ error: value.message }, { status: 400 });
      data[field] = value.value;
    }
  }

  if (body.sortOrder !== undefined) {
    const sortOrder = asInteger(body.sortOrder, "Position", { min: 0 });
    if (!sortOrder.ok) return NextResponse.json({ error: sortOrder.message }, { status: 400 });
    data.sortOrder = sortOrder.value;
  }

  // Pricing fields must stay consistent: MRP may not sit below the price.
  const nextPricePaise = (data.pricePaise as number | undefined) ?? null;
  const nextMrpPaise = (data.mrpPaise as number | undefined) ?? null;
  if (nextMrpPaise !== null && nextPricePaise !== null && nextMrpPaise < nextPricePaise) {
    return NextResponse.json(
      { error: "MRP cannot be lower than the combo price." },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.combo.update({
      where: { id },
      data,
      select: { id: true, name: true, isActive: true },
    });
    return NextResponse.json({ combo: updated });
  } catch (error) {
    console.error("[mongo] admin update combo failed", error);
    return NextResponse.json({ error: "The combo could not be updated." }, { status: 500 });
  }
}

/**
 * Permanently removes a combo. Cart lines that point at it stop resolving on
 * the next render, so checkout rejects it instead of pricing it.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await requireAdminApi();
  if (!email) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deleted = await prisma.combo.deleteMany({ where: { id } });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "No combo found with that id." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[mongo] admin delete combo failed", error);
    return NextResponse.json({ error: "The combo could not be deleted." }, { status: 500 });
  }
}