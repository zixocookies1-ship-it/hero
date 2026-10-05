import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { databaseConfigured } from "@/lib/env";
import { formatIndianDate } from "@/lib/order-id";
import { isValidOrderId } from "@/lib/order-id";
import { formatPrice } from "@/lib/products";
import { verifyReceiptToken } from "@/lib/receipt-token";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Order placed - Nature's Choice Jaggery",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
};

/**
 * Loads the order from the database on every request, so refreshing the page
 * still shows the order. Access needs the signed receipt token issued when the
 * payment was verified, which stops anyone reading a customer's details by
 * guessing an order ID.
 */
export default async function OrderSuccessPage({ params, searchParams }: PageProps) {
  const { orderId } = await params;
  const { token } = await searchParams;

  if (!databaseConfigured() || !isValidOrderId(orderId)) notFound();

  const access = verifyReceiptToken(orderId, token);
  if (!access.ok) {
    return (
      <main className="pt-28 pb-24">
        <div className="mx-auto max-w-2xl px-6">
          <div className="rounded-2xl border border-black/5 bg-[var(--white)] p-10 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-[var(--dark-text)]">
              This order link is not valid
            </h1>
            <p className="mt-3 text-sm text-[var(--dark-text)]/70">
              The link may have expired or been opened without the receipt token. If you were charged,
              please contact us on WhatsApp and we will send your receipt again.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-block rounded-full bg-[var(--jaggery-brown)] px-6 py-3 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)]"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const order = await prisma.order.findUnique({
    where: { orderId },
    include: { items: true },
  });

  if (!order) notFound();

  const paid = order.paymentStatus === "paid";

  return (
    <main className="pt-28 pb-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="rounded-2xl border border-black/5 bg-[var(--white)] p-8 shadow-sm sm:p-10">
          <div className="text-center">
            <span
              aria-hidden="true"
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
                paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {paid ? "✓" : "!"}
            </span>

            <h1 className="mt-6 text-2xl md:text-3xl font-bold text-[var(--dark-text)]">
              {paid ? "ORDER PLACED SUCCESSFULLY" : "ORDER RECEIVED"}
            </h1>

            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-[var(--dark-text)]/70">
              {paid
                ? "Thank you for your order. Your order has been successfully placed and payment has been received."
                : "We have your order but could not confirm the payment yet. If you were charged, please contact us."}
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-1 gap-4 rounded-2xl bg-[var(--warm-cream)] p-6 sm:grid-cols-3">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
                Order ID
              </dt>
              <dd className="mt-1 font-mono text-sm font-semibold text-[var(--dark-text)]">
                {order.orderId}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
                Payment status
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--dark-text)]">
                {order.paymentStatus.toUpperCase()}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
                Order date
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--dark-text)]">
                {formatIndianDate(order.createdAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--dark-text)]/60">
              Delivery address
            </h2>
            <address className="mt-2 text-sm not-italic leading-relaxed text-[var(--dark-text)]/80">
              {order.customerName}
              <br />
              {order.address}
              <br />
              {order.city}, {order.state} {order.postalCode}
              <br />
              {order.customerPhone}
            </address>
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--dark-text)]/60">
              Order items
            </h2>
            <ul className="mt-4 space-y-3">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 border-b border-black/5 pb-3 text-sm"
                >
                  <span>
                    <span className="block font-medium text-[var(--dark-text)]">{item.name}</span>
                    <span className="block text-xs text-[var(--dark-text)]/60">
                      {item.quantity} &times; {formatPrice(Number(item.unitPrice))}
                    </span>
                  </span>
                  <span className="font-semibold text-[var(--jaggery-brown)]">
                    {formatPrice(Number(item.lineTotal))}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--dark-text)]/70">Subtotal</dt>
              <dd>{formatPrice(Number(order.subtotal))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--dark-text)]/70">Discount</dt>
              <dd className="text-[var(--natural-green)]">
                &minus; {formatPrice(Number(order.discount))}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--dark-text)]/70">Shipping</dt>
              <dd>{Number(order.deliveryFee) > 0 ? formatPrice(Number(order.deliveryFee)) : "Free"}</dd>
            </div>
            <div className="flex justify-between border-t border-black/5 pt-3 text-base font-bold text-[var(--jaggery-brown)]">
              <dt>Total paid</dt>
              <dd>{formatPrice(Number(order.total))}</dd>
            </div>
          </dl>

          {order.paymentId && (
            <p className="mt-6 break-all font-mono text-xs text-[var(--dark-text)]/55">
              Razorpay payment ID: {order.paymentId}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={`/api/orders/${order.orderId}/invoice?token=${encodeURIComponent(token ?? "")}`}
              className="inline-flex w-full items-center justify-center rounded-full bg-[var(--jaggery-brown)] px-6 py-3.5 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)] sm:w-auto"
            >
              DOWNLOAD PDF RECEIPT
            </a>
            <a
              href={`/api/orders/${order.orderId}/invoice?token=${encodeURIComponent(token ?? "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full border border-black/10 px-6 py-3.5 text-sm font-semibold text-[var(--dark-text)] transition-colors hover:bg-black/5 sm:w-auto"
            >
              VIEW PDF
            </a>
          </div>

          <div className="mt-4">
            <Link
              href="/products"
              className="inline-flex w-full items-center justify-center rounded-full border border-black/10 px-6 py-3.5 text-sm font-semibold text-[var(--dark-text)] transition-colors hover:bg-black/5 sm:w-auto"
            >
              CONTINUE SHOPPING
            </Link>
          </div>

          <p className="mt-8 border-t border-black/5 pt-6 text-center text-xs leading-relaxed text-[var(--dark-text)]/55">
            Keep this link to revisit your order and download the receipt again. We have also sent
            the details to your email{order.customerEmail ? ` (${order.customerEmail})` : ""} if one
            was provided.
          </p>
        </div>
      </div>
    </main>
  );
}