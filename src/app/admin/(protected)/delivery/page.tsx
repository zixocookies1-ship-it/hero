import { prisma } from "@/lib/db";
import { classifyMongoError, type MongoFailure } from "@/lib/mongo-diagnostics";
import { formatPrice } from "@/lib/products";
import { AdminDbFailure } from "@/components/admin-db-failure";
import AdminDeliveryEditor, {
  type DeliveryFormData,
} from "@/components/admin-delivery-editor";

export const dynamic = "force-dynamic";

const rupees = (paise: number) => formatPrice(paise / 100);

/** Empty form used when the collection has no document yet. */
const emptyForm: DeliveryFormData = {
  shippingEnabled: true,
  flatFeeInr: 0,
  handlingInr: 0,
  freeShippingEnabled: false,
  freeShippingThresholdInr: 0,
  codEnabled: false,
  codHandlingInr: 0,
  showEstimatedDelivery: false,
  estimateMinDays: 3,
  estimateMaxDays: 5,
  allowCancellation: false,
  cancelWindowHours: 0,
  taxEnabled: false,
  taxInclusive: true,
  taxPercent: 0,
  pickupName: "",
  pickupContactName: "",
  pickupContactPhone: "",
  pickupEmail: "",
  pickupAddressLine1: "",
  pickupAddressLine2: "",
  pickupCity: "",
  pickupState: "",
  pickupPincode: "",
  pickupCountry: "",
};

const toForm = (
  config: NonNullable<Awaited<ReturnType<typeof prisma.shippingConfiguration.findFirst>>>
): DeliveryFormData => ({
  shippingEnabled: config.shippingEnabled,
  flatFeeInr: Math.round(config.flatShippingPaise / 100),
  handlingInr: Math.round(config.handlingPaise / 100),
  freeShippingEnabled: config.freeShippingEnabled,
  freeShippingThresholdInr: Math.round(config.freeShippingThresholdPaise / 100),
  codEnabled: config.codEnabled,
  codHandlingInr: Math.round(config.codHandlingPaise / 100),
  showEstimatedDelivery: config.showEstimatedDelivery,
  estimateMinDays: config.defaultEstimatedDeliveryDaysMin,
  estimateMaxDays: config.defaultEstimatedDeliveryDaysMax,
  allowCancellation: config.allowCancellation,
  cancelWindowHours: config.cancelWindowHours,
  taxEnabled: config.taxEnabled,
  taxInclusive: config.taxInclusive,
  taxPercent: config.taxPercent,
  pickupName: config.pickupName,
  pickupContactName: config.pickupContactName,
  pickupContactPhone: config.pickupContactPhone,
  pickupEmail: config.pickupEmail,
  pickupAddressLine1: config.pickupAddressLine1,
  pickupAddressLine2: config.pickupAddressLine2,
  pickupCity: config.pickupCity,
  pickupState: config.pickupState,
  pickupPincode: config.pickupPincode,
  pickupCountry: config.pickupCountry,
});

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
          title="The delivery configuration could not be queried. These settings could not be loaded."
        />
      </div>
    );
  }

  const form = config ? toForm(config) : emptyForm;
  const feeInr = form.shippingEnabled ? form.flatFeeInr + form.handlingInr : 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Delivery</h2>
          <p className="mt-1 text-sm text-gray-600">
            Read from and saved to the <code className="font-mono">shippingconfigurations</code>{" "}
            collection. What you save here is exactly what checkout charges.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-xs uppercase tracking-wide text-gray-500">Shipping</p>
          <p className="mt-2 font-serif text-2xl font-bold text-[var(--dark-text)]">
            {form.shippingEnabled ? "enabled" : "paused"}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-xs uppercase tracking-wide text-gray-500">Charged per order</p>
          <p className="mt-2 font-serif text-2xl font-bold text-[var(--dark-text)]">
            {rupees(feeInr * 100)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-xs uppercase tracking-wide text-gray-500">Free above</p>
          <p className="mt-2 font-serif text-2xl font-bold text-[var(--dark-text)]">
            {form.freeShippingEnabled ? rupees(form.freeShippingThresholdInr * 100) : "never"}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-xs uppercase tracking-wide text-gray-500">Cash on delivery</p>
          <p className="mt-2 font-serif text-2xl font-bold text-[var(--dark-text)]">
            {form.codEnabled ? "on" : "off"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <AdminDeliveryEditor config={form} />
      </div>
    </div>
  );
}