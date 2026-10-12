/**
 * Guards the trust badges shown above the footer: the four promises must stay
 * present, the accepted payment methods must stay listed, and the strip must
 * stay mounted on the home page. Run with:
 * npx tsx --test tests/trust-badges.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

const read = (relative: string) => fs.readFile(path.join(process.cwd(), relative), "utf8");

test("lists the four trust promises", async () => {
  const source = await read("src/components/trust-badges.tsx");

  for (const title of [
    "FSSAI Licensed",
    "Independent Lab Reports",
    "Secure Online Payments",
    "PAN-India Delivery",
  ]) {
    assert.ok(source.includes(title), `missing trust badge "${title}"`);
  }
});

test("lists the accepted payment methods", async () => {
  const source = await read("src/components/trust-badges.tsx");

  for (const method of ["UPI", "VISA", "Mastercard", "RuPay"]) {
    assert.ok(source.includes(method), `missing payment method "${method}"`);
  }

  assert.ok(source.includes("Razorpay"), "checkout provider should be named");
});

test("no hardcoded rupee amounts in the copy", async () => {
  const source = await read("src/components/trust-badges.tsx");

  assert.ok(!/₹\s?\d/.test(source), "no hardcoded rupee amount");
});

test("the strip is mounted on the home page", async () => {
  const home = await read("src/app/(shop)/page.tsx");

  assert.ok(home.includes("<TrustBadges />"), "trust badges should render on the home page");
});
