import { prisma } from "@/lib/db";
import { classifyMongoError, type MongoFailure } from "@/lib/mongo-diagnostics";
import { formatPrice } from "@/lib/products";
import { AdminDbFailure } from "@/components/admin-db-failure";

export const dynamic = "force-dynamic";

const rupees = (paise: number) => formatPrice(paise / 100);

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

export default async function AdminDeliveryPage() {
  let config: Awaited<ReturnType<typeof prisma.shippingConfiguration.findFirst>> = null;
  let failure: MongoFailure | null = null;

  try {
    config = await prisma.shippingConfiguration.findFirst();
  } catch (error) {
    failure = classifyMongoError(error);
    console.error("[mongo] admin delivery query failed", {
      kind: failure.kind,
      errorName: failure.errorName,
      errorCode: failure.errorCode,
    });
  }

  if (failure) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Delivery</h2>
        <AdminDbFailure
          failure={failure}
          title="The delivery configuration could not be queried. These values could not be loaded."
        />
      </div>
    );
  }

  if (!config) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Delivery</h2>
        <div className="mt-6 rounded-lg bg-white p-10 text-center shadow">
          <p className="text-gray-600">
            The database answered, and the shippingconfigurations collection is empty.
          </p>
        </div>
      </div>
    );
  }

  const pickup = [
    config.pickupContactName,
    config.pickupName,
    config.pickupAddressLine1,
    config.pickupAddressLine2,
    [config.pickupCity, config.pickupState, config.pickupPincode].filter(Boolean).join(" "),
    config.pickupCountry,
  ]
    .filter((part) => part.trim())
    .join(", ");

  const serviceable = Array.isArray(config.serviceablePincodes)
    ? config.serviceablePincodes.length
    : 0;
  const blocked = Array.isArray(config.blockedPincodes) ? config.blockedPincodes.length : 0;

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Delivery</h2>
      <p className="mt-1 text-sm text-gray-600">
        Read from the <code className="font-mono">shippingconfigurations</code> collection in
        MongoDB.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-xs uppercase tracking-wide text-gray-500">Shipping</p>
          <p className="mt-2 font-serif text-2xl font-bold text-[var(--dark-text)]">
            {config.shippingEnabled ? "enabled" : "paused"}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-xs uppercase tracking-wide text-gray-500">Flat fee</p>
          <p className="mt-2 font-serif text-2xl font-bold text-[var(--dark-text)]">
            {rupees(config.flatShippingPaise)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-xs uppercase tracking-wide text-gray-500">Free above</p>
          <p className="mt-2 font-serif text-2xl font-bold text-[var(--dark-text)]">
            {config.freeShippingEnabled ? rupees(config.freeShippingThresholdPaise) : "never"}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-xs uppercase tracking-wide text-gray-500">Cash on delivery</p>
          <p className="mt-2 font-serif text-2xl font-bold text-[var(--dark-text)]">
            {config.codEnabled ? "on" : "off"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-semibold text-[var(--dark-text)]">Charges</h3>
          <dl className="mt-2 divide-y divide-black/5">
            <Row label="Flat shipping" value={rupees(config.flatShippingPaise)} />
            <Row label="Handling fee" value={rupees(config.handlingPaise)} />
            <Row
              label="Free-shipping threshold"
              value={
                config.freeShippingEnabled
                  ? `${rupees(config.freeShippingThresholdPaise)} or more`
                  : "disabled"
              }
            />
            <Row
              label="Weight-based shipping"
              value={
                config.weightBasedShipping
                  ? `${rupees(config.weightRatePaisePerKg)} per kg`
                  : "flat rate"
              }
            />
            <Row
              label="COD handling fee"
              value={config.codEnabled ? rupees(config.codHandlingPaise) : "COD disabled"}
            />
          </dl>
        </section>

        <section className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-semibold text-[var(--dark-text)]">Estimates &amp; policy</h3>
          <dl className="mt-2 divide-y divide-black/5">
            <Row
              label="Delivery estimate"
              value={
                config.showEstimatedDelivery
                  ? `${config.defaultEstimatedDeliveryDaysMin}–${config.defaultEstimatedDeliveryDaysMax} days`
                  : "not shown"
              }
            />
            <Row label="Serviceability" value={config.serviceabilityMode} />
            <Row
              label="PIN codes"
              value={`${serviceable} serviceable, ${blocked} blocked`}
            />
            <Row label="Cancellation" value={config.allowCancellation ? `allowed within ${config.cancelWindowHours} hours` : "not allowed"} />
            <Row label="Tax" value={config.taxEnabled ? `${config.taxPercent}% (${config.taxInclusive ? "inclusive" : "exclusive"})` : "no tax applied"} />
          </dl>
        </section>

        <section className="rounded-lg bg-white p-6 shadow lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--dark-text)]">Pickup</h3>
          <dl className="mt-2 divide-y divide-black/5">
            <Row label="Pickup address" value={pickup} />
            <Row label="Pickup contact" value={config.pickupContactPhone || config.pickupEmail} />
          </dl>
        </section>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Read-only. Checkout charges from the SHIPPING_FEE_INR and FREE_SHIPPING_THRESHOLD_INR
        environment variables, so this stored configuration is what the source service used and
        is not what the live storefront charges today.
      </p>
    </div>
  );
}
