import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildOrderId } from "@/lib/order-id";
import type { Pricing } from "@/lib/pricing";
import type { CheckoutDetails } from "@/lib/validation";

export class OrderError extends Error {
  constructor(
    message: string,
    readonly code:
      | "not_found"
      | "already_paid"
      | "mismatch"
      | "verification_failed"
      | "unknown"
  ) {
    super(message);
    this.name = "OrderError";
  }
}

/**
 * Allocates the daily order sequence from the Counter collection.
 *
 * MongoDB has no autoincrement, so the number is handed out by an atomic
 * findAndModify with upsert. Two concurrent checkouts therefore receive
 * different numbers; there is no read-then-write race, which is what the old
 * database sequence was doing for us.
 */
async function nextOrderSequence(when: Date): Promise<number> {
  const year = when.getFullYear();
  const month = String(when.getMonth() + 1).padStart(2, "0");
  const day = String(when.getDate()).padStart(2, "0");

  const result = await prisma.$runCommandRaw({
    findAndModify: "Counter",
    query: { _id: `order-${year}${month}${day}` },
    update: { $inc: { value: 1 } },
    new: true,
    upsert: true,
  });

  // $runCommandRaw is intentionally untyped, and MongoDB returns the document
  // either as `value` or nested under `lastErrorObject.value` depending on the
  // server version, so both shapes are unwrapped defensively.
  const raw = result as { value?: unknown; lastErrorObject?: { value?: unknown } } | null;
  const document = (raw?.value ?? raw?.lastErrorObject?.value) as
    | { value?: unknown }
    | null
    | undefined;
  const sequence = Number(document?.value);

  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new OrderError("Could not allocate an order number.", "unknown");
  }

  return sequence;
}

/**
 * Inserts an order in the pending state before any payment is attempted, so a
 * Razorpay order id always has a local row to attach to. The human order number
 * is built from an atomically allocated sequence and written in the same insert,
 * so the row is never briefly visible without its order number.
 */
export async function createPendingOrder(params: {
  pricing: Pricing;
  details: CheckoutDetails;
  /** Set when a coupon was accepted, so the order keeps the link and the code. */
  coupon?: { id: string; code: string } | null;
}) {
  const { pricing, details } = params;
  const coupon = params.coupon ?? null;
  const createdAt = new Date();
  const sequence = await nextOrderSequence(createdAt);
  const orderId = buildOrderId(sequence, createdAt);

  const items: Prisma.OrderItemCreateWithoutOrderInput[] = pricing.lines.map((line) => ({
    productSlug: line.slug,
    name: line.name,
    image: line.image,
    quantity: line.quantity,
    mrp: line.mrp,
    unitPrice: line.unitPrice,
    lineTotal: line.lineTotal,
  }));

  const created = await prisma.order.create({
    data: {
      orderId,
      sequence,
      customerName: details.fullName,
      customerPhone: details.phone,
      customerEmail: details.email || null,
      address: details.address,
      city: details.city,
      state: details.state,
      postalCode: details.postalCode,
      subtotal: pricing.subtotal,
      discount: pricing.productDiscount + pricing.couponDiscount,
      deliveryFee: pricing.deliveryFee,
      total: pricing.total,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      orderStatus: "pending",
      couponCode: coupon ? coupon.code : null,
      couponId: coupon ? coupon.id : null,
      items: { create: items },
    },
    select: { id: true, sequence: true, orderId: true, createdAt: true },
  });

  return { id: created.id, orderId, sequence: created.sequence };
}

export async function attachRazorpayOrderId(orderId: string, razorpayOrderId: string) {
  // `isSet: false` rather than `razorpayOrderId: null`: Prisma omits unset
  // nullable fields when inserting, so a fresh order has no such key in Mongo
  // and the connector's `null` filter does not match a missing field. That made
  // this update match nothing, so every payment confirmation failed with
  // "We could not find that order". Verified against the live cluster.
  await prisma.order.updateMany({
    where: { orderId, razorpayOrderId: { isSet: false } },
    data: { razorpayOrderId },
  });
}

export async function markPaymentFailed(
  razorpayOrderId: string,
  code: string | null
): Promise<void> {
  await prisma.order.updateMany({
    where: { razorpayOrderId, paymentStatus: "pending" },
    data: {
      paymentStatus: "failed",
      orderStatus: "pending",
      paymentFailureCode: code,
    },
  });
}

/**
 * Fails a pending order by our own order number. Used when the local row was
 * created but Razorpay never produced an order, so nothing can ever settle it.
 */
