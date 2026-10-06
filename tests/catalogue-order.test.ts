/**
 * Locks the order flavours appear in, everywhere.
 *
 * The catalogue array is the display order for the home grid, products page,
 * about page, footer and the related-products block, but the copy in the FAQ and
 * the reviews listed them separately and had already drifted out of step. These
 * tests assert the order in the prose matches the catalogue, so "keep it the
 * same everywhere" is enforced rather than remembered.
 *
 * Run with: npx tsx --test tests/catalogue-order.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import { SHELF_LIFE_MONTHS, TRIO_SLUGS, products } from "../src/lib/products";

const read = (relative: string) =>
  fs.readFile(path.join(process.cwd(), relative), "utf8");

/** The agreed display order: classic first, til second, elaichi last. */
const EXPECTED_SLUGS = [
  "desi-chocolatey-jaggery",
  "desi-til-chocolatey-jaggery",
  "desi-elaichi-chocolatey-jaggery",
];

test("the catalogue is in the agreed display order", () => {
  assert.deepEqual(
    products.map((product) => product.slug),
    EXPECTED_SLUGS
  );
});

test("classic stays first and elaichi stays last", () => {
  const slugs = products.map((product) => product.slug);

  assert.equal(slugs[0], "desi-chocolatey-jaggery", "classic must lead");
  assert.equal(slugs[slugs.length - 1], "desi-elaichi-chocolatey-jaggery", "elaichi must be last");
});

test("TRIO_SLUGS follows the catalogue order", () => {
  assert.deepEqual(TRIO_SLUGS, EXPECTED_SLUGS);
});

test("every flavour appears exactly once", () => {
  assert.equal(new Set(TRIO_SLUGS).size, products.length);
});

test("the lead product used by the decisions section is the classic", async () => {
  const source = await read("src/components/four-decisions.tsx");

  // The lead product now comes from the admin-managed catalogue, which falls
  // back to the shipped products array when the database is unreachable.
  assert.ok(
    source.includes("const lead = catalogue[0]") ||
      source.includes("const lead = products[0]"),
    "the decisions section must keep taking the lead from the catalogue"
  );
  assert.equal(products[0].slug, "desi-chocolatey-jaggery");
});

/** Asserts `subject` mentions the slugs' short names in catalogue order. */
const assertMentionsInOrder = (label: string, subject: string) => {
  const mentions = products
    .map((product) => ({ name: product.shortName, at: subject.indexOf(product.shortName) }))
    .filter((mention) => mention.at > -1);

  assert.ok(mentions.length >= 2, `${label} should name at least two flavours`);

  for (let i = 1; i < mentions.length; i += 1) {
    assert.ok(
      mentions[i - 1].at < mentions[i].at,
      `${label} mentions ${mentions[i].name} before ${mentions[i - 1].name}, ` +
        `which is out of catalogue order`
    );
  }
};

test("the FAQ describes the flavours in catalogue order", async () => {
  const source = await read("src/components/faq-preview.tsx");

  assertMentionsInOrder("the FAQ", source);
});

test("the reviews are listed in catalogue order", async () => {
  const source = await read("src/components/customer-reviews.tsx");

  assertMentionsInOrder("the reviews", source);
});

test("the decisions copy describes the flavours in catalogue order", async () => {
  const source = await read("src/components/four-decisions.tsx");

  // This file names the flavours as "til" and "elaichi" in running prose rather
  // than by their short names, so check those tokens instead.
  const til = source.search(/\btil\b/i);
  const elaichi = source.search(/elaichi/i);

  assert.ok(til > -1 && elaichi > -1, "both flavours should be described");
  assert.ok(til < elaichi, "til must be described before elaichi");
});

test("shelf life is eight months", () => {
  assert.equal(SHELF_LIFE_MONTHS, 8);
});

test("every shelf-life mention reads from the shared constant", async () => {
  for (const file of [
    "src/components/trust-strip.tsx",
    "src/components/faq-preview.tsx",
    "src/app/(shop)/about/page.tsx",
  ]) {
    const source = await read(file);

    assert.ok(
      source.includes("SHELF_LIFE_MONTHS"),
      `${file} must read the shelf life from SHELF_LIFE_MONTHS`
    );
    assert.ok(
      !/18[- ]?[Mm]onth/.test(source),
      `${file} still hardcodes an 18 month shelf life`
    );
  }
});
