import { prisma } from "@/lib/db";
import { classifyMongoError, type MongoFailure } from "@/lib/mongo-diagnostics";
import { formatPrice } from "@/lib/products";
import { getShippingPolicy } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  let stats = {
    total: 0,
    paid: 0,
    pending: 0,
    failed: 0,
    revenue: 0,
  };
  // Null means "the database answered"; set means "the database did not answer".
  // Zero and unreachable must never render as the same thing.
  let failure: MongoFailure | null = null;

  try {
    const [total, paid, pending, failed, paidOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: "paid" } }),
      prisma.order.count({ where: { paymentStatus: "pending" } }),
      prisma.order.count({ where: { paymentStatus: "failed" } }),
      prisma.order.findMany({
        where: { paymentStatus: "paid" },
        select: { total: true },
      }),
    ]);
    stats = {
      total,
      paid,
      pending,
      failed,
      revenue: paidOrders.reduce((sum, order) => sum + Number(order.total), 0),
    };
  } catch (error) {
    failure = classifyMongoError(error);
    console.error("[mongo] admin overview query failed", {
      kind: failure.kind,
      errorName: failure.errorName,
      errorCode: failure.errorCode,
    });
  }

  const policy = getShippingPolicy();

  // While the database is unreachable the figures are unknown, not zero, so they
  // are shown as a dash rather than a number that could be mistaken for a total.
  const cards = [
    { label: "Orders", value: failure ? "—" : String(stats.total) },
    { label: "Paid", value: failure ? "—" : String(stats.paid) },
    { label: "Awaiting payment", value: failure ? "—" : String(stats.pending) },
    { label: "Failed", value: failure ? "—" : String(stats.failed) },
    {
      label: "Revenue",
      // formatPrice renders the rupee sign through Intl, so no currency
      // character is hardcoded here. The previous template literal had been
      // mangled into a literal "?" and rendered as "Revenue ?0".
      value: failure ? "—" : formatPrice(stats.revenue),
    },
  ];

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Overview</h2>

      {failure ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">
            The order database could not be queried, so these figures are unknown, not zeros.
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
            Full diagnostics (host, database name, ping result, collections) are available at{" "}
            <code className="font-mono">/api/admin/db-health</code>. They never include the
            connection string or credentials.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg bg-white p-5 shadow">
            <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className="mt-2 font-serif text-2xl font-bold text-[var(--dark-text)]">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-[var(--dark-text)]">Delivery configuration</h3>
        <p className="mt-2 text-sm text-gray-600">
          Shipping is charged at {formatPrice(policy.feeInr)}
          {policy.freeAboveInr
            ? `, and free above ${formatPrice(policy.freeAboveInr)}`
            : " with no free-shipping threshold"}
          . These values come from the SHIPPING_FEE_INR and FREE_SHIPPING_THRESHOLD_INR
          environment variables, and the server applies them to every order.
        </p>
      </div>
    </div>
  );
}