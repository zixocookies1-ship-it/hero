import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import { asOptionalText, asRequiredText, jsonBody } from "@/lib/admin-api";

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
 * Updates the fulfilment side of an order: its status in the journey from
 * confirmed to delivered, plus the tracking number and delivery notes that the
 * admin adds. The payment side is never touched here — payment state is decided
 * by the Razorpay flow, not by an admin edit.
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