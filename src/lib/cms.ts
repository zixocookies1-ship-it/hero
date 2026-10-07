import { cache } from "react";
import { prisma } from "@/lib/db";
import { products as FALLBACK_PRODUCTS, type Product } from "@/lib/products";
import { BRAND } from "@/lib/brand";
import { comboDiscountPercent, type Combo, type ComboItem } from "@/lib/combos";
import { getShippingPolicy } from "@/lib/pricing";

/**
 * The storefront's read path over MongoDB.
 *
 * Every loader here has one job: return what the database says, or if the
 * database cannot be reached or holds nothing usable, return the value the
 * project shipped with before any of this existed. A blank page is never an
 * acceptable outcome of a failed query, so nothing in this module throws.
 */

export type Brand = {
  name: string;
  tagline: string;
  whatsappNumber: string;
  phoneDisplay: string;
  phoneDial: string;
  email: string;
  address: {
    line1: string;
    line2: string;
    cityState: string;
    pincode: string;
    country: string;
  };
  social: {
    instagram: string;
    youtube: string;
    facebook: string;
  };
};

/**
 * One entry in a section's bullet list. Which of these a component reads is up
 * to the section: trust cards use subtitle/title/text, steps use title/text,
 * story highlights use value/text, FAQs use title/text, reviews add rating.
 */
export type SectionItem = {
  title?: string;
  subtitle?: string;
  text?: string;
  value?: string;
  href?: string;
  rating?: number;
};

export type SectionLink = {
  label: string;
  href: string;
};

export type Section = {
  key: string;
  label: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  body: string;
  body2: string;
  image: string;
  imageMobile: string;
  items: SectionItem[];
  links: SectionLink[];
};

export type SectionMap = Record<string, Section>;

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const text = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asItems = (value: unknown): SectionItem[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const rating = Number(record.rating);
    return [
      {
        title: text(record.title),
        subtitle: text(record.subtitle),
        text: text(record.text),
        value: text(record.value),
        href: text(record.href),
        ...(Number.isFinite(rating) ? { rating } : {}),
      },
    ];
  });
};

const asLinks = (value: unknown): SectionLink[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const label = text(record.label);
    const href = text(record.href);
    if (!label && !href) return [];
    return [{ label, href }];
  });
};

const toSection = (row: {
  key: string;
  label: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  body: string;
  body2: string;
  image: string;
  imageMobile: string | null;
  items: unknown;
  links: unknown;
}): Section => ({
  key: row.key,
  label: row.label,
  eyebrow: row.eyebrow,
  title: row.title,
  titleAccent: row.titleAccent,
  body: row.body,
  body2: row.body2,
  image: row.image,
  imageMobile: row.imageMobile ?? "",
  items: asItems(row.items),
  links: asLinks(row.links),
});

/**
 * Turns one catalogue row and its variants into the shape every storefront
 * component already renders. The sellable variant is the one marked active â€”
 * this catalogue carries one pack size per flavour, so there is exactly one.
 */
const toProduct = (
  row: {
    slug: string;
    name: string;
    description: string;
    sortOrder: number;
    isFeatured: boolean;
    variantName: string | null;
    shortName: string | null;
    flavourNote: string | null;
    highlights: unknown;
    ingredientsText: string | null;
    weight: string | null;
    pack: string | null;
    imagePaths: unknown;
  },
  variants: Array<{
    weightLabel: string;
    packCount: number;
    pricePaise: number;
    mrpPaise: number | null;
    inventory: number;
    isActive: boolean;
  }>
): Product => {
  const variant =
    variants.find((entry) => entry.isActive) ?? variants[0] ?? null;

  const sellingPrice = variant ? Math.round(variant.pricePaise / 100) : 0;
  const mrp = variant
    ? Math.round((variant.mrpPaise ?? variant.pricePaise) / 100)
    : sellingPrice;
  const discountPercent =
    mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

  const packFromVariant = variant ? `Pack of ${variant.packCount}` : "";

  const storedImages = stringArray(row.imagePaths);
  const codeEquivalent = FALLBACK_PRODUCTS.find((entry) => entry.slug === row.slug);

  return {
    slug: row.slug,
    name: row.name,
    featured: row.isFeatured,
    variantName: row.variantName ?? codeEquivalent?.variantName ?? row.name,
    shortName: row.shortName ?? codeEquivalent?.shortName ?? row.name,
    flavourNote: row.flavourNote ?? codeEquivalent?.flavourNote ?? "",
    description: row.description,
    ingredients:
      row.ingredientsText ?? codeEquivalent?.ingredients ?? "",
    highlights: (() => {
      const fromDb = stringArray(row.highlights);
      if (fromDb.length > 0) return fromDb;
      return codeEquivalent?.highlights ?? [];
    })(),
    weight: row.weight ?? variant?.weightLabel ?? codeEquivalent?.weight ?? "",
    pack: row.pack ?? codeEquivalent?.pack ?? packFromVariant,
    mrp,
    sellingPrice,
    discountPercent,
    inStock: variant ? variant.inventory > 0 : false,
    images:
      storedImages.length > 0
        ? storedImages
        : (codeEquivalent?.images ?? ["/images/logo.png"]),
  };
};

