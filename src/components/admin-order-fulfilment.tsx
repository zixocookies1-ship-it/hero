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
  paymentVerified: boolean;
};

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-xs text-[var(--dark-text)] focus:border-[var(--ginger-terracotta)] focus:outline-none";

type DelhiveryResult = {
  ok: boolean;
  text: string;
};

/**
 * Fulfilment controls for one order: the status in the journey from confirmed
 * to delivered, plus the tracking number, notes, and the two Delhivery actions —
 * booking a shipment (which creates a real packet and stores its AWB) and
 * fetching its latest scans. Saving never touches the payment side, which is
 * decided by the Razorpay flow.
 */
export default function AdminOrderFulfilment({ order }: { order: AdminOrderFulfilmentData }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.orderStatus);
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [notes, setNotes] = useState(order.deliveryNotes ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<"ok" | "err" | null>(null);
  const [delhivery, setDelhivery] = useState<DelhiveryResult | null>(null);
  const [trackingDetail, setTrackingDetail] = useState<{
    awb: string;
    status: string;
    scans: Array<{ location: string; scan: string; timestamp: string }>;
  } | null>(null);

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

  const bookDelhivery = async () => {
    setBusy(true);
    setDelhivery(null);
    setTrackingDetail(null);
    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.orderId)}/fulfilment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "bookDelhivery" }),
        }
      );
      const payload = (await response.json().catch(() => ({}))) as {
        awb?: string;
        error?: string;
      };
      if (!response.ok || !payload.awb) {
        setDelhivery({ ok: false, text: payload.error ?? "Booking failed." });
      } else {
        setDelhivery({
          ok: true,
          text: `Shipment booked. AWB ${payload.awb} saved as the tracking number.`,
        });
        setTracking(payload.awb);
        router.refresh();
      }
    } catch (error) {
      setDelhivery({ ok: false, text: error instanceof Error ? error.message : "Booking failed." });
    } finally {
      setBusy(false);
    }
  };

  const trackDelhivery = async () => {
    setBusy(true);
    setDelhivery(null);
    setTrackingDetail(null);
    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.orderId)}/fulfilment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "trackDelhivery" }),
        }
      );
      const payload = (await response.json().catch(() => ({}))) as {
        awb?: string;
        status?: string;
        scans?: Array<{ location: string; scan: string; timestamp: string }>;
        error?: string;
      };
      if (!response.ok) {
        setDelhivery({ ok: false, text: payload.error ?? "Tracking failed." });
      } else {
        setTrackingDetail({
          awb: payload.awb ?? "",
          status: payload.status ?? "",
          scans: Array.isArray(payload.scans) ? payload.scans : [],
        });
      }
    } catch (error) {
      setDelhivery({ ok: false, text: error instanceof Error ? error.message : "Tracking failed." });
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
        placeholder="Tracking number / AWB"
        onChange={(e) => setTracking(e.target.value)}
      />
      <input
        className={inputClass}
        value={notes}
        placeholder="Delivery notes"
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={bookDelhivery}
          disabled={busy || !order.paymentVerified}
          title={
            order.paymentVerified
              ? "Create a real Delhivery packet for this order"
              : "Only verified paid orders can be shipped"
          }
          className="rounded-full bg-[var(--jaggery-brown)] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[var(--natural-green)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Booking…" : "Book Delhivery shipment"}
        </button>
        <button
          type="button"
          onClick={trackDelhivery}
          disabled={busy}
          className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Track AWB
        </button>
        {saved === "ok" ? (
          <span className="text-[11px] font-medium text-green-700">Saved</span>
        ) : saved === "err" ? (
          <span className="text-[11px] font-medium text-red-600">Failed</span>
        ) : null}
      </div>
      {order.trackingNumber ? (
        <p className="font-mono text-[11px] text-gray-500">
          AWB {order.trackingNumber}
        </p>
      ) : null}
      {delhivery ? (
        <p
          className={`rounded px-2 py-1 text-[11px] font-medium ${
            delhivery.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
          }`}
        >
          {delhivery.text}
        </p>
      ) : null}
      {trackingDetail ? (
        <div className="rounded-md border border-black/5 bg-gray-50 p-2 text-[11px]">
          <p className="font-semibold text-[var(--dark-text)]">
            AWB {trackingDetail.awb}
            {trackingDetail.status ? ` · ${trackingDetail.status}` : ""}
          </p>
          {trackingDetail.scans.length === 0 ? (
            <p className="mt-1 text-gray-500">No scans yet.</p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-gray-600">
              {trackingDetail.scans.map((scan, index) => (
                <li key={index}>
                  {scan.timestamp ? `${scan.timestamp} — ` : ""}
                  {scan.scan}
                  {scan.location ? ` (${scan.location})` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}