/**
 * Asserts the checkout form's delivery fields appear in the rendered markup. The
 * real page only reaches a browser after localStorage hydration, so this catches
 * a field being renamed, dropped, or losing its required wiring without needing a
 * browser or Playwright.
 *
 * Run with: npx tsx --test tests/checkout-render.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { INDIAN_STATES } from "../src/lib/states";
import { renderCheckout } from "./stubs/render-checkout";

/**
 * Returns the opening tag for a field. React 19 emits camelCase DOM attribute
 * names in static markup (autoComplete, inputMode, maxLength), so attribute
 * lookups below are case-insensitive rather than assuming lowercase HTML.
 */
const tag = (html: string, id: string): string =>
  new RegExp(`<[^>]*id="${id}"[^>]*>`).exec(html)?.[0] ?? "";

const hasAttr = (html: string, id: string, attribute: string, value: string): boolean => {
  const opening = tag(html, id);
  return new RegExp(`${attribute}=["']?${value}["']?`, "i").test(opening);
};

test("renders all six mandatory delivery fields plus optional email", async () => {
  const html = await renderCheckout();

  for (const id of [
    "fullName",
    "phone",
    "address",
    "city",
    "state",
    "postalCode",
    "email",
  ]) {
    assert.ok(html.includes(`id="${id}"`), `missing field: ${id}`);
  }

  assert.ok(html.includes("PROCEED TO PAYMENT"), "missing pay button label");
  assert.ok(!html.includes("PLACE ORDER"), "obsolete PLACE ORDER label still present");
  assert.ok(
    !/payment is not enabled/i.test(html),
    "payment-disabled notice should not render"
  );
});

test("mandatory fields are marked required and optional email is not", async () => {
  const html = await renderCheckout();

  for (const id of ["fullName", "phone", "address", "city", "state", "postalCode"]) {
    assert.ok(tag(html, id).includes("required"), `${id} should carry the required attribute`);
  }

  assert.ok(!tag(html, "email").includes("required"), "email must stay optional");
  assert.ok(/Optional/i.test(html), "email should be labelled optional");
});

test("state is a dropdown listing every state and union territory", async () => {
  const html = await renderCheckout();

  const select = /<select[^>]*id="state"[\s\S]*?<\/select>/.exec(html);
  assert.ok(select, "state must be a <select>, not a free text field");

  const options = select[0].match(/<option/g) ?? [];
  // 36 states and union territories, plus the placeholder.
  assert.equal(options.length, INDIAN_STATES.length + 1);
  assert.ok(select[0].includes("Select State"), "placeholder option missing");
});

test("the form never posts a price the browser could tamper with", async () => {
  const html = await renderCheckout();

  for (const name of ["unitPrice", "total", "subtotal", "amount", "deliveryFee", "mrp"]) {
    assert.ok(!html.includes(`name="${name}"`), `form must not post ${name}`);
  }

  // The server-supplied shipping fee is still displayed.
  assert.ok(html.includes("49"), "server delivery fee should be shown in the summary");
});

test("mobile and PIN inputs use numeric input modes", async () => {
  const html = await renderCheckout();

  // A numeric keypad on both; mobile stays type=tel so the dialer still works.
  assert.ok(hasAttr(html, "phone", "inputmode", "numeric"), "phone keypad");
  assert.ok(hasAttr(html, "phone", "type", "tel"), "phone should be type=tel");
  assert.ok(hasAttr(html, "postalCode", "inputmode", "numeric"), "PIN keypad");
  assert.ok(hasAttr(html, "postalCode", "maxlength", "6"), "PIN should cap at 6");
  assert.ok(hasAttr(html, "phone", "maxlength", "15"), "phone allows a +91 prefix");
});

test("labels and autocomplete hints exist for every field", async () => {
  const html = await renderCheckout();

  for (const id of ["fullName", "phone", "address", "city", "state", "postalCode", "email"]) {
    assert.ok(html.includes(`for="${id}"`), `missing label for ${id}`);
  }

  const expectedAutocomplete: Record<string, string> = {
    fullName: "name",
    phone: "tel-national",
    address: "street-address",
    city: "address-level2",
    state: "address-level1",
    postalCode: "postal-code",
    email: "email",
  };

  for (const [id, value] of Object.entries(expectedAutocomplete)) {
    assert.ok(
      hasAttr(html, id, "autocomplete", value),
      `${id} should suggest autocomplete=${value}`
    );
  }
});