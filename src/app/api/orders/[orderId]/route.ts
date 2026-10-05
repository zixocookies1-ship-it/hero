import { NextResponse } from "next/server";
import { databaseConfigured } from "@/lib/env";
import { findOrderByOrderId } from "@/lib/orders";
import { isValidOrderId } from "@/lib/order-id";
import { verifyReceiptToken } from "@/lib/receipt-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns a single order for the success page. Requires the signed receipt token
 * issued at payment time, so order IDs cannot be enumerated to read customer
 * details.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!databaseConfigured()) {
    return NextResponse.json({ error: "Not available." }, { status: 503 });
  }

  const { orderId } = await params;
  if (!isValidOrderId(orderId)) {
    return NextResponse.json({ error: "Invalid order reference." }, { status: 400 });
  }

  const token = new URL(request.url).searchParams.get("token");
  const access = verifyReceiptToken(orderId, token);
  if (!access.ok) {
    return NextResponse.json(
      { error: "This order link is not valid or has expired." },
      { status: 403 }
    );
  }

  const order = await findOrderByOrderId(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.orderId,
    createdAt: order.createdAt.toISOString(),
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    paymentId: order.paymentId,
    razorpayOrderId: order.razorpayOrderId,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
      address: order.address,
      city: order.city,
      state: order.state,
      postalCode: order.postalCode,
    },
    items: order.items.map((item) => ({
      name: item.name,
      image: item.image,
      quantity: item.quantity,
      mrp: Number(item.mrp),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
    totals: {
      mrpTotal: Number(order.subtotal) + Number(order.discount),
      discount: Number(order.discount),
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
    },
  });
}