export const loadCatalogueUncached = async (): Promise<Product[]> => {
  try {
    const rows = await prisma.catalogProduct.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });

    const catalogue = rows
      .map((row) => toProduct(row, row.variants))
      .filter((product) => product.slug);

    return catalogue.length > 0 ? catalogue : FALLBACK_PRODUCTS;
  } catch (error) {
    console.error("[cms] catalogue load failed, using shipped list", error);
    return FALLBACK_PRODUCTS;
  }
};

/**
 * Memoised per request: a page that renders a dozen sections pays for one
 * query, not a dozen, and no result survives into the next request.
 */
export const loadCatalogue = cache(loadCatalogueUncached);

const comboItems = (value: unknown): ComboItem[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const slug = text(record.slug);
    if (!slug) return [];
    const quantity = Number(record.quantity);
    return [
      {
        slug,
        name: text(record.name),
        quantity:
          Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1,
      },
    ];
  });
};

/**
 * Turns one `combos` collection row into the shape the storefront, the cart
 * and the admin share. Money is stored in paise in MongoDB and converted to
 * whole rupees here, exactly like the catalogue does in toProduct.
 */
const toCombo = (row: {
  id: string;
  name: string;
  description: string;
  image: string;
  items: unknown;
  pricePaise: number;
  mrpPaise: number;
  isActive: boolean;
  isFeatured: boolean;
  showOnHomepage: boolean;
  showOnProducts: boolean;
}): Combo => {
  const priceInr = Math.round(row.pricePaise / 100);
  const mrpInr = Math.round(row.mrpPaise / 100);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.image || "/images/logo.png",
    items: comboItems(row.items),
    priceInr,
    mrpInr,
    discountPercent: comboDiscountPercent(mrpInr, priceInr),
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    showOnHomepage: row.showOnHomepage,
    showOnProducts: row.showOnProducts,
  };
};

/**
 * Every combo in the collection, ordered by `sortOrder`.
 *
 * Active and inactive are both returned: the storefront filters to active
 * ones, while cart and checkout use the full list so a combo can be rejected
 * (not ignore) once it has been unpublished. A failed query returns an empty
 * list rather than throwing, so a blank page is never a result of a bad
 * database state.
 */
export const loadCombosUncached = async (): Promise<Combo[]> => {
  try {
    const rows = await prisma.combo.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return rows.map(toCombo);
  } catch (error) {
    console.error("[cms] combo load failed, showing none", error);
    return [];
  }
};

export const loadCombos = cache(loadCombosUncached);

const FALLBACK_BRAND: Brand = BRAND;

/**
 * The single settings document, memoised per request.
 *
 * The brand block, the announcement strip and the shipping policy all read
 * fields from this one row. Reading it once (instead of once per consumer)
 * removes a database round-trip from every storefront page.
 */
export const loadSettingsUncached = async (): Promise<
  Awaited<ReturnType<typeof prisma.businessSettings.findFirst>>
> => {
  try {
    return await prisma.businessSettings.findFirst();
  } catch (error) {
    console.error("[cms] settings load failed, using shipped values", error);
    return null;
  }
};

export const loadSettings = cache(loadSettingsUncached);

export const loadBrandUncached = async (): Promise<Brand> => {
  // Through the memoised loader, not the raw one: the home request also reads
  // settings for the announcement strip, and without this the same row is
  // queried twice per render.
  const settings = await loadSettings();
  if (!settings) return FALLBACK_BRAND;

    const social = (settings.social && typeof settings.social === "object" && !Array.isArray(settings.social)
      ? (settings.social as Record<string, unknown>)
      : {}) as Record<string, unknown>;

    return {
      name: settings.brandName || FALLBACK_BRAND.name,
      tagline: settings.tagline || FALLBACK_BRAND.tagline,
      whatsappNumber: settings.whatsappNumber || FALLBACK_BRAND.whatsappNumber,
      phoneDisplay: settings.supportPhone || FALLBACK_BRAND.phoneDisplay,
      phoneDial:
        (settings.supportPhone || FALLBACK_BRAND.phoneDial).replace(/\s+/g, ""),
      email: settings.supportEmail || FALLBACK_BRAND.email,
      address: {
        line1: settings.businessAddressLine1 || FALLBACK_BRAND.address.line1,
        line2: settings.businessAddressLine2 || FALLBACK_BRAND.address.line2,
        cityState:
          [settings.businessCity, settings.businessState].filter(Boolean).join(" ") ||
          FALLBACK_BRAND.address.cityState,
        pincode: settings.businessPincode || FALLBACK_BRAND.address.pincode,
        country: settings.businessCountry || FALLBACK_BRAND.address.country,
      },
      social: {
        instagram:
          text(social.instagram) ||
          settings.instagramHandle ||
          FALLBACK_BRAND.social.instagram,
        youtube: text(social.youtube) || FALLBACK_BRAND.social.youtube,
        facebook: text(social.facebook) || FALLBACK_BRAND.social.facebook,
      },
    };
};

