"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type AdminOrderFulfilmentData = {
  orderId: string;
  orderStatus: string;
  trackingNumber: string | null;
  deliveryNotes: string | null;
};

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-xs text-[var(--dark-text)] focus:border-[var(--ginger-terracotta)] focus:outline-none";

/**
 * Fulfilment controls for one order: the status in the journey from confirmed
 * to delivered, plus the tracking number and notes. Saving never touches the
 * payment side — that is decided by the Razorpay flow.
 */
export default function AdminOrderFulfilment({ order }: { order: AdminOrderFulfilmentData }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.orderStatus);
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [notes, setNotes] = useState(order.deliveryNotes ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<"ok" | "err" | null>(null);

  const dirty =
    status !== order.orderStatus ||
    tracking !== (order.trackingNumber ?? "") ||
    notes !== (order.deliveryNotes ?? "");

  const save = async () => {
    if (!dirty) return;
    setBusy(true);
    setSaved(null);
    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.orderId)}/fulfilment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderStatus: status,
            trackingNumber: tracking,
            deliveryNotes: notes,
          }),
        }
      );
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Update failed.");
      setSaved("ok");
      router.refresh();
    } catch (error) {
      setSaved("err");
      console.error("order fulfilment save failed", error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <select
        className={inputClass}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {value.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <input
        className={inputClass}
        value={tracking}
        placeholder="Tracking number"
        onChange={(e) => setTracking(e.target.value)}
      />
      <input
        className={inputClass}
        value={notes}
        placeholder="Delivery notes"
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        {saved === "ok" ? (
          <span className="text-[11px] font-medium text-green-700">Saved</span>
        ) : saved === "err" ? (
          <span className="text-[11px] font-medium text-red-600">Failed</span>
        ) : null}
      </div>
    </div>
  );
}