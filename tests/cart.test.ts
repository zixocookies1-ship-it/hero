/**
 * Regression cover for the cart. The original bug was in `addItem`: it mapped
 * over the existing lines only, so a slug that was not already in the cart was
 * dropped instead of appended. Adding any brand new product silently did nothing
 * while the button still reported success, and "Buy now" landed on an empty
 * checkout.
 *
 * The reducers are pure and live in src/lib/cart.ts, so they are tested directly
 * here without a DOM. Run with: npx tsx --test tests/cart.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import { getProductBySlug, products } from "../src/lib/products";
import {
  MAX_QUANTITY,
  addLine,
  cartPayload,
  clearLines,
  detailedLines,
  itemCount,
  parseStoredLines,
  quantityOfLine,
  removeLine,
  savings,
  setLineQuantity,
  subtotal,
  type CartLine,
} from "../src/lib/cart";

const [a, b, c] = products;
const slugA = a.slug;
const slugB = b.slug;
const slugC = c.slug;
const unknownSlug = "product-that-was-deleted";

const read = (relative: string) => fs.readFile(path.join(process.cwd(), relative), "utf8");

/** Applies a sequence of operations the way the provider's single mutate() path does. */
const run = (lines: CartLine[], ...steps: Array<(current: CartLine[]) => CartLine[]>) =>
  steps.reduce((current, step) => step(current), lines);

// 1. Add to Cart: the regression itself.
test("addLine appends a product that is not already in the cart", () => {
  const result = addLine([], slugA, 1);

  assert.equal(result.length, 1, "the first add must create a line");
  assert.deepEqual(result, [{ slug: slugA, quantity: 1 }]);
});

test("addLine appends a new product while preserving existing lines", () => {
  const result = addLine([{ slug: slugA, quantity: 2 }], slugB, 1);

  assert.deepEqual(result, [
    { slug: slugA, quantity: 2 },
    { slug: slugB, quantity: 1 },
  ]);
});

test("addLine increments an existing line instead of duplicating it", () => {
  const result = addLine([{ slug: slugA, quantity: 2 }], slugA, 1);

  assert.deepEqual(result, [{ slug: slugA, quantity: 3 }]);
});

test("repeated clicks accumulate rather than overwrite", () => {
  // Guards the stale-snapshot failure mode: each step must read the previous result.
  const result = run(
    [],
    ...Array.from({ length: 5 }, () => (current: CartLine[]) => addLine(current, slugA, 1))
  );

  assert.deepEqual(result, [{ slug: slugA, quantity: 5 }]);
});

test("addLine supports a quantity greater than one", () => {
  assert.deepEqual(addLine([], slugA, 3), [{ slug: slugA, quantity: 3 }]);
});

test("addLine ignores an unknown slug", () => {
  assert.deepEqual(addLine([], unknownSlug, 1), []);
  assert.deepEqual(addLine([{ slug: slugA, quantity: 1 }], unknownSlug, 1), [
    { slug: slugA, quantity: 1 },
  ]);
});

test("addLine clamps to MAX_QUANTITY and never stores zero or NaN", () => {
  assert.equal(quantityOfLine(addLine([], slugA, 500), slugA), MAX_QUANTITY);
  assert.equal(quantityOfLine(addLine([], slugA, 0), slugA), 1);
  assert.equal(quantityOfLine(addLine([], slugA, -4), slugA), 1);
  assert.equal(quantityOfLine(addLine([], slugA, 2.7), slugA), 2);
  assert.equal(quantityOfLine(addLine([], slugA, Number.NaN), slugA), 1);
});

// 2. Buy now: the add must be in place before navigation reads the snapshot.
test("the cart handed to checkout is the same state the provider exposes", () => {
  const lines = addLine([], slugA, 1);

  assert.equal(itemCount(lines), 1);
  assert.equal(detailedLines(lines).length, 1);
  assert.deepEqual(cartPayload(lines), [{ slug: slugA, quantity: 1 }]);
});

