/**
 * Regression cover for payment reconciliation.
 *
 * Two real defects are locked down here:
 *
 * 1. The status endpoint used to answer `paid` (with a receipt token) purely
 *    because Razorpay's *order* said `paid`, without ever writing the local row.
 *    The shopper then saw a receipt for an order the database still called
 *    pending - a false confirmation. It must reconcile through the shared helper
 *    and only report paid once the row is settled.
 *
 * 2. The webhook used to require `payload.payment.entity.signature`. Razorpay
 *    webhook payloads have no such field - the checkout HMAC only exists on the
 *    browser callback - so the handler acknowledged every captured payment while
 *    recording nothing. It must settle via a server-side read instead.
 *
 * Run with: npx tsx --test tests/payment-reconciliation.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

const STATUS_ROUTE = "src/app/api/razorpay/status/[orderId]/route.ts";
const WEBHOOK_ROUTE = "src/app/api/razorpay/webhook/route.ts";
const RECONCILER = "src/lib/payment-reconciliation.ts";

test("the status endpoint reconciles before reporting paid", () => {
  const source = read(STATUS_ROUTE);

  assert.ok(
    source.includes("reconcileOrderPayment"),
    "the status endpoint must reconcile with Razorpay before answering"
  );

  // The false-success shape: returning "paid" straight from Razorpay's order
  // status, with no write to the local row.
  assert.ok(
    !/rzpStatus\s*===\s*["']paid["']/.test(source),
    "the status endpoint must not branch on Razorpay's order status to answer paid"
  );
  assert.ok(
    !/paymentStatus:\s*["']paid["']/.test(source),
    "paymentStatus must come from the settled row, never be hardcoded to paid"
  );
});

test("a receipt token is only issued once the order is settled", () => {
  const source = read(STATUS_ROUTE);

  const tokenIssues = source.match(/receiptToken:\s*createReceiptToken\(/g) ?? [];
  assert.equal(
    tokenIssues.length,
    1,
    "the token must be minted in one place only, inside the helper that already paid"
  );
});

test("the webhook does not require a browser signature to settle", () => {
  const source = read(WEBHOOK_ROUTE);

  assert.ok(
    !source.includes("razorpaySignature"),
    "the webhook must not read a checkout signature; Razorpay webhook payloads do not carry one"
  );
  assert.ok(
    source.includes("reconcileOrderPayment"),
    "the webhook must settle through the shared reconciliation helper"
  );
  assert.ok(
    !source.includes("confirmPaidOrder("),
    "the webhook must not settle by itself; one shared, idempotent path instead"
  );
});

test("the webhook verifies its signature over the raw body", () => {
  const source = read(WEBHOOK_ROUTE);

  assert.ok(source.includes("request.text()"), "the raw body is needed for the HMAC");
  assert.ok(
    source.includes('createHmac("sha256", webhookSecret)'),
    "the signature must be an HMAC over the raw body using the webhook secret"
  );
  assert.ok(source.includes("timingSafeEqual"), "signature comparison must be constant time");
  assert.ok(
    source.includes("received.length !== computed.length"),
    "lengths must be compared first: timingSafeEqual throws on a mismatch"
  );
});

test("only a captured payment marks an order paid", () => {
  const source = read(RECONCILER);

  assert.ok(
    source.includes('status === "captured"'),
    "settlement must be gated on Razorpay reporting captured"
  );

  // `authorized` is capturable but NOT captured. Settling it would claim money
  // that may still be auto-refunded.
  const authorizedBranch = source.slice(
    source.indexOf('status === "authorized"'),
    source.indexOf('status === "failed"')
  );
  assert.ok(
    !authorizedBranch.includes("confirmPaidOrder"),
    "an authorized payment must not mark the order paid"
  );
});

test("reconciliation is idempotent and cannot downgrade a captured payment", () => {
  const source = read(RECONCILER);

  // A row already settled short-circuits before Razorpay is even consulted.
  assert.ok(
    /paymentStatus === "paid"/.test(source),
    "an already-paid order must return immediately"
  );

  const failedBranch = source.slice(source.indexOf('status === "failed"'));
  assert.ok(
    failedBranch.includes("markPaymentFailed"),
    "a failed payment must be recorded through the pending-only helper"
  );
});

test("markPaymentFailed only ever touches pending rows", () => {
  // This is what stops a late payment.failed from demoting a captured payment.
  const orders = read("src/lib/orders.ts");
  assert.ok(
    /where:\s*\{\s*razorpayOrderId,\s*paymentStatus:\s*"pending"\s*\}/.test(orders),
    "markPaymentFailed must filter on paymentStatus: pending"
  );
});

test("the website-mismatch restriction is recognised and surfaced", () => {
  const source = read(RECONCILER);

  assert.ok(
    source.includes("isWebsiteRestrictionFailure"),
    "the restriction must be detected from Razorpay's error description"
  );
  assert.ok(
    source.includes("error_description"),
    "the merchant-facing description must be captured for diagnostics"
  );

  // Secrets must never reach the log line.
  assert.ok(
    !/key_secret|RAZORPAY_KEY_SECRET/.test(source),
    "the reconciler must not log or reference the key secret"
  );
});

test("create-order issues a receipt token so the status poll is authorised", () => {
  const source = read("src/app/api/razorpay/create-order/route.ts");

  assert.ok(
    source.includes("createReceiptToken(pending.orderId)"),
    "create-order must return a token scoped to the order it created"
  );
  assert.ok(
    !source.includes("RAZORPAY_KEY_SECRET"),
    "the secret must never be referenced in the route"
  );
});

test("the checkout poll keeps running after the Razorpay sheet closes", () => {
  const source = read("src/components/checkout-form.tsx");

  const modalBlock = source.slice(
    source.indexOf("modal: {"),
    source.indexOf("startPolling(order)")
  );

  assert.ok(
    !modalBlock.includes("stopPolling"),
    "closing the sheet must not stop the poll; paying then closing the success " +
      "screen is exactly the case the poll exists to catch"
  );

  // Only the handler itself stops the poll.
  assert.ok(
    /handler:\s*\(response\)\s*=>\s*\{\s*stopPolling/.test(source),
    "the browser callback path must stop the poll once it takes over"
  );

  assert.ok(
    source.includes("MAX_POLL_ATTEMPTS"),
    "polling must be bounded so a genuinely unpaid order does not poll forever"
  );
});