/**
 * Offline cover for the admin management changes behind the 34-point brief.
 * The admin routes sit behind a session cookie and many need live MongoDB or
 * Cloudinary, so these tests assert the structure that makes the admin panel
 * genuinely editable: the CRUD routes exist and are guarded, the editors wire
 * their buttons to them, image uploads can replace and delete assets, and the
 * checkout honours the online-payment switch.
 *
 * Run with: npx tsx --test tests/admin-management.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const root = process.cwd();

const read = (relative: string): string =>
  fs.readFileSync(path.join(root, ...relative.split("/")), "utf8");

/** First needle not found in source, or null when all are present. */
const missing = (source: string, needles: readonly string[]): string | null =>
  needles.find((needle) => !source.includes(needle)) ?? null;

test("section schema stores a nullable mobile image", () => {
  const schema = read("prisma/schema.prisma");
  const sectionBlock = schema.slice(schema.indexOf("model Section"));
  assert.ok(
    sectionBlock.includes("imageMobile String?"),
    "Section needs a nullable imageMobile column for the hero's mobile artwork"
  );
});

test("sections route accepts imageMobile and can reset a section", () => {
  const source = read("src/app/api/admin/sections/[key]/route.ts");
  assert.equal(
    missing(source, [
      '"imageMobile"',
      "export async function DELETE",
      "section.deleteMany",
      "requireAdminApi()",
      "status: 404",
    ]),
    null,
    "sections delete must be guarded, delete the document, and 404 when absent"
  );
});

test("banner editor persists the mobile image and reset flow", () => {
  const editor = read("src/components/admin-banner-editor.tsx");
  assert.equal(
    missing(editor, [
      "imageMobile",
      "Mobile image",
      "Confirm reset",
      "/api/admin/sections/",
      'method: "DELETE"',
    ]),
    null,
    "the banner editor must edit mobile artwork and confirm before resetting"
  );
});

test("products API supports full create, update and hard delete", () => {
  const create = read("src/app/api/admin/products/route.ts");
  assert.equal(
    missing(create, [
      "export async function POST",
      "requireAdminApi()",
      "images",
      "isActive",
      "isFeatured",
      "imagePaths",
    ]),
    null,
    "product creation must validate and store images plus flags"
  );

  const single = read("src/app/api/admin/products/[id]/route.ts");
  assert.equal(
    missing(single, [
      "description",
      "shortDescription",
      "export async function DELETE",
      "productVariant.deleteMany",
      "catalogProduct.deleteMany",
      "status: 404",
    ]),
    null,
    "product delete must remove variants first and 404 when the product is gone"
  );
});

test("product editor exposes Edit, two-step Delete and description input", () => {
  const editor = read("src/components/admin-product-editor.tsx");
  assert.equal(
    missing(editor, [
      '"Edit"',
      '"Delete"',
      '"Confirm delete"',
      "description",
      "Make primary",
      "Remove",
      "Reset to shipped images",
      'label="Add photo"',
      "/api/admin/products/${",
    ]),
    null,
    "the product editor must wire edit/delete buttons, a description field and per-image actions"
  );
});

test("products admin page serialises the description column", () => {
  const page = read("src/app/admin/(protected)/products/page.tsx");
  assert.ok(
    page.includes("description: product.description"),
    "the products page must pass description into the editor"
  );
});

test("uploads API can replace and delete Cloudinary assets", () => {
  const route = read("src/app/api/admin/uploads/route.ts");
  assert.equal(
    missing(route, [
      'form.get("publicId")',
      "export async function DELETE",
      'startsWith("products/")',
      'startsWith("banners/")',
      "requireAdminApi()",
    ]),
    null,
    "uploads must support in-place replacement and a folder-anchored delete"
  );

  const server = read("src/lib/cloudinary-server.ts");
  assert.equal(
    missing(server, ["export async function destroyImage", "uploader.destroy"]),
    null,
    "Cloudinary deletion must be server-side only"
  );
});

test("payments status and test routes never expose the secret", () => {
  const status = read("src/app/api/admin/payments/status/route.ts");
  assert.equal(
    missing(status, [
      "requireAdminApi()",
      "maskedKeyId",
      "razorpayDisplayName",
      "onlinePaymentEnabled",
      "optionalEnv",
    ]),
    null,
    "the status endpoint must be guarded and mask the key id"
  );
  assert.ok(
    !status.includes("RAZORPAY_KEY_SECRET"),
    "the key secret must never be read from env on the status endpoint"
  );

  const testRoute = read("src/app/api/admin/payments/test/route.ts");
  assert.equal(
    missing(testRoute, ["requireAdminApi()", "testRazorpayConnection", "razorpayConfigured()"]),
    null,
    "the test endpoint must be guarded and probe through the server"
  );
  assert.ok(
    !testRoute.includes("RAZORPAY_KEY_SECRET"),
    "the key secret must never appear in the test endpoint"
  );
});

test("settings route accepts the online-payment boolean", () => {
  const route = read("src/app/api/admin/settings/route.ts");
  assert.equal(
    missing(route, ["onlinePaymentEnabled", "asBoolean"]),
    null,
    "settings must persist the online-payment switch as a boolean"
  );
});

test("checkout honours the online-payment switch on both sides", () => {
  const order = read("src/app/api/razorpay/create-order/route.ts");
  assert.equal(
    missing(order, ["loadSettingsUncached", "onlinePaymentEnabled === false", "online_payments_disabled"]),
    null,
    "create-order must refuse to start a payment when the switch is off"
  );

  const form = read("src/components/checkout-form.tsx");
  assert.equal(
    missing(form, [
      "onlinePaymentsEnabled",
      "ONLINE PAYMENTS PAUSED",
      "online_payments_disabled",
      "WhatsApp at",
    ]),
    null,
    "the checkout form must block Razorpay and explain via WhatsApp when paused"
  );

  const page = read("src/app/(shop)/checkout/page.tsx");
  assert.ok(
    page.includes("onlinePaymentEnabled") && page.includes("loadSettings"),
    "the checkout page must read the switch from settings and pass it down"
  );
});

test("home hero falls back gracefully for desktop and mobile art", () => {
  const home = read("src/app/(shop)/page.tsx");
  assert.equal(
    missing(home, ["imageMobile", "md:hidden", "hero.image"]),
    null,
    "the hero must render imageMobile on small screens and image on larger ones"
  );
});