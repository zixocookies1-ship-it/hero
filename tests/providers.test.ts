/**
 * Guards the "only MongoDB, Cloudinary, Razorpay and Delhivery" rule the store
 * runs on. A fifth provider — a mailer, a second payment processor, another
 * image CDN or warehouse — must not sneak in without a conscious decision.
 *
 * Run with: npx tsx --test tests/providers.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

const root = process.cwd();

/** Every dependency package.json may carry. Anything else starts an integration. */
const ALLOWED_DEPENDENCIES = new Set([
  "@prisma/client",
  "cloudinary",
  "next",
  "pdf-lib",
  "razorpay",
  "react",
  "react-dom",
]);

/** Providers that are not MongoDB/Cloudinary/Razorpay/Delhivery. */
const FORBIDDEN_PROVIDER_TERMS = [
  "stripe",
  "paypal",
  "phonepe",
  "googlepay",
  "twilio",
  "resend",
  "sendgrid",
  "mailgun",
  "ses",
  "openai",
  "supabase",
  "firebase",
  "aws-sdk",
  "uploadcare",
  "cloudflare",
  "shiprocket",
  "shipway",
];

test("package.json pulls in no provider SDK outside the four", async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  const dependencies = Object.keys(manifest.dependencies ?? {});

  for (const name of dependencies) {
    assert.ok(
      ALLOWED_DEPENDENCIES.has(name),
      `${name} is a new dependency. It must be one of MongoDB, Cloudinary, Razorpay or Delhivery.`
    );
  }

  for (const term of FORBIDDEN_PROVIDER_TERMS) {
    assert.ok(
      !dependencies.some((name) => name.toLowerCase().includes(term)),
      `${term} is not one of the allowed providers`
    );
  }
});

test(".env.example documents only the four providers", async () => {
  const example = await fs.readFile(path.join(root, ".env.example"), "utf8");

  for (const expected of ["MONGODB_URI", "RAZORPAY_KEY_ID", "CLOUDINARY_CLOUD_NAME", "DELHIVERY_API_KEY"]) {
    assert.ok(example.includes(expected), `.env.example should document ${expected}`);
  }

  for (const gone of [
    "CONTACT_WEBHOOK_URL",
    "META_CAPI_ACCESS_TOKEN",
    "TURSO_",
    "DATABASE_URL",
    "STRIPE_",
    "TWILIO_",
  ]) {
    assert.ok(!example.includes(gone), `.env.example must not reference ${gone}`);
  }
});

test("no stale third-party webhook fires from the contact endpoint", async () => {
  const route = await fs.readFile(
    path.join(root, "src/app/api/contact/route.ts"),
    "utf8"
  );
  assert.ok(!/CONTACT_WEBHOOK|customWebhook|fetch\(/.test(route), "the contact endpoint relays nothing to another service");
});