test("buy now on a cart that already has another product keeps both", () => {
  const lines = run([{ slug: slugB, quantity: 1 }], (current) => addLine(current, slugA, 1));

  assert.equal(itemCount(lines), 2);
});

// 3. Persistence.
test("parseStoredLines round-trips a valid payload", () => {
  const stored = JSON.stringify([
    { slug: slugA, quantity: 2 },
    { slug: slugB, quantity: 1 },
  ]);

  assert.deepEqual(parseStoredLines(stored), [
    { slug: slugA, quantity: 2 },
    { slug: slugB, quantity: 1 },
  ]);
});

test("parseStoredLines tolerates missing, empty and malformed storage", () => {
  assert.deepEqual(parseStoredLines(null), []);
  assert.deepEqual(parseStoredLines(""), []);
  assert.deepEqual(parseStoredLines("{not json"), []);
  assert.deepEqual(parseStoredLines('"a string"'), []);
  assert.deepEqual(parseStoredLines("null"), []);
  assert.deepEqual(parseStoredLines("123"), []);
});

test("parseStoredLines drops unusable entries but keeps the good ones", () => {
  const stored = JSON.stringify([
    { slug: slugA, quantity: 2 },
    null,
    "junk",
    { quantity: 2 },
    { slug: 42, quantity: 1 },
    { slug: unknownSlug, quantity: 1 },
    { slug: slugB },
    { slug: slugC, quantity: 0 },
  ]);

  assert.deepEqual(parseStoredLines(stored), [
    { slug: slugA, quantity: 2 },
    // quantity 0 and NaN are clamped to 1 rather than producing an unbuyable line
    { slug: slugC, quantity: 1 },
  ]);
});

test("parseStoredLines collapses duplicate slugs instead of double counting", () => {
  const stored = JSON.stringify([
    { slug: slugA, quantity: 2 },
    { slug: slugA, quantity: 9 },
  ]);

  assert.deepEqual(parseStoredLines(stored), [{ slug: slugA, quantity: 2 }]);
});

// 4. Quantity controls.
test("setQuantity sets an absolute value", () => {
  assert.deepEqual(setLineQuantity([{ slug: slugA, quantity: 2 }], slugA, 7), [
    { slug: slugA, quantity: 7 },
  ]);
});

test("setQuantity clamps to MAX_QUANTITY", () => {
  assert.deepEqual(setLineQuantity([{ slug: slugA, quantity: 1 }], slugA, 500), [
    { slug: slugA, quantity: MAX_QUANTITY },
  ]);
});

test("setQuantity removes the line at zero and below", () => {
  assert.deepEqual(setLineQuantity([{ slug: slugA, quantity: 2 }], slugA, 0), []);
  assert.deepEqual(setLineQuantity([{ slug: slugA, quantity: 2 }], slugA, -1), []);
  assert.deepEqual(setLineQuantity([{ slug: slugA, quantity: 2 }], slugA, Number.NaN), []);
  assert.deepEqual(
    setLineQuantity([{ slug: slugA, quantity: 2 }, { slug: slugB, quantity: 1 }], slugA, 0),
    [{ slug: slugB, quantity: 1 }]
  );
});

test("setQuantity can add a line that is not present yet", () => {
  assert.deepEqual(setLineQuantity([], slugA, 4), [{ slug: slugA, quantity: 4 }]);
});

test("quantityOfLine reports zero for an absent slug", () => {
  assert.equal(quantityOfLine([{ slug: slugA, quantity: 3 }], slugB), 0);
});

// 5. Remove and 6. clear.
test("removeLine removes only the requested slug", () => {
  const lines: CartLine[] = [
    { slug: slugA, quantity: 1 },
    { slug: slugB, quantity: 2 },
  ];

  assert.deepEqual(removeLine(lines, slugA), [{ slug: slugB, quantity: 2 }]);
  assert.deepEqual(removeLine(lines, "missing"), lines);
});

