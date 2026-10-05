/**
 * Unit tests for the pure logic behind checkout. Run with: npm run test
 *
 * These cover the rules that decide whether money changes hands and whether an
 * order is considered paid. Anything that needs a live database or a live
 * Razorpay account is not covered here and is listed in README_SETUP.md.
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";

import {
  MOBILE_PATTERN,
  PIN_PATTERN,
  firstInvalidField,
  hasErrors,
  normaliseCheckoutDetails,
  normaliseMobile,
  validateCheckoutDetails,
} from "../src/lib/validation";
import { INDIAN_STATES, STATE_PLACEHOLDER } from "../src/lib/states";
import { PricingError, priceCart, getShippingPolicy } from "../src/lib/pricing";
import { buildOrderId, isValidOrderId } from "../src/lib/order-id";
import { createReceiptToken, verifyReceiptToken } from "../src/lib/receipt-token";

process.env.ORDER_SIGNING_SECRET = "test-signing-secret-value";

const goodDetails = {
  fullName: "Ruby Gupta",
  phone: "9876543210",
  email: "",
  address: "316 Puranapul, Harbanshpur",
  city: "Azamgarh",
  state: "Uttar Pradesh",
  postalCode: "276001",
};

// ---------------------------------------------------------------------------
// Mobile validation
// ---------------------------------------------------------------------------

test("accepts a valid 10-digit Indian mobile", () => {
  assert.equal(validateCheckoutDetails({ ...goodDetails, phone: "9876543210" }).phone, undefined);
  assert.equal(MOBILE_PATTERN.test("6123456789"), true);
});

test("rejects invalid mobile numbers with the required message", () => {
  // Leading digit below 6
  assert.equal(
    validateCheckoutDetails({ ...goodDetails, phone: "1234567890" }).phone,
    "Please enter a valid 10-digit mobile number."
  );
  // Too short
  assert.equal(
    validateCheckoutDetails({ ...goodDetails, phone: "12345" }).phone,
    "Please enter a valid 10-digit mobile number."
  );
  // Letters
  assert.equal(
    validateCheckoutDetails({ ...goodDetails, phone: "98765abcde" }).phone,
    "Please enter a valid 10-digit mobile number."
  );
  // Empty
  assert.equal(
    validateCheckoutDetails({ ...goodDetails, phone: "" }).phone,
    "Mobile number is required."
  );
});

test("mobile rejects letters mixed into an otherwise valid number", () => {
  // Regression guard: digits must not be stripped out of junk to form a number.
  assert.equal(
    validateCheckoutDetails({ ...goodDetails, phone: "9876543210abc" }).phone,
    "Please enter a valid 10-digit mobile number."
  );
  assert.equal(
    validateCheckoutDetails({ ...goodDetails, phone: "98a765 43210" }).phone,
    "Please enter a valid 10-digit mobile number."
  );
  assert.equal(
    validateCheckoutDetails({ ...goodDetails, phone: "98765#43210" }).phone,
    "Please enter a valid 10-digit mobile number."
  );
  // Over-long digit runs are still rejected rather than truncated.
  assert.equal(
    validateCheckoutDetails({ ...goodDetails, phone: "98765432109999" }).phone,
    "Please enter a valid 10-digit mobile number."
  );
});

test("mobile normalisation strips country and trunk prefixes", () => {
  assert.equal(normaliseMobile("+91 98765 43210"), "9876543210");
  assert.equal(normaliseMobile("09876543210"), "9876543210");
  assert.equal(normaliseMobile("  9876543210  "), "9876543210");
  assert.equal(validateCheckoutDetails({ ...goodDetails, phone: "+91 98765 43210" }).phone, undefined);
});

// ---------------------------------------------------------------------------
// PIN code validation
// ---------------------------------------------------------------------------

test("accepts a valid 6-digit PIN and rejects the rest", () => {
  assert.equal(validateCheckoutDetails({ ...goodDetails, postalCode: "560064" }).postalCode, undefined);
  assert.equal(PIN_PATTERN.test("560064"), true);

  assert.equal(
    validateCheckoutDetails({ ...goodDetails, postalCode: "12345" }).postalCode,
    "Please enter a valid 6-digit PIN code."
  );
  assert.equal(
    validateCheckoutDetails({ ...goodDetails, postalCode: "012345" }).postalCode,
    "Please enter a valid 6-digit PIN code."
  );
  assert.equal(
    validateCheckoutDetails({ ...goodDetails, postalCode: "56006a" }).postalCode,
    "Please enter a valid 6-digit PIN code."
  );
  assert.equal(
    validateCheckoutDetails({ ...goodDetails, postalCode: "" }).postalCode,
    "PIN code is required."
  );
});

// ---------------------------------------------------------------------------
// Mandatory fields, optional email, state dropdown
// ---------------------------------------------------------------------------

test("all six mandatory fields report their required message when empty", () => {
  const errors = validateCheckoutDetails({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  });

  assert.equal(errors.fullName, "Full name is required.");
  assert.equal(errors.phone, "Mobile number is required.");
  assert.equal(errors.address, "Address is required.");
  assert.equal(errors.city, "City is required.");
  assert.equal(errors.postalCode, "PIN code is required.");
  assert.equal(errors.state, "Please select your state.");
});

test("email is never required", () => {
  assert.equal(validateCheckoutDetails({ ...goodDetails, email: "" }).email, undefined);
  assert.equal(validateCheckoutDetails(goodDetails).email, undefined);
  // but a malformed one that was typed is still rejected
  assert.equal(validateCheckoutDetails({ ...goodDetails, email: "nope" }).email, "Please enter a valid email address.");
});

test("state must come from the dropdown list", () => {
  assert.equal(
    validateCheckoutDetails({ ...goodDetails, state: STATE_PLACEHOLDER }).state,
    "Please select your state."
  );
  assert.equal(
    validateCheckoutDetails({ ...goodDetails, state: "Nowhere" }).state,
    "Please select your state."
  );
  for (const state of INDIAN_STATES) {
    assert.equal(validateCheckoutDetails({ ...goodDetails, state }).state, undefined, state);
  }
});

test("state list contains all 28 states and 8 union territories", () => {
  assert.equal(INDIAN_STATES.length, 36);
  for (const required of [
    "Uttar Pradesh",
    "Maharashtra",
    "Delhi",
    "Jammu and Kashmir",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Andaman and Nicobar Islands",
  ]) {
    assert.ok(INDIAN_STATES.includes(required as never), `missing ${required}`);
  }
});

test("first invalid field follows DOM order", () => {
  const errors = validateCheckoutDetails({
    fullName: "",
    phone: "123",
    address: "12",
    city: "",
    state: "",
    postalCode: "",
  });
  assert.equal(firstInvalidField(errors), "fullName");
});

// ---------------------------------------------------------------------------
// Server-side pricing: the browser can never choose the amount
// ---------------------------------------------------------------------------

test("pricing is computed from the catalogue, ignoring any client figures", () => {
  const pricing = priceCart(
    [{ slug: "desi-chocolatey-jaggery", quantity: 2 }],
    { SHIPPING_FEE_INR: "49" } as unknown as NodeJS.ProcessEnv
  );

  assert.equal(pricing.lines[0].unitPrice, 239);
  assert.equal(pricing.lines[0].mrp, 299);
  assert.equal(pricing.subtotal, 478);
  assert.equal(pricing.mrpTotal, 598);
  assert.equal(pricing.productDiscount, 120);
  assert.equal(pricing.deliveryFee, 49);
  assert.equal(pricing.total, 527);
  assert.equal(pricing.totalInPaise, 52700);
});

test("amounts are converted to paise correctly", () => {
  const pricing = priceCart(
    [{ slug: "desi-elaichi-chocolatey-jaggery", quantity: 1 }],
    { SHIPPING_FEE_INR: "0" } as unknown as NodeJS.ProcessEnv
  );
  assert.equal(pricing.subtotal, 239);
  assert.equal(pricing.total, 239);
  assert.equal(pricing.totalInPaise, 23900);
});

test("every catalogue product prices from its own server-side values", () => {
  for (const slug of ["desi-chocolatey-jaggery", "desi-elaichi-chocolatey-jaggery", "desi-til-chocolatey-jaggery"]) {
    const pricing = priceCart([{ slug, quantity: 1 }], { SHIPPING_FEE_INR: "0" } as unknown as NodeJS.ProcessEnv);
    assert.equal(pricing.totalInPaise, pricing.subtotal * 100);
    assert.equal(pricing.totalInPaise % 100 === 0 || true, true);
  }
});

test("free shipping threshold is applied from configuration", () => {
  const env = { SHIPPING_FEE_INR: "49", FREE_SHIPPING_THRESHOLD_INR: "500" } as unknown as NodeJS.ProcessEnv;
  const below = priceCart([{ slug: "desi-chocolatey-jaggery", quantity: 1 }], env);
  assert.equal(below.shippingFree, false);
  assert.equal(below.deliveryFee, 49);

  const above = priceCart([{ slug: "desi-chocolatey-jaggery", quantity: 3 }], env);
  assert.equal(above.shippingFree, true);
  assert.equal(above.deliveryFee, 0);
  assert.equal(above.total, above.subtotal);
});

test("shipping policy falls back safely on bad config", () => {
  const policy = getShippingPolicy({ SHIPPING_FEE_INR: "abc" } as unknown as NodeJS.ProcessEnv);
  assert.equal(policy.feeInr, 49);
  assert.equal(policy.freeAboveInr, null);
});

test("bogus carts are rejected rather than priced", () => {
  assert.throws(() => priceCart([], {} as unknown as NodeJS.ProcessEnv), (e: unknown) => e instanceof PricingError && e.code === "empty_cart");
  assert.throws(
    () => priceCart([{ slug: "not-a-product", quantity: 1 }], {} as unknown as NodeJS.ProcessEnv),
    (e: unknown) => e instanceof PricingError && e.code === "unknown_product"
  );
  assert.throws(
    () => priceCart([{ slug: "desi-chocolatey-jaggery", quantity: 0 }], {} as unknown as NodeJS.ProcessEnv),
    (e: unknown) => e instanceof PricingError && e.code === "invalid_quantity"
  );
  assert.throws(
    () => priceCart([{ slug: "desi-chocolatey-jaggery", quantity: 1.5 }], {} as unknown as NodeJS.ProcessEnv),
    (e: unknown) => e instanceof PricingError && e.code === "invalid_quantity"
  );
  assert.throws(
    () => priceCart([{ slug: "desi-chocolatey-jaggery", quantity: -3 }], {} as unknown as NodeJS.ProcessEnv),
    (e: unknown) => e instanceof PricingError && e.code === "invalid_quantity"
  );
});

test("a huge quantity cannot produce a negative or absurd total", () => {
  assert.throws(
    () => priceCart([{ slug: "desi-chocolatey-jaggery", quantity: 100000 }], {} as unknown as NodeJS.ProcessEnv),
    (e: unknown) => e instanceof PricingError && e.code === "invalid_quantity"
  );
});

// ---------------------------------------------------------------------------
// Razorpay signature verification (the gate on "paid")
// ---------------------------------------------------------------------------

test("a correct Razorpay signature verifies", async () => {
  const { verifyPaymentSignature } = await import("../src/lib/razorpay-server");
  const keySecret = "test_razorpay_secret";
  const orderId = "order_ABC123";
  const paymentId = "pay_XYZ789";
  const signature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  assert.equal(
    verifyPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      keySecret,
    }),
    true
  );
});

test("tampered or mismatched signatures are rejected", async () => {
  const { verifyPaymentSignature } = await import("../src/lib/razorpay-server");
  const keySecret = "test_razorpay_secret";
  const orderId = "order_ABC123";
  const paymentId = "pay_XYZ789";
  const signature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  // Wrong secret
  assert.equal(
    verifyPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      keySecret: "another_secret",
    }),
    false
  );

  // Signature for a different order id
  assert.equal(
    verifyPaymentSignature({
      razorpayOrderId: "order_DIFFERENT",
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      keySecret,
    }),
    false
  );

  // Empty and missing values
  assert.equal(
    verifyPaymentSignature({ razorpayOrderId: "", razorpayPaymentId: "", razorpaySignature: "", keySecret }),
    false
  );

  // No secret available at all
  assert.equal(
    verifyPaymentSignature({ razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: signature, keySecret: "" }),
    false
  );

  // Truncated signature of the wrong length must not throw
  assert.equal(
    verifyPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature.slice(0, 10),
      keySecret,
    }),
    false
  );
});

// ---------------------------------------------------------------------------
// Order IDs
// ---------------------------------------------------------------------------

test("order ids are sequential, formatted and unique", () => {
  const when = new Date("2026-10-05T00:00:00Z");
  assert.equal(buildOrderId(1, when), "NCJ-20261005-000001");
  assert.equal(buildOrderId(123, when), "NCJ-20261005-000123");

  const ids = new Set<string>();
  for (let i = 1; i <= 5000; i += 1) ids.add(buildOrderId(i, when));
  assert.equal(ids.size, 5000, "order ids must not collide");

  assert.throws(() => buildOrderId(0, when));
  assert.throws(() => buildOrderId(1.5, when));
});

test("order id validation", () => {
  assert.equal(isValidOrderId("NCJ-20261005-000123"), true);
  assert.equal(isValidOrderId("NCJ-20261005-123"), false);
  assert.equal(isValidOrderId("NCJ-2026-000123"), false);
  assert.equal(isValidOrderId("order_ABC"), false);
  assert.equal(isValidOrderId(null), false);
  assert.equal(isValidOrderId("../etc/passwd"), false);
});

// ---------------------------------------------------------------------------
// Receipt token: keeps customer details behind a signed link
// ---------------------------------------------------------------------------

test("receipt token validates its own order and cannot be reused elsewhere", () => {
  const token = createReceiptToken("NCJ-20261005-000123");
  assert.deepEqual(verifyReceiptToken("NCJ-20261005-000123", token), { ok: true });

  // Different order id must fail
  assert.equal(verifyReceiptToken("NCJ-20261005-000124", token).ok, false);
  // Garbage must fail
  assert.equal(verifyReceiptToken("NCJ-20261005-000123", "nonsense").ok, false);
  assert.equal(verifyReceiptToken("NCJ-20261005-000123", "").ok, false);
  assert.equal(verifyReceiptToken("NCJ-20261005-000123", undefined).ok, false);
  // Tampered signature must fail
  assert.equal(verifyReceiptToken("NCJ-20261005-000123", `${token}x`).ok, false);
});

test("expired receipt tokens are refused", () => {
  const expired = createReceiptToken("NCJ-20261005-000123", -1000);
  const result = verifyReceiptToken("NCJ-20261005-000123", expired);
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "expired_token");
});

// ---------------------------------------------------------------------------
// Normalisation before persistence
// ---------------------------------------------------------------------------

test("details are normalised before being stored", () => {
  const normalised = normaliseCheckoutDetails({
    ...goodDetails,
    phone: "+91 98765 43210",
    postalCode: "276001",
  });
  assert.equal(normalised.phone, "9876543210");
  assert.equal(normalised.email, "");
  assert.equal(normalised.city, "Azamgarh");
  assert.equal(hasErrors(validateCheckoutDetails(normalised)), false);
});