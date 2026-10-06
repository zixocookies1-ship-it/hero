/**
 * Regression cover for the MongoDB "unset nullable field" trap in
 * attachRazorpayOrderId.
 *
 * Prisma omits nullable fields that were never set when it inserts a document,
 * so a freshly created order has no `razorpayOrderId` key in Mongo at all.
 * Filtering with `{ razorpayOrderId: null }` does NOT match a missing key, so
 * the attach used to silently match zero rows. The Razorpay order id was never
 * written, confirmPaidOrder could not find the order by that id, and every
 * successful payment ended in "We could not find that order" - the customer is
 * charged but the order is never marked paid.
 *
 * The offline tests below run with no database and fail if that filter ever
 * comes back. The live test is opt-in, because it writes to the real cluster:
 *   MONGODB_INTEGRATION=1 npm test
 *
 * Run with: npx tsx --test tests/orders-attach.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const ORDERS_SOURCE = path.join(process.cwd(), "src/lib/orders.ts");

const integration = process.env.MONGODB_INTEGRATION === "1";

test("attachRazorpayOrderId filters on isSet: false, not null", () => {
  const source = fs.readFileSync(ORDERS_SOURCE, "utf8");

  assert.ok(
    source.includes("razorpayOrderId: { isSet: false }"),
    "attachRazorpayOrderId must match unset rows with `{ isSet: false }`, " +
      "because `{ razorpayOrderId: null }` never matches a missing Mongo key"
  );
});

test("no Prisma filter in src uses a bare `field: null` on an unset column", () => {
  const offenders: string[] = [];

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.tsx?$/.test(entry.name)) {
        const source = fs.readFileSync(full, "utf8");
        // A `where`-style filter object whose last pair is `key: null`.
        if (/(?:where|AND|OR|NOT)\s*:\s*\{[^}]*\w+\s*:\s*null\s*[,}]/.test(source)) {
          offenders.push(path.relative(process.cwd(), full));
        }
      }
    }
  };

  walk(path.join(process.cwd(), "src"));

  assert.deepEqual(
    offenders,
    [],
    `these files filter with "field: null", which does not match a missing key ` +
      `in MongoDB; use "{ isSet: false }" instead: ${offenders.join(", ")}`
  );
});

test(
  "live: a pending order can be attached and confirmed paid",
  { skip: integration ? false : "set MONGODB_INTEGRATION=1 to run against the real database" },
  async () => {
    for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m) process.env[m[1]] = m[2];
    }

    const { prisma } = await import("../src/lib/db");
    const { createPendingOrder, attachRazorpayOrderId, confirmPaidOrder, findOrderByOrderId } =
      await import("../src/lib/orders");
    const { priceCart } = await import("../src/lib/pricing");
    const { normaliseCheckoutDetails } = await import("../src/lib/validation");
    const { createHmac } = await import("node:crypto");

    const razorpayOrderId = "order_attach_regression";
    const razorpayPaymentId = "pay_attach_regression";
    let orderId: string | undefined;

    try {
      await prisma.order.deleteMany({ where: { razorpayOrderId } });
      await prisma.order.deleteMany({ where: { customerName: "Attach Regression" } });

      const created = await createPendingOrder({
        pricing: priceCart([{ slug: "desi-chocolatey-jaggery", quantity: 1 }]),
        details: normaliseCheckoutDetails({
          fullName: "Attach Regression",
          phone: "9876543210",
          email: "",
          address: "1 Test Road",
          city: "Hyderabad",
          state: "Telangana",
          postalCode: "500001",
        }),
      });
      orderId = created.orderId;

      // A new order must have no razorpayOrderId key at all, which is exactly
      // why the old null filter could not see it.
      const raw = (await prisma.$runCommandRaw({
        find: "Order",
        filter: { orderId },
        limit: 1,
      })) as { cursor: { firstBatch: Array<Record<string, unknown>> } };
      const doc = raw.cursor.firstBatch[0];
      assert.ok(doc, "the order should exist in Mongo");
      assert.equal(
        Object.prototype.hasOwnProperty.call(doc, "razorpayOrderId"),
        false,
        "a fresh order should not carry a razorpayOrderId key"
      );

      await attachRazorpayOrderId(orderId, razorpayOrderId);

      const attached = await findOrderByOrderId(orderId);
      assert.equal(
        attached?.razorpayOrderId,
        razorpayOrderId,
        "attachRazorpayOrderId must actually write the id"
      );

      const signature = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "test")
        .update(`${orderId}|${razorpayPaymentId}|${razorpayOrderId}`)
        .digest("hex");

      const confirmed = await confirmPaidOrder({
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature: signature,
      });
      assert.equal(confirmed.paymentStatus, "paid");
      assert.equal(confirmed.alreadyPaid, false);

      const settled = await findOrderByOrderId(orderId);
      assert.equal(settled?.paymentStatus, "paid");
      assert.equal(settled?.paymentVerified, true);

      // Replaying the same payment must stay idempotent.
      const replay = await confirmPaidOrder({
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature: signature,
      });
      assert.equal(replay.alreadyPaid, true, "a replayed payment must not double-credit");
    } finally {
      await prisma.order.deleteMany({ where: { razorpayOrderId } });
      if (orderId) await prisma.order.deleteMany({ where: { orderId } });
      await prisma.counter.deleteMany({});
      await prisma.$disconnect();
    }
  }
);
