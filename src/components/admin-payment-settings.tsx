"use client";

import { useEffect, useState } from "react";

/**
 * Editable payment settings panel. Two things can differ from the checkout
 * code here: whether Razorpay orders are accepted at all, and the display name
 * shown on the Razorpay sheet. Both live in the settings document, so the
 * owner can pause online orders without touching code or credentials.
 *
 * Credentials never leave the server: this panel shows a masked key id from a
 * read-only status endpoint and a presence check for the secret, and the
 * "test" call asks the server to talk to Razorpay, not the browser.
 */
export default function AdminPaymentSettings({
  initialOnlinePaymentsEnabled,
  initialDisplayName,
}: {
  initialOnlinePaymentsEnabled: boolean;
  initialDisplayName: string;
}) {
  const [enabled, setEnabled] = useState(initialOnlinePaymentsEnabled);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [maskedKeyId, setMaskedKeyId] = useState<string | null>(null);
  const [credentialsConfigured, setCredentialsConfigured] = useState<boolean>(false);
  const [busy, setBusy] = useState<null | "save" | "test">(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/payments/status")
      .then((response) => response.json().catch(() => ({})))
      .then((data: { keyId?: string | null; configured?: boolean }) => {
        if (cancelled) return;
        setMaskedKeyId(data.keyId ?? null);
        setCredentialsConfigured(Boolean(data.configured));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setBusy("save");
    setResult(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onlinePaymentEnabled: enabled,
          razorpayDisplayName: displayName,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Save failed.");
      setResult({ ok: true, text: "Payment settings saved. The checkout reflects them now." });
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : "Save failed." });
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy("test");
    setResult(null);
    try {
      const response = await fetch("/api/admin/payments/test", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "The connection test failed.");
      }
      setResult({
        ok: true,
        text: "Razorpay accepted a request with the configured keys.",
      });
    } catch (error) {
      setResult({
        ok: false,
        text: error instanceof Error ? error.message : "The connection test failed.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-6 rounded-lg bg-white p-6 shadow">
      <h3 className="text-sm font-semibold text-[var(--dark-text)]">Gateway</h3>
      <dl className="mt-2 divide-y divide-black/5">
        <div className="border-b border-black/5 py-3">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Razorpay key id</dt>
          <dd className="mt-1 text-sm text-[var(--dark-text)]">
            {maskedKeyId ? (
              <span className="font-mono">{maskedKeyId}</span>
            ) : credentialsConfigured ? (
              "configured"
            ) : (
              <span className="text-gray-400">not configured on the server</span>
            )}
          </dd>
        </div>
        <div className="border-b border-black/5 py-3">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Razorpay key secret</dt>
          <dd className="mt-1 text-sm text-[var(--dark-text)]">
            {credentialsConfigured ? (
              "configured on the server"
            ) : (
              <span className="text-gray-400">not configured on the server</span>
            )}
          </dd>
        </div>
        <div className="border-b border-black/5 py-3">
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Online payments
          </dt>
          <dd className="mt-1">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--dark-text)]">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 accent-[var(--jaggery-brown)]"
              />
              Accept Razorpay payments on checkout
            </label>
            <p className="mt-1 text-xs text-gray-500">
              When off, orders cannot be started and the checkout shows a WhatsApp prompt instead.
            </p>
          </dd>
        </div>
        <div className="border-b border-black/5 py-3">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Razorpay display name</dt>
          <dd className="mt-1">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nature's Choice Jaggery"
              className="w-full max-w-sm rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[var(--dark-text)] focus:border-[var(--ginger-terracotta)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Shown to the customer on the Razorpay payment sheet.
            </p>
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy !== null}
          className="rounded-full bg-[var(--jaggery-brown)] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--natural-green)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "save" ? "Saving…" : "Save payment settings"}
        </button>
        <button
          type="button"
          onClick={test}
          disabled={busy !== null}
          className="rounded-full border border-black/10 px-6 py-2 text-sm font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "test" ? "Testing…" : "Test connection"}
        </button>
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

      <p className="mt-4 text-xs text-gray-500">
        Credentials are environment variables on the server, never stored in or read out of the
        database. To change them, update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the host and
        redeploy.
      </p>
    </div>
  );
}