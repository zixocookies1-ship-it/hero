import { prisma } from "@/lib/db";
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
  let databaseError: string | null = null;

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
    databaseError = error instanceof Error ? error.message : String(error);
    console.error("admin overview unavailable", error);
  }

  const policy = getShippingPolicy();

  const cards = [
    { label: "Orders", value: String(stats.total) },
    { label: "Paid", value: String(stats.paid) },
    { label: "Awaiting payment", value: String(stats.pending) },
    { label: "Failed", value: String(stats.failed) },
    { label: "Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}` },
  ];

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Overview</h2>

      {databaseError ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">
            The order database is not reachable, so these figures are zeros, not real totals.
          </p>
          <p className="mt-2 text-sm text-red-700">
            Set <code className="font-mono">DATABASE_URL</code> and run{" "}
            <code className="font-mono">npm run db:deploy</code>, then reload this page.
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
          Shipping is charged at ₹{policy.feeInr}
          {policy.freeAboveInr
            ? `, and free above ₹${policy.freeAboveInr.toLocaleString("en-IN")}`
            : " with no free-shipping threshold"}
          . These values come from the SHIPPING_FEE_INR and FREE_SHIPPING_THRESHOLD_INR
          environment variables, and the server applies them to every order.
        </p>
      </div>
    </div>
  );
}