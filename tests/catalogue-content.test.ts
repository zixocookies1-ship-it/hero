/**
 * Guards the per-variant catalogue data the product page prints.
 *
 * Two things drifted and were corrected: the SEO descriptions still quoted
 * MRP ₹399 / ₹249 long after the catalogue moved to ₹299 / ₹239, and the
 * ingredients block had to keep resolving per flavour rather than collapsing to
 * one shared sentence.
 *
 * The live-database checks are opt-in so the default run stays offline:
 *   MONGODB_INTEGRATION=1 npm test
 *
 * Run with: npx tsx --test tests/catalogue-content.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { products } from "../src/lib/products";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const integration = process.env.MONGODB_INTEGRATION === "1";

/** The prices the catalogue actually charges. */
const SELLING = 239;
const MRP = 299;

test("no shipped price text disagrees with the catalogue", () => {
  for (const product of products) {
    assert.equal(product.mrp, MRP, `${product.slug} MRP`);
    assert.equal(product.sellingPrice, SELLING, `${product.slug} selling price`);
  }
});

test("the PDP prints the per-product ingredients, not one shared line", () => {
  const page = read("src/app/(shop)/products/[slug]/page.tsx");

  // It must read the field off the product it is rendering.
  assert.ok(
    /\{product\.ingredients\}/.test(page),
    "the ingredients block must render the current product's ingredients"
  );
});

test("each flavour ships its own ingredients", () => {
  const classic = products.find((p) => p.slug === "desi-chocolatey-jaggery");
  const til = products.find((p) => p.slug === "desi-til-chocolatey-jaggery");
  const elaichi = products.find((p) => p.slug === "desi-elaichi-chocolatey-jaggery");
  assert.ok(classic && til && elaichi);

  // Plain / classic is the base recipe.
  assert.ok(classic.ingredients.length > 0, "classic must list ingredients");
  assert.ok(!classic.ingredients.includes("sesame"), "classic must not claim sesame");
  assert.ok(!classic.ingredients.includes("cardamom"), "classic must not claim cardamom");

  // Til adds roasted sesame.
  assert.ok(til.ingredients.includes("sesame"), "til must list sesame");
  assert.ok(!til.ingredients.includes("cardamom"), "til must not claim cardamom");

  // Elaichi adds cracked green cardamom and sesame.
  assert.ok(elaichi.ingredients.includes("cardamom"), "elaichi must list cardamom");
  assert.ok(elaichi.ingredients.includes("sesame"), "elaichi must list sesame");

  // All three must be distinct strings, so no two flavours render identically.
  const all = new Set(products.map((p) => p.ingredients));
  assert.equal(all.size, products.length, "each flavour needs its own ingredients text");
});

test(
  "live: no SEO description quotes a stale price",
  { skip: integration ? false : "set MONGODB_INTEGRATION=1 to run against the real database" },
  async () => {
    for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m) process.env[m[1]] = m[2];
    }

    const { prisma } = await import("../src/lib/db");
    try {
      const rows = await prisma.catalogProduct.findMany({
        select: { slug: true, seoDescription: true },
      });
      assert.ok(rows.length > 0, "expected products in the catalogue");

      for (const row of rows) {
        const text = row.seoDescription ?? "";
        assert.ok(
          !/₹\s*399/.test(text),
          `${row.slug} SEO description still quotes the old MRP ₹399`
        );
        assert.ok(
          !/₹\s*249/.test(text),
          `${row.slug} SEO description still quotes the old price ₹249`
        );
        if (/₹/.test(text)) {
          assert.ok(text.includes(`₹${MRP}`), `${row.slug} should quote the real MRP`);
        }
      }
    } finally {
      await prisma.$disconnect();
    }
  }
);