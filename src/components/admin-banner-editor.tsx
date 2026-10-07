"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminImageUpload from "@/components/admin-image-upload";

export type AdminBannerEntry = {
  key: string;
  label: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  body: string;
  body2: string;
  image: string;
  imageMobile: string;
  itemsJson: string;
  linksJson: string;
};

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[var(--dark-text)] focus:border-[var(--ginger-terracotta)] focus:outline-none";

function parseJsonList(raw: string, name: string): { ok: true; value: unknown[] } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: [] };
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return { ok: false, error: `${name} must be a JSON list.` };
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: `${name} is not valid JSON.` };
  }
}

function ImageField({
  label,
  value,
  hint,
  onChange,
}: {
  label: string;
  value: string;
  hint?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label}
        {hint ? <span className="ml-1 text-gray-400">{hint}</span> : null}
      </span>
      <input
        className={inputClass}
        value={value}
        placeholder="Paste a URL, or upload a photo below"
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <AdminImageUpload
          folder="banners"
          value={value}
          onChange={onChange}
          label={value ? "Replace photo" : "Upload photo"}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            Remove
          </button>
        ) : (
          <span className="text-[11px] text-gray-400">
            Empty means the store ships its default artwork here.
          </span>
        )}
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin panel banner preview
        <img
          src={value}
          alt=""
          className="mt-3 h-28 w-full rounded-md border border-black/10 object-cover"
        />
      ) : null}
    </label>
  );
}

/**
 * Editor for every section of storefront copy. Each section expands to text
 * fields for the headline copy plus JSON editors for its bullet list and CTA
 * links (their shapes differ per section, which is exactly why they are stored
 * as JSON). Saving writes the section straight to MongoDB.
 *
 * Reset restores the section to the copy the store shipped with: the API
 * deletes the document, and every section component falls back to its shipped
 * content when its document is missing.
 */
