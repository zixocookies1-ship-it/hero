import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  SLUG_PATTERN,
  asInteger,
  asOptionalInteger,
  asOptionalText,
  asRequiredText,
  jsonBody,
  uniqueViolation,
} from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Creates a product and its first sellable variant in one request.
 *
 * Everything the storefront requires exists on the row (the loader reads the
 * sortable catalogue, the price comes from the active variant), so a product can
 * be put on sale with just a name, a slug, a price and a weight. The rest of the
 * columns start empty and can be filled in later.
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

  const slug = asRequiredText(body.slug, "Slug");
  if (!slug.ok) return NextResponse.json({ error: slug.message }, { status: 400 });
  if (!SLUG_PATTERN.test(slug.value)) {
    return NextResponse.json(
      { error: "Slug may only contain lowercase letters, numbers and hyphens." },
      { status: 400 }
    );
  }

  const priceInr = asInteger(body.priceInr, "Selling price", { min: 1 });
  if (!priceInr.ok) return NextResponse.json({ error: priceInr.message }, { status: 400 });

  const mrpInr = asOptionalInteger(body.mrpInr, "MRP", { min: 1 });
  if (!mrpInr.ok) return NextResponse.json({ error: mrpInr.message }, { status: 400 });
  if (mrpInr.value !== null && mrpInr.value < priceInr.value) {
    return NextResponse.json(
      { error: "MRP cannot be lower than the selling price." },
      { status: 400 }
    );
  }

  const weightLabel = asOptionalText(body.weightLabel, "Weight");
  if (!weightLabel.ok) return NextResponse.json({ error: weightLabel.message }, { status: 400 });

  const packCount = asInteger(body.packCount, "Pack count", { min: 1 });
  if (!packCount.ok) return NextResponse.json({ error: packCount.message }, { status: 400 });

  const inventory = asInteger(body.inventory, "Inventory", { min: 0 });
  if (!inventory.ok) return NextResponse.json({ error: inventory.message }, { status: 400 });

  const flavour = asOptionalText(body.flavour, "Flavour");
  if (!flavour.ok) return NextResponse.json({ error: flavour.message }, { status: 400 });

  const description = asOptionalText(body.description, "Description");
  if (!description.ok) return NextResponse.json({ error: description.message }, { status: 400 });

  const now = new Date();

  try {
    const product = await prisma.catalogProduct.create({
      data: {
        name: name.value,
        slug: slug.value,
        tagline: flavour.value ?? "",
        shortDescription: description.value ?? "",
        description: description.value ?? "",
        flavour: flavour.value ?? "",
        sortOrder: 0,
        isActive: true,
        isFeatured: false,
        isVerified: false,
        seoTitle: name.value,
        seoDescription: description.value ?? "",
        shelfLife: "8 months",
        storage: "",
        fssaiNote: "",
        images: [],
        ogImage: {},
        marketplace: [],
        nutritionPer: {},
        allergens: [],
        ingredients: [],
        howToUse: [],
        nutrition: [],
        createdAt: now,
        updatedAt: now,
        variants: {
          create: {
            sku: `new-${Date.now()}`,
            weightGrams: 0,
            weightLabel: weightLabel.value ?? `${packCount.value} pack`,
            packCount: packCount.value,
            pricePaise: priceInr.value * 100,
            mrpPaise: mrpInr.value === null ? null : mrpInr.value * 100,
            inventory: inventory.value,
            lowStockThreshold: 5,
            isActive: true,
            sortOrder: 0,
            createdAt: now,
            updatedAt: now,
          },
        },
      },
      select: { id: true, slug: true, name: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (uniqueViolation(error)) {
      return NextResponse.json(
        { error: "A product with that slug already exists." },
        { status: 409 }
      );
    }
    console.error("[mongo] admin create product failed", error);
    return NextResponse.json(
      { error: "The product could not be created." },
      { status: 500 }
    );
  }
}