export async function markPaymentFailedByOrderId(
  orderId: string,
  code: string | null
): Promise<void> {
  await prisma.order.updateMany({
    where: { orderId, paymentStatus: "pending" },
    data: {
      paymentStatus: "failed",
      orderStatus: "pending",
      paymentFailureCode: code,
    },
  });
}

export type ConfirmResult = {
  orderId: string;
  paymentStatus: string;
  orderStatus: string;
  alreadyPaid: boolean;
};

/**
 * Marks an order paid, but only after the caller has verified the Razorpay
 * signature. This function is idempotent: replaying the same payment, or opening
 * the success page again, returns the original order instead of creating a
 * second one.
 *
 * One payment id may settle exactly one order. That used to be a unique index on
 * Order.paymentId, but MongoDB stores an unset field as null and a plain unique
 * index tolerates only one null, which would have capped the shop at a single
 * pending order. The check below is therefore explicit rather than delegated to
 * the database.
 */
export async function confirmPaidOrder(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<ConfirmResult> {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  const existing = await prisma.order.findFirst({
    where: { razorpayOrderId },
    select: {
      id: true,
      orderId: true,
      paymentStatus: true,
      orderStatus: true,
      paymentId: true,
    },
  });

  if (!existing || !existing.orderId) {
    throw new OrderError("We could not find that order.", "not_found");
  }

  // Replay of a payment we already settled.
  if (existing.paymentStatus === "paid") {
    return {
      orderId: existing.orderId,
      paymentStatus: existing.paymentStatus,
      orderStatus: existing.orderStatus,
      alreadyPaid: true,
    };
  }

  // A different payment id claiming the same Razorpay order is a mismatch.
  if (existing.paymentId && existing.paymentId !== razorpayPaymentId) {
    throw new OrderError(
      "This order was already paid with a different payment.",
      "mismatch"
    );
  }

  // This payment id already settled a different order. Return the winner so the
  // customer still lands on a valid receipt instead of seeing an error.
  if (!existing.paymentId) {
    const winner = await prisma.order.findFirst({
      where: { paymentId: razorpayPaymentId, NOT: { id: existing.id } },
      select: { orderId: true, paymentStatus: true, orderStatus: true },
    });

    if (winner?.orderId) {
      return {
        orderId: winner.orderId,
        paymentStatus: winner.paymentStatus,
        orderStatus: winner.orderStatus,
        alreadyPaid: true,
      };
    }
  }

  const updated = await prisma.order.update({
    where: { id: existing.id },
    data: {
      paymentStatus: "paid",
      paymentVerified: true,
      paymentId: razorpayPaymentId,
      razorpaySignature,
      orderStatus: "confirmed",
      deliveryStatus: "processing",
      status: "closed",
    },
    select: { orderId: true, paymentStatus: true, orderStatus: true },
  });

  if (!updated.orderId) throw new OrderError("Order number missing.", "unknown");

  return {
    orderId: updated.orderId,
    paymentStatus: updated.paymentStatus,
    orderStatus: updated.orderStatus,
    alreadyPaid: false,
  };
}

export async function findOrderByOrderId(orderId: string) {
  return prisma.order.findUnique({
    where: { orderId },
    include: { items: { orderBy: { id: "asc" } } },
  });
}

export async function findOrderByRazorpayOrderId(razorpayOrderId: string) {
  // Not findUnique: razorpayOrderId is deliberately not a unique index, because
  // every pending order starts with it unset.
  return prisma.order.findFirst({ where: { razorpayOrderId } });
}

export type OrderCounts = { paid: number; pending: number; failed: number; total: number };

export async function getOrderCounts(): Promise<OrderCounts> {
  const [paid, pending, failed, total] = await Promise.all([
    prisma.order.count({ where: { paymentStatus: "paid" } }),
    prisma.order.count({ where: { paymentStatus: "pending" } }),
    prisma.order.count({ where: { paymentStatus: "failed" } }),
    prisma.order.count(),
  ]);
  return { paid, pending, failed, total };
}

/**
 * Looks a coupon up by code, ignoring case and surrounding whitespace.
 *
 * Returns null for no match, which evaluateCoupon() turns into "not found". All
 * the other rules - active, expiry, usage limit, minimum order - live in
 * coupons.ts so they can be tested without a database.
 */
export async function findCouponByCode(rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;

  return prisma.coupon.findFirst({ where: { code } });
}

/**
 * Counts one redemption against a coupon.
 *
 * Deliberately only bumped once an order has actually been created, and it is
 * written as an atomic increment so two simultaneous checkouts cannot both read
 * the same usedCount and let the last redemption through.
 */
export async function recordCouponUsage(couponId: string): Promise<void> {
  await prisma.coupon.update({
    where: { id: couponId },
    data: { usedCount: { increment: 1 } },
  });
}