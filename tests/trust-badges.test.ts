/**
 * Guards the trust strip above the footer. Two of these promises were removed
 * at the client's request (the lab-report badge) and must not creep back, while
 * the remaining three must stay present and evenly distributed.
 * Run with: npx tsx --test tests/trust-badges.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

const read = (relative: string) => fs.readFile(path.join(process.cwd(), relative), "utf8");

test("lists the three trust promises", async () => {
  const source = await read("src/components/trust-badges.tsx");

  for (const title of [
    "FSSAI Licensed",
    "Secure Online Payments",
    "PAN-India Delivery",
  ]) {
    assert.ok(source.includes(title), `missing trust badge "${title}"`);
  }
});

test("the removed lab badge stays gone", async () => {
  const source = await read("src/components/trust-badges.tsx");

  assert.ok(!source.includes("Independent Lab Reports"), "lab-report badge must stay removed");
  assert.ok(!source.includes("Available reports"), "lab-report description must stay removed");
  assert.ok(!source.includes("Lab Tested"), "the lab badge must stay removed");
  assert.ok(!source.includes('"lab"'), "the lab badge key must stay gone");
});

test("the three cards share the row evenly", async () => {
  const source = await read("src/components/trust-badges.tsx");

  // Three cards need three equal columns on tablet and up, so no empty cell
  // is left where the fourth badge used to be.
  assert.ok(source.includes("sm:grid-cols-3"), "three badges should use a 3-column grid");
  assert.ok(!source.includes("grid-cols-4"), "a 4-column grid would leave an empty cell");
});

test("lists the accepted payment methods", async () => {
  const source = await read("src/components/trust-badges.tsx");

  for (const method of ["UPI", "VISA", "Mastercard", "RuPay"]) {
    assert.ok(source.includes(method), `missing payment method "${method}"`);
  }

  assert.ok(source.includes("Razorpay"), "checkout provider should be named");
});

test("the strip is mounted on the home page", async () => {
  const home = await read("src/app/(shop)/page.tsx");

  assert.ok(home.includes("<TrustBadges />"), "trust badges should render on the home page");
});
