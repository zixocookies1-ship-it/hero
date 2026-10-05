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

const prismaUniqueViolation = "P2002";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === prismaUniqueViolation
  );
}

/**
 * Inserts an order in the pending state before any payment is attempted, so a
 * Razorpay order id always has a local row to attach to. The human order number
 * is built from the sequence Postgres assigns, which is why the row is inserted
 * with a null orderId and updated straight afterwards.
 */
export async function createPendingOrder(params: {
  pricing: Pricing;
  details: CheckoutDetails;
}) {
  const { pricing, details } = params;

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
      items: { create: items },
    },
    select: { id: true, sequence: true, createdAt: true },
  });

  const orderId = buildOrderId(created.sequence, created.createdAt);

  await prisma.order.update({
    where: { id: created.id },
    data: { orderId },
  });

  return { id: created.id, orderId, sequence: created.sequence };
}

export async function attachRazorpayOrderId(orderId: string, razorpayOrderId: string) {
  await prisma.order.updateMany({
    where: { orderId, razorpayOrderId: null },
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
 * second one. Uniqueness of razorpay_payment_id in Postgres is the last line of
 * defence behind the explicit status check.
 */
export async function confirmPaidOrder(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<ConfirmResult> {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  const existing = await prisma.order.findUnique({
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

  try {
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
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Another request settled a payment with this id first. Return that order.
      const winner = await prisma.order.findFirst({
        where: { paymentId: razorpayPaymentId },
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
    throw error;
  }
}

export async function findOrderByOrderId(orderId: string) {
  return prisma.order.findUnique({
    where: { orderId },
    include: { items: { orderBy: { id: "asc" } } },
  });
}

export async function findOrderByRazorpayOrderId(razorpayOrderId: string) {
  return prisma.order.findUnique({ where: { razorpayOrderId } });
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