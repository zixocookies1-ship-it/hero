"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminCouponData = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minimumOrderAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
};

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[var(--dark-text)] focus:border-[var(--ginger-terracotta)] focus:outline-none";

const emptyForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minimumOrderAmount: "",
  usageLimit: "",
  expiresAt: "",
};

/**
 * Coupon manager: create a code, and turn it off when it should stop working.
 * There is deliberately no delete — deactivating is the supported way to retire
 * a coupon, because one that was ever used must stay on record with the orders
 * it discounted.
 */
export default function AdminCouponEditor({
  coupons,
}: {
  coupons: AdminCouponData[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (name: keyof typeof emptyForm, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));

  const create = async () => {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: form.discountValue ? Number(form.discountValue) : null,
          minimumOrderAmount: form.minimumOrderAmount
            ? Number(form.minimumOrderAmount)
            : null,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          expiresAt: form.expiresAt || null,
          active: true,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Create failed.");
      setForm(emptyForm);
      setResult({ ok: true, text: "Coupon created and activated." });
      router.refresh();
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : "Create failed." });
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (coupon: AdminCouponData) => {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !coupon.active }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Update failed.");
      setResult({
        ok: true,
        text: coupon.active
          ? `Coupon ${coupon.code} is now deactivated.`
          : `Coupon ${coupon.code} is now active.`,
      });
      router.refresh();
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : "Update failed." });
    } finally {
      setBusy(false);
    }
  };

  const describe = (coupon: AdminCouponData) =>
    coupon.discountType === "percentage"
      ? `${coupon.discountValue}% off`
      : `₹${coupon.discountValue} off`;

  return (
    <div>
      <section className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-[var(--dark-text)]">Create a coupon</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Code</span>
            <input
              className={inputClass}
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="WELCOME10"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Type</span>
            <select
              className={inputClass}
              value={form.discountType}
              onChange={(e) => set("discountType", e.target.value)}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Value</span>
            <input
              className={inputClass}
              type="number"
              min="1"
              value={form.discountValue}
              onChange={(e) => set("discountValue", e.target.value)}
              placeholder={form.discountType === "percentage" ? "10" : "50"}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              Minimum order (₹)
            </span>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={form.minimumOrderAmount}
              onChange={(e) => set("minimumOrderAmount", e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Usage limit</span>
            <input
              className={inputClass}
              type="number"
              min="1"
              value={form.usageLimit}
              onChange={(e) => set("usageLimit", e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Expires</span>
            <input
              className={inputClass}
              type="date"
              value={form.expiresAt}
              onChange={(e) => set("expiresAt", e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={create}
          disabled={busy || !form.code.trim()}
          className="mt-4 rounded-full bg-[var(--jaggery-brown)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--natural-green)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Working…" : "Create coupon"}
        </button>
      </section>

      <div className="mt-6 overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Discount</th>
              <th className="px-4 py-3 font-semibold">Minimum order</th>
              <th className="px-4 py-3 font-semibold">Usage</th>
              <th className="px-4 py-3 font-semibold">Expires</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-black/5">
                <td className="px-4 py-3 font-mono font-semibold">{coupon.code}</td>
                <td className="px-4 py-3">{describe(coupon)}</td>
                <td className="px-4 py-3">
                  {coupon.minimumOrderAmount === null
                    ? "—"
                    : `₹${coupon.minimumOrderAmount}`}
                </td>
                <td className="px-4 py-3">
                  {coupon.usedCount}
                  {coupon.usageLimit === null ? "" : ` of ${coupon.usageLimit}`}
                </td>
                <td className="px-4 py-3">
                  {coupon.expiresAt
                    ? new Date(coupon.expiresAt).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                      coupon.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {coupon.active ? "active" : "inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(coupon)}
                    disabled={busy}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {coupon.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No coupons yet. Use the form above to create the first one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
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