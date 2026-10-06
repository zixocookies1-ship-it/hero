/**
 * Cover for the announcement strip parsing. The stored setting is a
 * pipe-separated line, e.g.
 * "PAN INDIA DELIVERY | SECURE PAYMENTS | CUSTOMER SUPPORT", and the order is
 * preserved exactly as an admin wrote it — the storefront must never reorder,
 * decorate or drop the messages on its own.
 *
 * Run with: npx tsx --test tests/announcements.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { splitAnnouncements } from "../src/lib/cms";

test("splits a pipe-separated strip, preserving order", () => {
  assert.deepEqual(
    splitAnnouncements("PAN INDIA DELIVERY | SECURE PAYMENTS | CUSTOMER SUPPORT"),
    ["PAN INDIA DELIVERY", "SECURE PAYMENTS", "CUSTOMER SUPPORT"]
  );
});

test("trims surrounding whitespace from each message", () => {
  assert.deepEqual(splitAnnouncements("  Pan India   |  Secure "), [
    "Pan India",
    "Secure",
  ]);
});

test("drops blank segments from stray separators", () => {
  assert.deepEqual(splitAnnouncements("One | | Three |"), ["One", "Three"]);
});

test("returns an empty list for a cleared or empty setting", () => {
  assert.deepEqual(splitAnnouncements(""), []);
  assert.deepEqual(splitAnnouncements("   "), []);
  assert.deepEqual(splitAnnouncements("|  |"), []);
});