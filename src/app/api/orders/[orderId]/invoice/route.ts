import { NextResponse } from "next/server";
import { databaseConfigured } from "@/lib/env";
import { findOrderByOrderId } from "@/lib/orders";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import { loadBrandUncached } from "@/lib/cms";
import { isValidOrderId } from "@/lib/order-id";
import { verifyReceiptToken } from "@/lib/receipt-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams a real PDF for this specific order. Generated per request from stored
 * order data, never a static file, and only reachable with a valid receipt
 * token.
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
      { error: "This receipt link is not valid or has expired." },
      { status: 403 }
    );
  }

  const order = await findOrderByOrderId(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  let pdf: Uint8Array;
  try {
    pdf = await generateInvoicePdf({
      // Use the validated path parameter rather than the nullable column so the
      // generator always receives the exact id we authorised.
      orderId,
      createdAt: order.createdAt,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      paymentId: order.paymentId,
      paymentMethod: order.paymentMethod,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      address: order.address,
      city: order.city,
      state: order.state,
      postalCode: order.postalCode,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        mrp: Number(item.mrp),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      })),
      mrpTotal: Number(order.subtotal) + Number(order.discount),
      discount: Number(order.discount),
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
    },
    await loadBrandUncached()
    );
  } catch (error) {
    console.error("invoice generation failed", error);
    return NextResponse.json(
      { error: "We could not generate your receipt. Please contact us." },
      { status: 500 }
    );
  }

  const filename = `${order.orderId}-invoice.pdf`;

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, private",
    },
  });
}