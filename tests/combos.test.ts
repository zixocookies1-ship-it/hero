/**
 * Offline cover for the Combos feature. Combos are priced bundles that flow
 * through the same cart, checkout and Razorpay order as products, so their
 * routes sit behind the admin session guard and the storefront sections only
 * render content the admin published. These tests assert that structure:
 * the schema, the guarded CRUD routes, the editor wiring, and the storefront
 * consumers that a combo card actually plugs into.
 *
 * Run with: npx tsx --test tests/combos.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const root = process.cwd();

const read = (relative: string): string =>
  fs.readFileSync(path.join(root, ...relative.split("/")), "utf8");

/** First needle not found in source, or null when all are present. */
const missing = (source: string, needles: readonly string[]): string | null =>
  needles.find((needle) => !source.includes(needle)) ?? null;

test("schema stores combos as priced bundles and tags combo order items", () => {
  const schema = read("prisma/schema.prisma");
  const comboBlock = schema.slice(schema.indexOf("model Combo"), schema.indexOf("model OrderItem"));
  assert.equal(
    missing(comboBlock, [
      "pricePaise",
      "mrpPaise",
      "items",
      "Json",
      "isFeatured",
      "showOnHomepage",
      "showOnProducts",
      "sortOrder",
      '@@map("combos")',
    ]),
    null,
    "Combo needs paise fields, an item list, publish flags and a collection map"
  );
  assert.ok(
    schema.includes("kind String?"),
    "OrderItem needs a nullable kind so combo lines and products stay identifiable"
  );
});

test("combos API is guarded, validates and supports hard delete", () => {
  const create = read("src/app/api/admin/combos/route.ts");
  assert.equal(
    missing(create, [
      "export async function POST",
      "requireAdminApi()",
      "prisma.combo.create",
      "validateItems",
      "priceInr",
      "MRP cannot be lower",
      "image",
    ]),
    null,
    "combo creation must be guarded and validate contents, prices and artwork"
  );

  const single = read("src/app/api/admin/combos/[id]/route.ts");
  assert.equal(
    missing(single, [
      "export async function PATCH",
      "export async function DELETE",
      "requireAdminApi()",
      "prisma.combo.update",
      "prisma.combo.deleteMany",
      "status: 404",
    ]),
    null,
    "combo updates must be guarded and delete must 404 when the combo is gone"
  );
});

test("combos page serialises paise and items for the editor", () => {
  const page = read("src/app/admin/(protected)/combos/page.tsx");
  assert.equal(
    missing(page, [
      "pricePaise",
      "mrpPaise",
      "priceInr",
      "comboItems",
      "AdminComboEditor",
      "orderBy: [{ sortOrder: \"asc\" }",
    ]),
    null,
    "the combos page must convert paise to rupees and sort by position"
  );
});

test("combo editor exposes create, item picker, publish flags and two-step delete", () => {
  const editor = read("src/components/admin-combo-editor.tsx");
  assert.equal(
    missing(editor, [
      "/api/admin/combos",
      "Add a combo",
      "Select a product…",
      "Add item",
      "Active (publish)",
      "Shown on homepage",
      "Shown on products page",
      "Confirm delete",
      "Save all changes",
      "AdminImageUpload",
    ]),
    null,
    "the combo editor must create bundles, pick catalogue items and confirm deletes"
  );
});

test("storefront COMBOS sections reference the combo card and title", () => {
  const home = read("src/app/(shop)/page.tsx");
  assert.equal(
    missing(home, [
      "COMBOS",
      "<ComboCard",
      "showOnHomepage",
      "loadCombos",
    ]),
    null,
    "the homepage must render published combos under a COMBOS heading"
  );

  const products = read("src/app/(shop)/products/page.tsx");
  assert.equal(
    missing(products, ["COMBOS", "<ComboCard", "showOnProducts", "loadCombos"]),
    null,
    "the products page must render published combos under a COMBOS heading"
  );
});

test("combo card adds itself through the cart context helper", () => {
  const card = read("src/components/combo-card.tsx");
  assert.equal(
    missing(card, ['"use client"', "useCart", "addComboItem", "comboCartSlug", "ADD TO CART"]),
    null,
    "the combo card must hydrate through the shared cart context"
  );

  const context = read("src/context/cart-context.tsx");
  assert.equal(
    missing(context, ["addComboItem", "entries", "setComboLineQuantity", "isComboCartSlug"]),
    null,
    "the cart context must accept combo lines and expose combined entries"
  );
});

test("checkout and orders distinguish combo lines", () => {
  const pricing = read("src/lib/pricing.ts");
  assert.equal(
    missing(pricing, ["kind", "comboId", "combos"]) === null,
    true,
    "pricing must carry the combo flag into priced lines"
  );

  const orders = read("src/lib/orders.ts");
  assert.ok(
    orders.includes('kind: line.kind === "combo" ? "combo" : undefined'),
    "order items must persist the combo kind so order cards can label bundles"
  );

  const checkout = read("src/components/checkout-form.tsx");
  assert.equal(
    missing(checkout, ["entries", 'kind: "combo"', "Combo"]),
    null,
    "checkout must preview combo entries and send their kind to the server"
  );
});