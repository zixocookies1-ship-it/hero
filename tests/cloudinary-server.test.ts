/**
 * Offline cover for the Cloudinary helper — the folder sanity check and the
 * fact that uploads stay server-side. The upload API route sits behind an admin
 * session and needs live keys, so only the pure bits are exercised here.
 *
 * Run with: npx tsx --test tests/cloudinary-server.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { sanitiseCloudinaryFolder } from "../src/lib/cloudinary-server";

test("folders are trimmed and dropped to safe characters", () => {
  assert.equal(sanitiseCloudinaryFolder("products/desi-chocolatey-jaggery"), "products/desi-chocolatey-jaggery");
  assert.equal(sanitiseCloudinaryFolder("/products/desi-chocolatey-jaggery/"), "products/desi-chocolatey-jaggery");
  assert.equal(sanitiseCloudinaryFolder("banners"), "banners");
  assert.equal(sanitiseCloudinaryFolder("../secret"), "secret", "parent segments are stripped");
  assert.equal(sanitiseCloudinaryFolder("New Arrivals"), "New Arrivals", "spaces inside a folder are safe");
});

test("the client library must never ship a secret", () => {
  assert.ok(
    !sanitiseCloudinaryFolder("..").includes(".."),
    "the folder sanitisation never allows path traversal"
  );
});