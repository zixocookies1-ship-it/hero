import Link from "next/link";
import { prisma } from "@/lib/db";
import { classifyMongoError, type MongoFailure } from "@/lib/mongo-diagnostics";
import { formatPrice } from "@/lib/products";
import { loadShippingPolicy } from "@/lib/cms";

export const dynamic = "force-dynamic";

const quickActions = [
  { href: "/admin/products", label: "Manage products" },
  { href: "/admin/combos", label: "Create a combo" },
  { href: "/admin/banners", label: "Edit banners" },
  { href: "/admin/coupons", label: "Add a coupon" },
  { href: "/admin/delivery", label: "Delivery settings" },
  { href: "/admin/settings", label: "Store settings" },
];

export default async function AdminOverviewPage() {
  let stats = {
    total: 0,
    paid: 0,
    pending: 0,
    failed: 0,
    revenue: 0,
    activeProducts: 0,
    combos: 0,
    lowStock: 0,
  };
  // Null means "the database answered"; set means "the database did not answer".
  // Zero and unreachable must never render as the same thing.
  let failure: MongoFailure | null = null;

  try {
    const [total, paid, pending, failed, paidOrders, activeProducts, combos, variants] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { paymentStatus: "paid" } }),
        prisma.order.count({ where: { paymentStatus: "pending" } }),
        prisma.order.count({ where: { paymentStatus: "failed" } }),
        prisma.order.findMany({
          where: { paymentStatus: "paid" },
          select: { total: true },
        }),
        prisma.catalogProduct.count({ where: { isActive: true } }),
        prisma.combo.count(),
        prisma.productVariant.findMany({ select: { inventory: true } }),
      ]);
    stats = {
      total,
      paid,
      pending,
      failed,
      revenue: paidOrders.reduce((sum, order) => sum + Number(order.total), 0),
      activeProducts,
      combos,
      lowStock: variants.filter((variant) => variant.inventory <= 5).length,
    };
  } catch (error) {
    failure = classifyMongoError(error);
    console.error("[mongo] admin overview query failed", {
      kind: failure.kind,
      errorName: failure.errorName,
      errorCode: failure.errorCode,
    });
  }

  const policy = await loadShippingPolicy();

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
      // character is hardcoded here.
      value: failure ? "—" : formatPrice(stats.revenue),
    },
  ];

  const catalogueCards = [
    { label: "Live products", value: failure ? "—" : String(stats.activeProducts) },
    { label: "Combos", value: failure ? "—" : String(stats.combos) },
    {
      label: "Low-stock variants",
      value: failure ? "—" : String(stats.lowStock),
      note: "Inventory at or below 5",
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

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {catalogueCards.map((card) => (
          <div key={card.label} className="rounded-lg bg-white p-5 shadow">
            <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className="mt-2 font-serif text-2xl font-bold text-[var(--dark-text)]">
              {card.value}
            </p>
            {card.note ? <p className="mt-1 text-xs text-gray-500">{card.note}</p> : null}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-[var(--dark-text)]">Quick actions</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-[var(--dark-text)]">Delivery configuration</h3>
        <p className="mt-2 text-sm text-gray-600">
          Shipping is charged at {policy.shippingEnabled ? formatPrice(policy.feeInr) : "nothing (paused)"}
          {policy.shippingEnabled && policy.freeAboveInr
            ? ", and free above " + formatPrice(policy.freeAboveInr)
            : policy.shippingEnabled
              ? " with no free-shipping threshold"
              : ""}
          . These values come from the <code className="font-mono">shippingconfigurations</code>{" "}
          document edited on the Delivery page, falling back to the SHIPPING_FEE_INR and
          FREE_SHIPPING_THRESHOLD_INR environment variables when it is missing.
        </p>
      </div>
    </div>
  );
}