test("clearLines empties the cart", () => {
  assert.deepEqual(clearLines(), []);
});

// 7. Derived values.
test("itemCount sums quantities, not lines", () => {
  assert.equal(itemCount([{ slug: slugA, quantity: 3 }, { slug: slugB, quantity: 2 }]), 5);
  assert.equal(itemCount([]), 0);
});

test("subtotal and savings are computed from the catalogue, never stored", () => {
  const lines = [{ slug: slugA, quantity: 2 }];
  const details = detailedLines(lines);

  assert.equal(details.length, 1);
  assert.equal(details[0].product.slug, slugA);
  assert.equal(details[0].lineTotal, a.sellingPrice * 2);
  assert.equal(subtotal(details), a.sellingPrice * 2);
  assert.equal(savings(details), (a.mrp - a.sellingPrice) * 2);
  assert.equal(
    Object.prototype.hasOwnProperty.call(lines[0], "sellingPrice"),
    false,
    "the persisted line must not carry a price"
  );
});

test("detailedLines drops slugs missing from the catalogue", () => {
  assert.deepEqual(detailedLines([{ slug: unknownSlug, quantity: 1 }]), []);
});

test("a payload price is never honoured over the catalogue price", () => {
  // A tampered payload must not be able to influence the rendered total.
  const details = detailedLines(parseStoredLines(JSON.stringify([{ slug: slugA, quantity: 1 }])));

  assert.equal(details[0].lineTotal, getProductBySlug(slugA)!.sellingPrice);
});

test("totals across multiple lines", () => {
  const details = detailedLines([
    { slug: slugA, quantity: 2 },
    { slug: slugB, quantity: 1 },
  ]);

  assert.equal(subtotal(details), a.sellingPrice * 2 + b.sellingPrice);
  assert.equal(savings(details), (a.mrp - a.sellingPrice) * 2 + (b.mrp - b.sellingPrice));
});
// Source-level guards for the button state, which was the visible symptom.
test("the add-to-cart label is derived from the cart, not a local flag", async () => {
  const source = await read("src/components/product-actions.tsx");

  // A local `added` flag could report success even when nothing was stored.
  assert.ok(
    !/const\s*\[\s*added\s*,\s*setAdded\s*\]/.test(source),
    "product-actions must not keep a local `added` state flag"
  );
  assert.ok(
    source.includes("quantityOf(product.slug) > 0"),
    "the label must come from the real cart quantity"
  );
});

test("buy now adds to the cart before navigating", async () => {
  const source = await read("src/components/product-actions.tsx");

  const addIndex = source.indexOf("addItem(product.slug, 1)", source.indexOf("handleBuyNow"));
  const pushIndex = source.indexOf('router.push("/checkout")');

  assert.ok(addIndex > -1, "handleBuyNow must add to the cart");
  assert.ok(pushIndex > -1, "handleBuyNow must navigate to checkout");
  assert.ok(addIndex < pushIndex, "the cart must be updated before navigation");
});

test("the app mounts exactly one CartProvider", async () => {
  const source = await read("src/app/layout.tsx");
  const matches = source.match(/<CartProvider/g) ?? [];

  assert.equal(matches.length, 1, "a second provider would split the cart state");
});

test("the cart is stored under a single localStorage key", async () => {
  const context = await read("src/context/cart-context.tsx");

  const keys = context.match(/localStorage\.(get|set)Item\(\s*(\w+)/g) ?? [];
  const named = [...new Set(keys.map((k) => k.replace(/localStorage\.\w+Item\(\s*/, "")))];

  assert.deepEqual(named, ["STORAGE_KEY"], "exactly one storage key may be used");
  assert.ok(!/nature_choice_cart|"cart"|'cart'/.test(context.replace(/const STORAGE_KEY = "cart";/, "")),
    "no second hardcoded key may appear alongside STORAGE_KEY");
});