export default function AdminBannerEditor({ sections }: { sections: AdminBannerEntry[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState(sections);
  const [busy, setBusy] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const update = (key: string, patch: Partial<AdminBannerEntry>) =>
    setDrafts((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry))
    );

  const save = async (entry: AdminBannerEntry) => {
    setBusy(entry.key);
    setResult(null);

    const items = parseJsonList(entry.itemsJson, "Items");
    if (!items.ok) {
      setResult({ ok: false, text: items.error });
      setBusy(null);
      return;
    }
    const links = parseJsonList(entry.linksJson, "Links");
    if (!links.ok) {
      setResult({ ok: false, text: links.error });
      setBusy(null);
      return;
    }

    try {
      const response = await fetch(`/api/admin/sections/${encodeURIComponent(entry.key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: entry.label,
          eyebrow: entry.eyebrow,
          title: entry.title,
          titleAccent: entry.titleAccent,
          body: entry.body,
          body2: entry.body2,
          image: entry.image,
          imageMobile: entry.imageMobile,
          items: items.value,
          links: links.value,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Save failed.");
      setResult({
        ok: true,
        text: `"${entry.label || entry.key}" saved. The storefront shows it now.`,
      });
      router.refresh();
    } catch (error) {
      setResult({
        ok: false,
        text: error instanceof Error ? error.message : "Save failed.",
      });
    } finally {
      setBusy(null);
    }
  };

  const reset = async (entry: AdminBannerEntry) => {
    setBusy(entry.key);
    setResult(null);
    try {
      const response = await fetch(`/api/admin/sections/${encodeURIComponent(entry.key)}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Reset failed.");
      setResetTarget(null);
      setResult({
        ok: true,
        text: `"${entry.label || entry.key}" reset to the copy the store shipped with.`,
      });
      router.refresh();
    } catch (error) {
      setResult({
        ok: false,
        text: error instanceof Error ? error.message : "Reset failed.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {sections.length === 0 ? (
        <div className="rounded-lg bg-white p-10 text-center shadow">
          <p className="text-gray-600">
            The database answered, and the sections collection is empty — the storefront is
            showing its shipped copy for every section.
          </p>
        </div>
      ) : (
        drafts.map((entry) => (
          <details
            key={entry.key}
            className="group rounded-lg bg-white shadow"
            open={false}
          >
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-6 py-4">
              <span>
                <span className="font-serif text-base font-bold text-[var(--jaggery-brown)]">
                  {entry.label || entry.key}
                </span>
                <span className="ml-2 font-mono text-xs text-gray-500">{entry.key}</span>
              </span>
              <span
                className="text-xs text-gray-400 group-open:hidden"
              >
                Click to edit
              </span>
            </summary>

            <div className="border-t border-black/5 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">Eyebrow</span>
                  <input
                    className={inputClass}
                    value={entry.eyebrow}
                    onChange={(e) => update(entry.key, { eyebrow: e.target.value })}
                  />
                </label>
                <ImageField
                  label={`Desktop image${entry.key === "home_hero" ? " (wide banner)" : ""}`}
                  value={entry.image}
                  onChange={(url) => update(entry.key, { image: url })}
                />
                <ImageField
                  label="Mobile image"
                  hint={entry.key === "home_hero" ? "(square, optional)" : ""}
                  value={entry.imageMobile}
                  onChange={(url) => update(entry.key, { imageMobile: url })}
                />
                <label className="block lg:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-gray-600">
                    Title <span className="text-gray-400">(use the accent field for the coloured word)</span>
                  </span>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
                    <input
                      className={inputClass}
                      value={entry.title}
                      onChange={(e) => update(entry.key, { title: e.target.value })}
                    />
                    <input
                      className={`${inputClass} sm:w-48`}
                      value={entry.titleAccent}
                      placeholder="Accent word"
                      onChange={(e) => update(entry.key, { titleAccent: e.target.value })}
                    />
                  </div>
                </label>
                <label className="block lg:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-gray-600">Body</span>
                  <textarea
                    className={`${inputClass} min-h-[88px]`}
                    value={entry.body}
                    onChange={(e) => update(entry.key, { body: e.target.value })}
                  />
                </label>
                <label className="block lg:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-gray-600">Body 2</span>
                  <textarea
                    className={`${inputClass} min-h-[64px]`}
                    value={entry.body2}
                    onChange={(e) => update(entry.key, { body2: e.target.value })}
                  />
                </label>
                <label className="block lg:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-gray-600">
                    Items <span className="text-gray-400">(JSON list: cards, steps, FAQs, reviews)</span>
                  </span>
                  <textarea
                    className={`${inputClass} min-h-[120px] font-mono text-xs`}
                    value={entry.itemsJson}
                    onChange={(e) => update(entry.key, { itemsJson: e.target.value })}
                  />
                </label>
                <label className="block lg:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-gray-600">
                    Links <span className="text-gray-400">(JSON list of {"{label, href}"} buttons)</span>
                  </span>
                  <textarea
                    className={`${inputClass} min-h-[72px] font-mono text-xs`}
                    value={entry.linksJson}
                    onChange={(e) => update(entry.key, { linksJson: e.target.value })}
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => save(entry)}
                  disabled={busy !== null}
                  className="rounded-full bg-[var(--jaggery-brown)] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--natural-green)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy === entry.key ? "Saving…" : "Save section"}
                </button>
                {resetTarget === entry.key ? (
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => reset(entry)}
                      disabled={busy !== null}
                      className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy === entry.key ? "Resetting…" : "Confirm reset"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetTarget(null)}
                      disabled={busy !== null}
                      className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[var(--dark-text)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setResetTarget(entry.key)}
                    disabled={busy !== null}
                    className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reset to shipped copy
                  </button>
                )}
                {entry.body.includes("{{") ? (
                  <span className="text-xs text-amber-700">
                    This copy uses {"{{placeholders}}"} for live prices and shelf life — keep them.
                  </span>
                ) : null}
              </div>
            </div>
          </details>
        ))
      )}

      {result ? (
        <p
          className={`rounded-md px-4 py-3 text-sm ${
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