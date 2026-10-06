import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  asBoolean,
  asInteger,
  asOptionalText,
  jsonBody,
  uniqueViolation,
} from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Updates a product row. The slug is deliberately immutable: changing it would
 * break every bookmarked and received link to that product page.
 *
 * `isActive` is how a product leaves and returns to the storefront without ever
 * deleting a document, so removal stays reversible.
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

  const name = asOptionalText(body.name, "Name");
  if (!name.ok) return NextResponse.json({ error: name.message }, { status: 400 });

  const tagline = asOptionalText(body.tagline, "Tagline");
  if (!tagline.ok) return NextResponse.json({ error: tagline.message }, { status: 400 });

  const flavour = asOptionalText(body.flavour, "Flavour");
  if (!flavour.ok) return NextResponse.json({ error: flavour.message }, { status: 400 });

  const sortOrder = asInteger(body.sortOrder, "Sort order", { min: 0 });
  if (!sortOrder.ok) return NextResponse.json({ error: sortOrder.message }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (name.value !== null) data.name = name.value;
  if (tagline.value !== null) data.tagline = tagline.value;
  if (flavour.value !== null) data.flavour = flavour.value;
  if (body.sortOrder !== undefined) data.sortOrder = sortOrder.value;
  if (body.isActive !== undefined) {
    const isActive = asBoolean(body.isActive, "Published");
    if (!isActive.ok) return NextResponse.json({ error: isActive.message }, { status: 400 });
    data.isActive = isActive.value;
  }
  if (body.isFeatured !== undefined) {
    const isFeatured = asBoolean(body.isFeatured, "Featured");
    if (!isFeatured.ok) return NextResponse.json({ error: isFeatured.message }, { status: 400 });
    data.isFeatured = isFeatured.value;
  }

  if (body.images !== undefined) {
    if (!Array.isArray(body.images) || body.images.length > 10) {
      return NextResponse.json(
        { error: "Images must be a list of up to 10 URLs." },
        { status: 400 }
      );
    }
    const images = body.images.map((entry) => (typeof entry === "string" ? entry.trim() : ""));
    if (images.some((entry) => !entry || entry.length > 500)) {
      return NextResponse.json({ error: "Each image must be a URL or an /images/ path." }, { status: 400 });
    }
    if (images.some((entry) => !/^(https?:\/\/|\/)/.test(entry))) {
      return NextResponse.json(
        { error: "Each image must be an absolute URL or an /images/ path." },
        { status: 400 }
      );
    }
    data.imagePaths = images;
  }

  try {
    const updated = await prisma.catalogProduct.update({
      where: { id },
      data,
      select: { id: true, slug: true, isActive: true },
    });
    return NextResponse.json({ product: updated });
  } catch (error) {
    if (uniqueViolation(error)) {
      return NextResponse.json({ error: "A product with that slug already exists." }, { status: 409 });
    }
    console.error("[mongo] admin update product failed", error);
    return NextResponse.json({ error: "The product could not be updated." }, { status: 500 });
  }
}