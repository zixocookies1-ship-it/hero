import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import { asOptionalText, asRequiredText, jsonBody } from "@/lib/admin-api";
import {
  createDelhiveryShipment,
  DelhiveryError,
  delhiveryConfigured,
  delhiveryTrack,
  paymentModeForOrder,
  roundKg,
  type DelhiveryShipmentInput,
} from "@/lib/delhivery-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

const ORDER_STATUS_SET: ReadonlySet<string> = new Set(ORDER_STATUSES);

/**
 * Fulfilment side of an order: the manual status/tracking/notes editor, plus
 * the two Delhivery actions. Booking a shipment creates a real Delhivery
 * packet for a verified paid order and stores the AWB as the tracking number;
 * tracking answers with the latest scans. The payment side is never touched
 * here — payment state is decided by the Razorpay flow, not by an admin edit.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const email = await requireAdminApi();
  if (!email) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const { orderId } = await params;

  const parsed = await jsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const actionField = asOptionalText(body.action, "Action");
  if (!actionField.ok) {
    return NextResponse.json({ error: actionField.message }, { status: 400 });
  }
  const action = actionField.value;
  if (action !== null && action !== "bookDelhivery" && action !== "trackDelhivery") {
    return NextResponse.json(
      { error: 'Action must be "bookDelhivery" or "trackDelhivery".' },
      { status: 400 }
    );
  }

  if (action === "bookDelhivery") return bookDelhivery(orderId);
  if (action === "trackDelhivery") return trackDelhivery(orderId);

  const data: Record<string, unknown> = {};

  if (body.orderStatus !== undefined) {
    const orderStatus = asRequiredText(body.orderStatus, "Order status");
    if (!orderStatus.ok || !ORDER_STATUS_SET.has(orderStatus.value)) {
      return NextResponse.json(
        { error: `Order status must be one of: ${ORDER_STATUSES.join(", ")}.` },
        { status: 400 }
      );
    }
    data.orderStatus = orderStatus.value;
  }

  if (body.trackingNumber !== undefined) {
    const tracking = asOptionalText(body.trackingNumber, "Tracking number");
    if (!tracking.ok) return NextResponse.json({ error: tracking.message }, { status: 400 });
    data.trackingNumber = tracking.value ?? "";
  }

  if (body.deliveryNotes !== undefined) {
    const notes = asOptionalText(body.deliveryNotes, "Delivery notes");
    if (!notes.ok) return NextResponse.json({ error: notes.message }, { status: 400 });
    data.deliveryNotes = notes.value ?? "";
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const updated = await prisma.order.updateMany({
      where: { orderId },
      data,
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ updated: updated.count, data });
  } catch (error) {
    console.error("[mongo] admin update order failed", error);
    return NextResponse.json({ error: "The order could not be updated." }, { status: 500 });
  }
}

async function orderForBooking(orderId: string) {
  const order = await prisma.order.findFirst({
    where: { orderId },
    include: { items: true },
  });
  return order;
}

/** Total order weight from the catalogue's active variant grams, 500g per item
 *  when the variant is unknown. */
async function orderWeightKg(order: Awaited<ReturnType<typeof orderForBooking>>): Promise<number> {
  if (!order) return 0;

  const slugs = order.items.map((item) => item.productSlug).filter(Boolean);
  const bySlug = new Map<string, number>();
  if (slugs.length > 0) {
    const variants = await prisma.productVariant.findMany({
      select: { weightGrams: true, product: { select: { slug: true } } },
      where: { product: { slug: { in: slugs } }, isActive: true },
    });
    for (const variant of variants) {
      if (!bySlug.has(variant.product.slug)) {
        bySlug.set(variant.product.slug, variant.weightGrams);
      }
    }
  }

  return order.items.reduce((sum, item) => {
    const grams = bySlug.get(item.productSlug) ?? 500;
    return sum + (grams * item.quantity) / 1000;
  }, 0);
}

async function bookDelhivery(orderId: string): Promise<Response> {
  if (!delhiveryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Delhivery is not configured. Add DELHIVERY_API_KEY and DELHIVERY_BASE_URL.",
      },
      { status: 503 }
    );
  }

  let order;
  try {
    order = await orderForBooking(orderId);
  } catch (error) {
    console.error("[mongo] booking lookup failed", error);
    return NextResponse.json({ error: "The order could not be loaded." }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (!order.paymentVerified) {
    return NextResponse.json(
      { error: "Only a verified paid order can be handed to Delhivery." },
      { status: 400 }
    );
  }
  if (order.items.length === 0) {
    return NextResponse.json({ error: "This order has no items to ship." }, { status: 400 });
  }

  let weightKg: number;
  try {
    weightKg = roundKg(await orderWeightKg(order));
  } catch (error) {
    console.error("[mongo] shipment weight lookup failed", error);
    return NextResponse.json({ error: "The shipment weight could not be calculated." }, { status: 500 });
  }

  const input: DelhiveryShipmentInput = {
    orderId: order.orderId,
    customerName: order.customerName,
    address: order.address,
    city: order.city,
    state: order.state,
    pin: order.postalCode,
    phone: order.customerPhone,
    totalAmountInr: Number(order.total) || 0,
    paymentMode: paymentModeForOrder(order.paymentVerified),
    orderDate: order.createdAt,
    weightKg,
    quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
    description: order.items.map((item) => `${item.quantity}× ${item.name}`).join(", "),
  };

  let booking;
  try {
    booking = await createDelhiveryShipment(input);
  } catch (error) {
    const message =
      error instanceof DelhiveryError
        ? error.message
        : "The shipment could not be booked with Delhivery.";
    console.error("[delhivery] booking failed", { orderId, error });
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const note = `Delhivery AWB ${booking.awb} booked.`;
  const deliveryNotes = [
    order.deliveryNotes ?? undefined,
    `${note} ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const updated = await prisma.order.updateMany({
      where: { orderId: order.orderId },
      data: {
        orderStatus: "shipped",
        trackingNumber: booking.awb,
        deliveryNotes,
      },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
  } catch (error) {
    console.error("[mongo] storing AWB failed", error);
    return NextResponse.json(
      { error: "Delhivery accepted the shipment, but the AWB could not be saved." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    awb: booking.awb,
    trackingNumber: booking.awb,
    orderStatus: "shipped",
    deliveryNotes,
  });
}

async function trackDelhivery(orderId: string): Promise<Response> {
  if (!delhiveryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Delhivery is not configured. Add DELHIVERY_API_KEY and DELHIVERY_BASE_URL.",
      },
      { status: 503 }
    );
  }

  let order;
  try {
    order = await prisma.order.findFirst({
      where: { orderId },
      select: { orderId: true, trackingNumber: true },
    });
  } catch (error) {
    console.error("[mongo] tracking lookup failed", error);
    return NextResponse.json({ error: "The order could not be loaded." }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (!order.trackingNumber) {
    return NextResponse.json(
      { error: "This order has no AWB yet. Book a Delhivery shipment first." },
      { status: 400 }
    );
  }

  try {
    const status = await delhiveryTrack(order.trackingNumber);
    return NextResponse.json({
      awb: status.awb,
      status: status.status,
      scans: status.scans.slice(-8),
    });
  } catch (error) {
    const message =
      error instanceof DelhiveryError
        ? error.message
        : "The tracking details could not be fetched.";
    console.error("[delhivery] tracking failed", { orderId, error });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}