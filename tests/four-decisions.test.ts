/**
 * Guards the "decisions" section copy against drift: the numbers must stay
 * sequential, the weight and price must come from the catalogue rather than
 * being typed into the markup, and the flavour names must match real products.
 *
 * Run with: npx tsx --test tests/four-decisions.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import { products } from "../src/lib/products";

const lead = products[0];

const read = (relative: string) =>
  fs.readFile(path.join(process.cwd(), relative), "utf8");

test("renders every decision in order", async () => {
  const source = await read("src/components/four-decisions.tsx");

  for (const number of ["01", "02", "03", "04", "05"]) {
    assert.ok(source.includes(`number: "${number}"`), `missing decision ${number}`);
  }
});

test("the price and weight come from the catalogue, not hardcoded text", async () => {
  const source = await read("src/components/four-decisions.tsx");

  assert.ok(source.includes("lead.sellingPrice"), "price should read from the catalogue");
  assert.ok(source.includes("lead.mrp"), "MRP should read from the catalogue");
  assert.ok(source.includes("lead.weight"), "weight should read from the catalogue");

  // A literal rupee amount in the copy would silently go stale on a price change.
  assert.ok(!/₹\s?\d/.test(source), "no hardcoded rupee amount");
});

test("catalogue price is the one checkout charges", () => {
  // Guards the sentence a customer reads against what they are actually charged.
  assert.equal(lead.mrp, 299);
  assert.equal(lead.sellingPrice, 239);
  assert.equal(lead.weight, "500g");
});

test("the three flavours named in the copy are real products", () => {
  const slugs = products.map((product) => product.slug);

  assert.ok(slugs.includes("desi-chocolatey-jaggery"), "classic flavour");
  assert.ok(slugs.includes("desi-til-chocolatey-jaggery"), "roasted sesame / til");
  assert.ok(slugs.includes("desi-elaichi-chocolatey-jaggery"), "green cardamom / elaichi");
});

test("no invented certifications or health claims", async () => {
  // The section itself promises transparency, so it must not break that promise.
  const body = (await read("src/components/four-decisions.tsx")).toLowerCase();

  for (const claim of [
    "organic certified",
    "certified organic",
    "fssai certified",
    "gluten free",
    "rich in iron",
    "boosts immunity",
    "ayurvedic healing",
  ]) {
    assert.ok(!body.includes(claim), `unsupported claim present: "${claim}"`);
  }
});

test("the section is mounted on the home page", async () => {
  const home = await read("src/app/(shop)/page.tsx");

  assert.ok(home.includes("<FourDecisions />"), "section should render on the home page");
});