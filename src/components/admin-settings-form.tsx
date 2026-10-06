"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminSettingsData = {
  id: string;
  brandName: string;
  tagline: string;
  announcement: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  instagramHandle: string;
  twitterHandle: string;
  legalName: string;
  gstNumber: string;
  fssaiNumber: string;
  cinNumber: string;
  businessAddressLine1: string;
  businessAddressLine2: string;
  businessCity: string;
  businessState: string;
  businessPincode: string;
  businessCountry: string;
  businessHours: string;
  razorpayDisplayName: string;
  social: { instagram: string; youtube: string; facebook: string };
};

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[var(--dark-text)] focus:border-[var(--ginger-terracotta)] focus:outline-none";

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <input
        className={inputClass}
        type={type}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  );
}

/**
 * Edits the single businesssettings document the storefront reads for brand,
 * contact and address details. Saving PATCHes the stored settings and the
 * storefront picks the new values up on the next request.
 */
export default function AdminSettingsForm({ initial }: { initial: AdminSettingsData }) {
  const router = useRouter();
  const [values, setValues] = useState({ ...initial, social: { ...initial.social } });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const setField = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));

  const setSocial = (name: string, value: string) =>
    setValues((current) => ({ ...current, social: { ...current.social, [name]: value } }));

  const save = async () => {
    setSaving(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: values.brandName,
          tagline: values.tagline,
          announcement: values.announcement,
          supportEmail: values.supportEmail,
          supportPhone: values.supportPhone,
          whatsappNumber: values.whatsappNumber,
          instagramHandle: values.instagramHandle,
          twitterHandle: values.twitterHandle,
          legalName: values.legalName,
          gstNumber: values.gstNumber,
          fssaiNumber: values.fssaiNumber,
          cinNumber: values.cinNumber,
          businessAddressLine1: values.businessAddressLine1,
          businessAddressLine2: values.businessAddressLine2,
          businessCity: values.businessCity,
          businessState: values.businessState,
          businessPincode: values.businessPincode,
          businessCountry: values.businessCountry,
          businessHours: values.businessHours,
          razorpayDisplayName: values.razorpayDisplayName,
          social: values.social,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Save failed.");
      setResult({ ok: true, text: "Settings saved. The storefront shows these immediately." });
      router.refresh();
    } catch (error) {
      setResult({
        ok: false,
        text: error instanceof Error ? error.message : "Save failed.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-semibold text-[var(--dark-text)]">Brand</h3>
          <p className="mb-4 mt-1 text-xs text-gray-500">
            These feed the navbar, footer, product pages and receipts.
          </p>
          <div className="space-y-4">
            <Field label="Brand name" name="brandName" value={values.brandName} onChange={setField} />
            <Field label="Tagline" name="tagline" value={values.tagline} onChange={setField} />
            <Field label="Announcement bar" name="announcement" value={values.announcement} onChange={setField} />
            <Field label="Razorpay display name" name="razorpayDisplayName" value={values.razorpayDisplayName} onChange={setField} />
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-semibold text-[var(--dark-text)]">Support</h3>
          <p className="mb-4 mt-1 text-xs text-gray-500">
            The WhatsApp number answers the floating chat button and the contact form hand-off.
          </p>
          <div className="space-y-4">
            <Field label="Support email" name="supportEmail" value={values.supportEmail} onChange={setField} type="email" />
            <Field label="Support phone" name="supportPhone" value={values.supportPhone} onChange={setField} />
            <Field label="WhatsApp number (country code, no +)" name="whatsappNumber" value={values.whatsappNumber} onChange={setField} />
            <Field label="Business hours" name="businessHours" value={values.businessHours} onChange={setField} />
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-semibold text-[var(--dark-text)]">Registered address</h3>
          <p className="mb-4 mt-1 text-xs text-gray-500">Printed on invoices and the footer.</p>
          <div className="space-y-4">
            <Field label="Address line 1" name="businessAddressLine1" value={values.businessAddressLine1} onChange={setField} />
            <Field label="Address line 2" name="businessAddressLine2" value={values.businessAddressLine2} onChange={setField} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" name="businessCity" value={values.businessCity} onChange={setField} />
              <Field label="State" name="businessState" value={values.businessState} onChange={setField} />
              <Field label="Pincode" name="businessPincode" value={values.businessPincode} onChange={setField} />
              <Field label="Country" name="businessCountry" value={values.businessCountry} onChange={setField} />
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-semibold text-[var(--dark-text)]">Social</h3>
          <p className="mb-4 mt-1 text-xs text-gray-500">Full URLs for the footer icons.</p>
          <div className="space-y-4">
            <Field label="Instagram URL" name="instagram" value={values.social.instagram} onChange={setSocial} />
            <Field label="YouTube URL" name="youtube" value={values.social.youtube} onChange={setSocial} />
            <Field label="Facebook URL" name="facebook" value={values.social.facebook} onChange={setSocial} />
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--dark-text)]">Legal</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Legal name" name="legalName" value={values.legalName} onChange={setField} />
            <Field label="GST number" name="gstNumber" value={values.gstNumber} onChange={setField} />
            <Field label="FSSAI number" name="fssaiNumber" value={values.fssaiNumber} onChange={setField} />
            <Field label="CIN" name="cinNumber" value={values.cinNumber} onChange={setField} />
          </div>
        </section>
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

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-6 rounded-full bg-[var(--jaggery-brown)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--natural-green)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}