export const loadBrand = cache(loadBrandUncached);

export const loadSectionsUncached = async (): Promise<SectionMap> => {
  try {
    const rows = await prisma.section.findMany({ orderBy: { key: "asc" } });
    const map: SectionMap = {};
    for (const row of rows) map[row.key] = toSection(row);
    return map;
  } catch (error) {
    console.error("[cms] section load failed, components keep shipped copy", error);
    return {};
  }
};

/**
 * Every editable section, keyed by `key`.
 *
 * Returns an empty map when the collection is empty or unreachable â€” each
 * section component holds the copy it shipped with and falls back to it
 * whenever this map has nothing for its key, so an empty result changes
 * nothing on screen.
 */
export const loadSections = cache(loadSectionsUncached);

/**
 * The delivery rule the storefront actually charges and displays.
 *
 * MongoDB's `shippingconfigurations` document is the single source for the
 * admin-editable settings; the environment variables are only a fallback for
 * when that collection is missing or unreachable, so an absent seed never
 * stops a sale. The whole live flow — checkout preview, the amount charged by
 * create-order — reads one memoised result per request.
 */
export type ShippingPolicy = {
  /** Flat shipping the shopper pays when over the threshold is not met. */
  feeInr: number;
  /** Subtotal over which shipping is free. Null means it is always charged. */
  freeAboveInr: number | null;
  /** False pauses charging for shipping (e.g. pickup-only mode). */
  shippingEnabled: boolean;
};

export const loadShippingPolicyUncached = async (): Promise<ShippingPolicy> => {
  const env = getShippingPolicy();
  try {
    const config = await prisma.shippingConfiguration.findFirst();
    if (!config) return { feeInr: env.feeInr, freeAboveInr: env.freeAboveInr, shippingEnabled: true };

    const flatPaise = config.flatShippingPaise + config.handlingPaise;
    return {
      feeInr: config.shippingEnabled ? Math.round(flatPaise / 100) : 0,
      freeAboveInr: config.freeShippingEnabled
        ? Math.round(config.freeShippingThresholdPaise / 100)
        : null,
      shippingEnabled: config.shippingEnabled,
    };
  } catch (error) {
    console.error("[cms] shipping config load failed, using environment policy", error);
    return { feeInr: env.feeInr, freeAboveInr: env.freeAboveInr, shippingEnabled: true };
  }
};

export const loadShippingPolicy = cache(loadShippingPolicyUncached);

/**
 * Splits the raw `announcement` setting into the individual marquee messages.
 * The stored value is a pipe-separated strip, e.g.
 * `"PAN INDIA DELIVERY | SECURE PAYMENTS | CUSTOMER SUPPORT"`. Blank entries
 * are dropped so a stray `|` never renders an empty segment.
 */
export const splitAnnouncements = (raw: string): string[] =>
  raw
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

/**
 * Shipped-with strip, used only when the database is unreachable so the bar
 * never goes blank as the result of a failed query. When the database IS
 * reachable the stored setting is authoritative, and clearing it in the admin
 * intentionally removes the bar.
 */
const FALLBACK_ANNOUNCEMENTS = [
  "Pan India delivery",
  "Secure payments",
  "Customer support",
];

export const loadAnnouncementsUncached = async (): Promise<string[]> => {
  const settings = await loadSettings();
  if (!settings) return FALLBACK_ANNOUNCEMENTS;
  const split = splitAnnouncements(settings.announcement ?? "");
  return split.length > 0 ? split : [];
};

export const loadAnnouncements = cache(loadAnnouncementsUncached);

/**
 * Replaces `{{token}}` placeholders in stored copy.
 *
 * Two pieces of live text live inside editable copy â€” the shelf life and the
 * price inside the fifth decision. Keeping them as tokens means an admin edit
 * cannot freeze a price on the page: the value is substituted from the
 * catalogue at render time, exactly as the original code did.
 */
export const renderTemplate = (
  value: string,
  tokens: Record<string, string | number>
): string =>
  value.replace(/\{\{(\w+)\}\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(tokens, name) ? String(tokens[name]) : whole
  );
