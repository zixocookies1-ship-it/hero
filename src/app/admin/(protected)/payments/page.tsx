import { prisma } from "@/lib/db";
import { classifyMongoError, type MongoFailure } from "@/lib/mongo-diagnostics";
import { hasEnv, razorpayConfigured } from "@/lib/env";
import { AdminDbFailure } from "@/components/admin-db-failure";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-black/5 py-3">
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-[var(--dark-text)]">
        {value.trim() ? value : <span className="text-gray-400">not set</span>}
      </dd>
    </div>
  );
}

export default async function AdminPaymentsPage() {
  let counts = { total: 0, paid: 0, pending: 0, failed: 0 };
  let settings: Awaited<ReturnType<typeof prisma.businessSettings.findFirst>> = null;
  let failure: MongoFailure | null = null;

  try {
    const [total, paid, pending, failed, businessSettings] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: "paid" } }),
      prisma.order.count({ where: { paymentStatus: "pending" } }),
      prisma.order.count({ where: { paymentStatus: "failed" } }),
      prisma.businessSettings.findFirst(),
    ]);
    counts = { total, paid, pending, failed };
    settings = businessSettings;
  } catch (error) {
    failure = classifyMongoError(error);
    console.error("[mongo] admin payments query failed", {
      kind: failure.kind,
      errorName: failure.errorName,
      errorCode: failure.errorCode,
    });
  }

  if (failure) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Payments</h2>
        <AdminDbFailure
          failure={failure}
          title="The payment data could not be queried. These figures are unknown, not zeros."
        />
      </div>
    );
  }

  const cards = [
    { label: "Orders", value: String(counts.total) },
    { label: "Paid", value: String(counts.paid) },
    { label: "Awaiting payment", value: String(counts.pending) },
    { label: "Failed", value: String(counts.failed) },
  ];

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Payments</h2>
      <p className="mt-1 text-sm text-gray-600">
        Order payment state comes from the <code className="font-mono">Order</code> collection;
        gateway settings come from{" "}
        <code className="font-mono">businesssettings</code>.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg bg-white p-5 shadow">
            <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className="mt-2 font-serif text-2xl font-bold text-[var(--dark-text)]">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-[var(--dark-text)]">Gateway</h3>
        <dl className="mt-2 divide-y divide-black/5">
          <Row
            label="Razorpay credentials"
            value={razorpayConfigured() ? "present" : "missing — payments cannot be taken"}
          />
          <Row
            label="RAZORPAY_KEY_ID"
            value={hasEnv("RAZORPAY_KEY_ID") ? "present" : "missing"}
          />
          <Row
            label="RAZORPAY_KEY_SECRET"
            value={hasEnv("RAZORPAY_KEY_SECRET") ? "present" : "missing"}
          />
          <Row
            label="Online payment enabled in store"
            value={
              settings
                ? settings.onlinePaymentEnabled
                  ? "yes"
                  : "no"
                : "businesssettings collection is empty"
            }
          />
          <Row
            label="Razorpay display name"
            value={settings?.razorpayDisplayName ?? ""}
          />
        </dl>
      </div>

      <div className="mt-6 rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-[var(--dark-text)]">Recent payments</h3>
        {counts.total === 0 ? (
          <p className="mt-3 text-sm text-gray-600">
            No orders have been placed yet, so there is nothing to reconcile. Payment state will
            appear here once a customer completes checkout.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-gray-600">
                {counts.paid} paid · {counts.pending} awaiting payment · {counts.failed} failed
              </span>
            </li>
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Only the presence of each variable is shown. Values, keys and secrets are never printed
        on this screen or returned by any API.
      </p>
    </div>
  );
}
