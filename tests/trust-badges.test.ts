/**
 * The trust/assurance strip was removed at the client's request. This test
 * keeps it removed: it asserts the component no longer exists, that nothing on
 * the home page mounts it, and that none of its claims resurface elsewhere.
 * Run with: npx tsx --test tests/trust-badges.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

const read = (relative: string) => fs.readFile(path.join(process.cwd(), relative), "utf8");

test("the trust badge component is gone", async () => {
  await assert.rejects(
    read("src/components/trust-badges.tsx"),
    /ENOENT/,
    "trust-badges.tsx should have been removed"
  );
});

test("the home page no longer mounts the trust strip", async () => {
  const home = await read("src/app/(shop)/page.tsx");

  assert.ok(!home.includes("TrustBadges"), "home page must not import TrustBadges");
  assert.ok(!home.includes("trust-badges"), "home page must not reference trust-badges");
});

test("no trust-strip claims are rendered anywhere else", async () => {
  const home = await read("src/app/(shop)/page.tsx");

  for (const claim of [
    "FSSAI Licensed",
    "Independent Lab Reports",
    "Lab Tested",
    "Secure Online Payments",
    "PAN-India Delivery",
    "Razorpay",
    "Mastercard",
  ]) {
    assert.ok(!home.includes(claim), `home page must not claim "${claim}"`);
  }
});
