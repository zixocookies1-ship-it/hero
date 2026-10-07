/**
 * Combos and cart identity.
 *
 * A combo is a bundle of catalogue products sold as one line item. The DB row
 * lives in the `combos` collection (see prisma/schema.prisma); this module
 * owns the shared, DB-free types and the string scheme that identifies a combo
 * inside the persisted cart.
 *
 * Cart lines store a slug — products use their catalogue slug, combos use
 * `combo-<id>`. The fixed prefix keeps the two namespaces apart even if an
 * admin ever names a product slug that begins with "combo-".
 */
export type ComboItem = {
  slug: string;
  name: string;
  quantity: number;
};

/** Client-facing combo. Loaded from MongoDB by loadCombos in lib/cms.ts. */
export type Combo = {
  id: string;
  name: string;
  description: string;
  image: string;
  items: ComboItem[];
  mrpInr: number;
  priceInr: number;
  discountPercent: number;
  isActive: boolean;
  isFeatured: boolean;
  showOnHomepage: boolean;
  showOnProducts: boolean;
};

/** Converts a combo's MongoDB ObjectId into the cart line's slug. */
export const comboCartSlug = (id: string): string => `combo-${id}`;

/** True when a cart line slug points at a combo rather than a product. */
export const isComboCartSlug = (slug: string): boolean =>
  typeof slug === "string" && slug.startsWith("combo-");

/** Pulls the combo id back out of a cart slug. Null for non-combo slugs. */
export const comboIdFromCartSlug = (slug: string): string | null =>
  isComboCartSlug(slug) ? slug.slice("combo-".length) : null;

export const comboDiscountPercent = (mrpInr: number, priceInr: number): number =>
  mrpInr > priceInr ? Math.round(((mrpInr - priceInr) / mrpInr) * 100) : 0;