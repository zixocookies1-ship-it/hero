import Link from "next/link";
import { prisma } from "@/lib/db";
import { classifyMongoError, type MongoFailure } from "@/lib/mongo-diagnostics";
import { formatIndianDate } from "@/lib/order-id";
import { formatPrice } from "@/lib/products";
import AdminOrderFulfilment from "@/components/admin-order-fulfilment";

export const dynamic = "force-dynamic";

const paymentBadge: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-200 text-gray-700",
};

const orderBadge: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  packed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

const rupees = (value: number) => formatPrice(value);

export default async function AdminOrdersPage() {
  // Without a reachable database this must explain itself rather than 500, and
  // must never imply that orders exist. An empty table and a missing table look
  // identical to a customer reading the screen, so say which one it is.
  let orders: Awaited<ReturnType<typeof prisma.order.findMany<{ include: { items: true } }>>> = [];
  // Null means the query succeeded. A set value means the database failed, which
  // must never be rendered as an empty order list.
  let failure: MongoFailure | null = null;

  try {
    orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true },
    });
  } catch (error) {
    failure = classifyMongoError(error);
    console.error("[mongo] admin orders query failed", {
      kind: failure.kind,
      errorName: failure.errorName,
      errorCode: failure.errorCode,
    });
  }

  if (failure) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Orders</h2>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">
            The order database could not be queried. These orders could not be loaded.
          </p>
          <p className="mt-2 text-sm text-red-700">{failure.summary}</p>
          <dl className="mt-3 space-y-1 text-xs text-red-700">
            <div className="flex gap-2">
              <dt className="font-semibold">Reason</dt>
              <dd className="font-mono">{failure.kind}</dd>
            </div>
            {failure.errorName ? (
              <div className="flex gap-2">
                <dt className="font-semibold">Error</dt>
                <dd className="font-mono">{failure.errorName}</dd>
              </div>
            ) : null}
            {failure.errorCode ? (
              <div className="flex gap-2">
                <dt className="font-semibold">Code</dt>
                <dd className="font-mono">{failure.errorCode}</dd>
              </div>
            ) : null}
          </dl>
          {failure.message ? (
            <pre className="mt-3 overflow-x-auto rounded border border-red-200 bg-white/70 p-3 font-mono text-xs whitespace-pre-wrap text-red-900">
              {failure.message}
            </pre>
          ) : null}
          <p className="mt-3 text-sm text-red-700">
            Full diagnostics are available at{" "}
            <code className="font-mono">/api/admin/db-health</code>. They never include the
            connection string or credentials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Orders</h2>
          <p className="mt-1 text-sm text-gray-600">
            {orders.length === 0
              ? "No orders yet."
              : `Showing the ${orders.length} most recent order${orders.length === 1 ? "" : "s"}.`}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg bg-white p-10 text-center shadow">
          <p className="text-gray-600">
            Paid orders will appear here as soon as a customer completes a Razorpay payment.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Razorpay payment ID</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Fulfilment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                return (
                  <tr key={order.id} className="border-b border-black/5 align-top">
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      {order.orderId ?? <span className="text-gray-400">pending</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-medium">{order.customerName}</span>
                      <span className="block text-xs text-gray-600">{order.customerPhone}</span>
                      <span className="block text-xs text-gray-600">
                        {order.city}, {order.state} {order.postalCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block">
                        {quantity} item{quantity === 1 ? "" : "s"}
                      </span>
                      <span className="block max-w-[220px] truncate text-xs text-gray-600">
                        {order.items.map((item) => item.name).join(", ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {rupees(Number(order.total))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                          paymentBadge[order.paymentStatus] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                      {order.paymentVerified ? (
                        <span className="mt-1 block text-[11px] text-green-700">verified</span>
                      ) : (
                        <span className="mt-1 block text-[11px] text-gray-500">unverified</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                          orderBadge[order.orderStatus] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.orderStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs break-all text-gray-700">
                      {order.paymentId ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-gray-600">
                      {formatIndianDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {order.orderId ? (
                        <AdminOrderFulfilment
                          order={{
                            orderId: order.orderId,
                            orderStatus: order.orderStatus,
                            trackingNumber: order.trackingNumber,
                            deliveryNotes: order.deliveryNotes,
                          }}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">not allocated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500">
        Showing the last 100 orders. Need older ones or a CSV export? That is not wired up yet.
      </p>

      <p className="mt-6 text-sm">
        <Link href="/" className="text-[var(--ginger-terracotta)] underline underline-offset-4">
          Back to the storefront
        </Link>
      </p>
    </div>
  );
}