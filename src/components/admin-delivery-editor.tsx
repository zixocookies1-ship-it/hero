"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type DeliveryFormData = {
  shippingEnabled: boolean;
  flatFeeInr: number;
  handlingInr: number;
  freeShippingEnabled: boolean;
  freeShippingThresholdInr: number;
  codEnabled: boolean;
  codHandlingInr: number;
  showEstimatedDelivery: boolean;
  estimateMinDays: number;
  estimateMaxDays: number;
  allowCancellation: boolean;
  cancelWindowHours: number;
  taxEnabled: boolean;
  taxInclusive: boolean;
  taxPercent: number;
  pickupName: string;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupEmail: string;
  pickupAddressLine1: string;
  pickupAddressLine2: string;
  pickupCity: string;
  pickupState: string;
  pickupPincode: string;
  pickupCountry: string;
};

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-sm text-[var(--dark-text)] focus:border-[var(--ginger-terracotta)] focus:outline-none";

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  max,
  min,
  full,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  placeholder?: string;
  max?: number;
  min?: number;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <input
        className={inputClass}
        type={type}
        min={min}
        max={max}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-3 rounded-md border border-black/10 px-4 py-3 text-left transition-colors hover:border-[var(--ginger-terracotta)]"
    >
      <span>
        <span className="block text-sm font-medium text-[var(--dark-text)]">{label}</span>
        <span className="mt-0.5 block text-xs text-gray-500">{hint}</span>
      </span>
      <span
        className={`relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-[var(--natural-green)]" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/**
 * Delivery settings. One document in shippingconfigurations is the single
 * source for what checkout charges: saving here immediately changes the
 * preview and the amount the Razorpay order is created for.
 */
export default function AdminDeliveryEditor({ config }: { config: DeliveryFormData }) {
  const router = useRouter();
  const [form, setForm] = useState(() => ({ ...config }));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof DeliveryFormData>(key: K, value: DeliveryFormData[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/delivery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Save failed.");
      setResult({
        ok: true,
        text: "Delivery settings saved. Checkout now charges these values.",
      });
      router.refresh();
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : "Save failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <section className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-[var(--dark-text)]">Charges</h3>
        <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Flat shipping fee (₹)"
            type="number"
            min={0}
            value={form.flatFeeInr}
            onChange={(value) => set("flatFeeInr", Number(value) || 0)}
          />
          <Field
            label="Handling fee (₹)"
            type="number"
            min={0}
            value={form.handlingInr}
            onChange={(value) => set("handlingInr", Number(value) || 0)}
          />
          <Field
            label="Free-shipping threshold (₹) — when enabled below"
            type="number"
            min={0}
            value={form.freeShippingThresholdInr}
            onChange={(value) => set("freeShippingThresholdInr", Number(value) || 0)}
          />
          <Toggle
            label="Charge shipping"
            hint="Uncheck to pause all shipping fees (pickup-only mode)."
            checked={form.shippingEnabled}
            onChange={(checked) => set("shippingEnabled", checked)}
          />
          <Toggle
            label="Free shipping over threshold"
            hint="Orders at or above the threshold pay no shipping."
            checked={form.freeShippingEnabled}
            onChange={(checked) => set("freeShippingEnabled", checked)}
          />
        </div>
      </section>

      <section className="mt-5 rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-[var(--dark-text)]">Cash on delivery</h3>
        <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="COD handling fee (₹)"
            type="number"
            min={0}
            value={form.codHandlingInr}
            onChange={(value) => set("codHandlingInr", Number(value) || 0)}
          />
          <Toggle
            label="Accept cash on delivery"
            hint="Shown at checkout as a payment method when enabled."
            checked={form.codEnabled}
            onChange={(checked) => set("codEnabled", checked)}
          />
        </div>
      </section>

      <section className="mt-5 rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-[var(--dark-text)]">Estimates, tax &amp; cancellation</h3>
        <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Minimum delivery days"
            type="number"
            min={0}
            max={90}
            value={form.estimateMinDays}
            onChange={(value) => set("estimateMinDays", Math.min(90, Math.max(0, Number(value) || 0)))}
          />
          <Field
            label="Maximum delivery days"
            type="number"
            min={0}
            max={90}
            value={form.estimateMaxDays}
            onChange={(value) => set("estimateMaxDays", Math.min(90, Math.max(0, Number(value) || 0)))}
          />
          <Toggle
            label="Show delivery estimate"
            hint="Displays the Min–Max day estimate at checkout."
            checked={form.showEstimatedDelivery}
            onChange={(checked) => set("showEstimatedDelivery", checked)}
          />
          <Field
            label="Tax percent"
            type="number"
            min={0}
            max={50}
            value={form.taxPercent}
            onChange={(value) => set("taxPercent", Math.min(50, Math.max(0, Number(value) || 0)))}
          />
          <Toggle
            label="Apply tax"
            hint="Adds or includes the tax percent in order totals."
            checked={form.taxEnabled}
            onChange={(checked) => set("taxEnabled", checked)}
          />
          <Toggle
            label="Tax already included"
            hint="Prices shown already contain tax when this is on."
            checked={form.taxInclusive}
            onChange={(checked) => set("taxInclusive", checked)}
          />
          <Field
            label="Cancellation window (hours)"
            type="number"
            min={0}
            max={720}
            value={form.cancelWindowHours}
            onChange={(value) => set("cancelWindowHours", Math.min(720, Math.max(0, Number(value) || 0)))}
          />
          <Toggle
            label="Allow order cancellation"
            hint="Customers can cancel within the window above."
            checked={form.allowCancellation}
            onChange={(checked) => set("allowCancellation", checked)}
          />
        </div>
      </section>

      <section className="mt-5 rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-[var(--dark-text)]">Pickup details</h3>
        <p className="mt-1 text-xs text-gray-500">
          Used on the order confirmation and for any pickup flows.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Name"
            value={form.pickupName}
            onChange={(value) => set("pickupName", value)}
          />
          <Field
            label="Contact name"
            value={form.pickupContactName}
            onChange={(value) => set("pickupContactName", value)}
          />
          <Field
            label="Contact phone"
            value={form.pickupContactPhone}
            onChange={(value) => set("pickupContactPhone", value)}
          />
          <Field
            label="Contact email"
            value={form.pickupEmail}
            onChange={(value) => set("pickupEmail", value)}
          />
          <Field
            label="Address line 1"
            value={form.pickupAddressLine1}
            onChange={(value) => set("pickupAddressLine1", value)}
          />
          <Field
            label="Address line 2"
            value={form.pickupAddressLine2}
            onChange={(value) => set("pickupAddressLine2", value)}
          />
          <Field
            label="City"
            value={form.pickupCity}
            onChange={(value) => set("pickupCity", value)}
          />
          <Field
            label="State"
            value={form.pickupState}
            onChange={(value) => set("pickupState", value)}
          />
          <Field
            label="Pincode"
            value={form.pickupPincode}
            onChange={(value) => set("pickupPincode", value)}
          />
          <Field
            label="Country"
            value={form.pickupCountry}
            onChange={(value) => set("pickupCountry", value)}
          />
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-full bg-[var(--jaggery-brown)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--natural-green)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save delivery settings"}
        </button>
        <p className="text-xs text-gray-500">
          Fees are whole rupees here and stored in paise. When no document exists yet, saving
          creates one.
        </p>
      </div>

      {result ? (
        <p
          className={`mt-4 rounded-md px-4 py-3 text-sm ${
            result.ok
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {result.text}
        </p>
      ) : null}
    </div>
  );
}