"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminImageUpload from "@/components/admin-image-upload";

export type ComboItemRow = {
  slug: string;
  name: string;
  quantity: number;
};

export type AdminComboRow = {
  id: string;
  name: string;
  description: string;
  image: string;
  priceInr: number;
  mrpInr: number | null;
  items: ComboItemRow[];
  isActive: boolean;
  isFeatured: boolean;
  showOnHomepage: boolean;
  showOnProducts: boolean;
  sortOrder: number;
};

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-sm text-[var(--dark-text)] focus:border-[var(--ginger-terracotta)] focus:outline-none";

const emptyForm = {
  name: "",
  description: "",
  priceInr: "",
  mrpInr: "",
  sortOrder: "0",
};

function equalItems(a: ComboItemRow[], b: ComboItemRow[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function ItemRows({
  items,
  options,
  onChange,
}: {
  items: ComboItemRow[];
  options: { slug: string; name: string }[];
  onChange: (items: ComboItemRow[]) => void;
}) {
  const setItem = (index: number, patch: Partial<ComboItemRow>) =>
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));

  const addItem = () => onChange([...items, { slug: "", name: "", quantity: 1 }]);

  const removeItem = (index: number) => onChange(items.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <select
              className={`${inputClass} min-w-40 flex-1`}
              value={item.slug}
              onChange={(e) => {
                const slug = e.target.value;
                const option = options.find((entry) => entry.slug === slug);
                setItem(index, { slug, name: option?.name ?? "" });
              }}
            >
              <option value="">Select a product…</option>
              {options.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name} ({option.slug})
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500">×</span>
            <input
              className={`${inputClass} w-20`}
              type="number"
              min="1"
              max="99"
              value={item.quantity}
              aria-label="Quantity of this item in the combo"
              onChange={(e) =>
                setItem(index, { quantity: Math.min(99, Math.max(1, Number(e.target.value) || 1)) })
              }
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              disabled={items.length === 1}
              className="rounded-full border border-red-200 px-2 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Remove this item from the combo"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="mt-2 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
      >
        Add item
      </button>
    </div>
  );
}

/**
 * Combo manager. A combo is a priced bundle of catalogue products that
 * appears in the storefront COMBOS sections. Creating one copies nothing —
 * the item rows are labels used for display, while charging always reads the
 * combo's own price from the same collection.
 *
 * Two-step delete: "Delete" then "Confirm delete", because a live combo
 * disappears from the storefront and any cart copy stops resolving.
 */
export default function AdminComboEditor({
  combos,
  productOptions,
}: {
  combos: AdminComboRow[];
  productOptions: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState(combos);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "save" | "create" | "delete">(null);
  const [form, setForm] = useState(emptyForm);
  const [formImage, setFormImage] = useState("");
  const [formItems, setFormItems] = useState<ComboItemRow[]>([{ slug: "", name: "", quantity: 1 }]);
  const [formFlags, setFormFlags] = useState({
    isActive: true,
    isFeatured: false,
    showOnHomepage: true,
    showOnProducts: true,
  });
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const toggleExpand = (id: string) =>
    setExpanded((current) => (current === id ? null : id));

  const setCombo = (id: string, patch: Partial<AdminComboRow>) =>
    setDrafts((current) =>
      current.map((combo) => (combo.id === id ? { ...combo, ...patch } : combo))
    );

  const save = async () => {
    setBusy("save");
    setResult(null);
    try {
      for (const combo of drafts) {
        const original = combos.find((entry) => entry.id === combo.id);
        if (!original) continue;

        const changed: Record<string, unknown> = {};
        if (combo.name !== original.name) changed.name = combo.name;
        if (combo.description !== original.description) changed.description = combo.description;
        if (combo.image !== original.image) changed.image = combo.image;
        if (combo.priceInr !== original.priceInr) changed.priceInr = combo.priceInr;
        if (combo.mrpInr !== original.mrpInr) changed.mrpInr = combo.mrpInr;
        if (!equalItems(combo.items, original.items)) changed.items = combo.items;
        if (combo.isActive !== original.isActive) changed.isActive = combo.isActive;
        if (combo.isFeatured !== original.isFeatured) changed.isFeatured = combo.isFeatured;
        if (combo.showOnHomepage !== original.showOnHomepage) changed.showOnHomepage = combo.showOnHomepage;
        if (combo.showOnProducts !== original.showOnProducts) changed.showOnProducts = combo.showOnProducts;
        if (combo.sortOrder !== original.sortOrder) changed.sortOrder = combo.sortOrder;

        if (Object.keys(changed).length === 0) continue;

        const response = await fetch(`/api/admin/combos/${combo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changed),
        });
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Combo update failed.");
      }
      setResult({ ok: true, text: "All changes saved. The storefront shows them now." });
      router.refresh();
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : "Save failed." });
    } finally {
      setBusy(null);
    }
  };

  const create = async () => {
    setBusy("create");
    setResult(null);
    try {
      const response = await fetch("/api/admin/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || "",
          image: formImage,
          priceInr: Number(form.priceInr),
          mrpInr: form.mrpInr ? Number(form.mrpInr) : null,
          items: formItems.filter((item) => item.slug),
          ...formFlags,
          sortOrder: Number(form.sortOrder || "0"),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Create failed.");
      setForm(emptyForm);
      setFormImage("");
      setFormItems([{ slug: "", name: "", quantity: 1 }]);
      setFormFlags({ isActive: true, isFeatured: false, showOnHomepage: true, showOnProducts: true });
      setResult({ ok: true, text: "Combo created and published to the storefront." });
      router.refresh();
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : "Create failed." });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy("delete");
    setResult(null);
    try {
      const response = await fetch(`/api/admin/combos/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Delete failed.");
      setDrafts((current) => current.filter((combo) => combo.id !== id));
      if (expanded === id) setExpanded(null);
      setDeleteTarget(null);
      setResult({ ok: true, text: "Combo deleted." });
      router.refresh();
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : "Delete failed." });
    } finally {
      setBusy(null);
    }
  };

  const createDisabled =
    busy !== null ||
    !form.name.trim() ||
    !form.priceInr ||
    !formImage ||
    formItems.some((item) => !item.slug);

  const createNote = !form.name.trim()
    ? "A name is required."
    : !form.priceInr
      ? "A selling price is required."
      : !formImage
        ? "A photo is required."
        : formItems.some((item) => !item.slug) || formItems.length === 0
          ? "Every item needs a product chosen from the list."
          : null;

  return (
    <div>
      <section className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-[var(--dark-text)]">Add a combo</h3>
        <p className="mt-1 text-xs text-gray-500">
          A combo is a priced bundle of catalogue products. Choose the products, set a bundle
          price, and publish it — the storefront COMBOS sections and checkout pick it up.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Name</span>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              placeholder="Two-Jar Trial Pack"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Selling price (₹)</span>
            <input
              className={inputClass}
              type="number"
              min="1"
              value={form.priceInr}
              onChange={(e) => setForm((c) => ({ ...c, priceInr: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">MRP (₹) — optional</span>
            <input
              className={inputClass}
              type="number"
              min="1"
              value={form.mrpInr}
              onChange={(e) => setForm((c) => ({ ...c, mrpInr: e.target.value }))}
              placeholder="Strike-through price"
            />
          </label>
          <label className="block sm:col-span-2 lg:col-span-3">
            <span className="mb-1 block text-xs font-medium text-gray-600">Description</span>
            <textarea
              className={`${inputClass} resize-y`}
              rows={2}
              value={form.description}
              onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
              placeholder="Shown on the COMBOS cards."
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <span className="mb-1 block text-xs font-medium text-gray-600">Items in this combo</span>
            <ItemRows items={formItems} options={productOptions} onChange={setFormItems} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <span className="mb-1 block text-xs font-medium text-gray-600">Photo</span>
            <div className="flex flex-wrap items-center gap-3">
              <AdminImageUpload
                folder="combos"
                value={formImage}
                onChange={setFormImage}
                label={formImage ? "Change photo" : "Upload photo"}
              />
              {formImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin panel thumb
                <img
                  src={formImage}
                  alt=""
                  className="h-14 w-14 rounded-md border border-black/10 object-cover"
                />
              ) : (
                <span className="text-[11px] text-gray-400">Required before publishing.</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFormFlags((c) => ({ ...c, isActive: !c.isActive }))}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
          >
            {formFlags.isActive ? "Active (publish)" : "Draft (hidden)"}
          </button>
          <button
            type="button"
            onClick={() => setFormFlags((c) => ({ ...c, showOnHomepage: !c.showOnHomepage }))}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
          >
            {formFlags.showOnHomepage ? "Shown on homepage" : "Hidden on homepage"}
          </button>
          <button
            type="button"
            onClick={() => setFormFlags((c) => ({ ...c, showOnProducts: !c.showOnProducts }))}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
          >
            {formFlags.showOnProducts ? "Shown on products page" : "Hidden on products page"}
          </button>
          <label className="ml-auto flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Position</span>
            <input
              className={`${inputClass} w-20`}
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(e) => setForm((c) => ({ ...c, sortOrder: e.target.value }))}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={create}
          disabled={busy !== null || createDisabled}
          className="mt-4 rounded-full bg-[var(--jaggery-brown)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--natural-green)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "create" ? "Creating…" : "Add combo"}
        </button>
        {createDisabled && createNote ? (
          <p className="mt-2 text-xs text-amber-700">{createNote}</p>
        ) : null}
      </section>

      <div className="mt-6 space-y-4">
        {combos.length === 0 ? (
          <div className="rounded-lg bg-white p-10 text-center shadow">
            <p className="text-gray-600">No combos yet. Create the first one above.</p>
          </div>
        ) : (
          drafts.map((combo) => (
            <article key={combo.id} className="rounded-lg bg-white shadow">
              <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
                <span className="flex min-w-0 items-center gap-3">
                  {combo.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin panel thumb
                    <img
                      src={combo.image}
                      alt=""
                      className="h-12 w-12 flex-shrink-0 rounded-md border border-black/10 object-cover"
                    />
                  ) : (
                    <span className="h-12 w-12 flex-shrink-0 rounded-md border border-dashed border-black/10" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-base font-bold text-[var(--jaggery-brown)]">
                      {combo.name}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {combo.items.length} {combo.items.length === 1 ? "item" : "items"} &middot; ₹
                      {combo.priceInr}
                    </span>
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {combo.isActive ? (
                    <span className="inline-block rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold uppercase text-green-800">
                      live
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold uppercase text-gray-700">
                      hidden
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleExpand(combo.id)}
                    disabled={busy !== null}
                    className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {expanded === combo.id ? "Close" : "Edit"}
                  </button>
                  {deleteTarget === combo.id ? (
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void remove(combo.id)}
                        disabled={busy !== null}
                        className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy === "delete" ? "Deleting…" : "Confirm delete"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(null)}
                        disabled={busy !== null}
                        className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(combo.id)}
                      disabled={busy !== null}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </span>
              </div>

              {expanded === combo.id ? (
                <div className="space-y-4 border-t border-black/5 px-6 py-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-gray-600">Name</span>
                      <input
                        className={inputClass}
                        value={combo.name}
                        onChange={(e) => setCombo(combo.id, { name: e.target.value })}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-gray-600">Selling price (₹)</span>
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        value={combo.priceInr}
                        onChange={(e) =>
                          setCombo(combo.id, { priceInr: Number(e.target.value) || 0 })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-gray-600">MRP (₹)</span>
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        value={combo.mrpInr ?? ""}
                        placeholder="None"
                        onChange={(e) =>
                          setCombo(combo.id, {
                            mrpInr: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-gray-600">Position</span>
                      <input
                        className={inputClass}
                        type="number"
                        min="0"
                        value={combo.sortOrder}
                        onChange={(e) =>
                          setCombo(combo.id, {
                            sortOrder: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </label>
                    <label className="block sm:col-span-2 lg:col-span-4">
                      <span className="mb-1 block text-xs font-medium text-gray-600">Description</span>
                      <textarea
                        className={`${inputClass} resize-y`}
                        rows={2}
                        value={combo.description}
                        onChange={(e) => setCombo(combo.id, { description: e.target.value })}
                      />
                    </label>
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-medium text-gray-600">
                      Items in this combo
                    </span>
                    <ItemRows
                      items={combo.items}
                      options={productOptions}
                      onChange={(items) => setCombo(combo.id, { items })}
                    />
                  </div>

                  <div className="rounded-md border border-black/5 bg-gray-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-[var(--dark-text)]">Photo</p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          Served from Cloudinary. This is the card artwork in the COMBOS sections.
                        </p>
                      </div>
                      <AdminImageUpload
                        folder="combos"
                        value=""
                        onChange={(url) => setCombo(combo.id, { image: url })}
                        label={combo.image ? "Replace photo" : "Add photo"}
                      />
                    </div>
                    {combo.image ? (
                      <div className="mt-3 flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element -- admin panel thumb */}
                        <img
                          src={combo.image}
                          alt=""
                          className="h-32 w-32 rounded-md border border-black/10 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setCombo(combo.id, { image: "" })}
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                        >
                          Remove photo
                        </button>
                        <input
                          className={`${inputClass} mt-0.5 flex-1 font-mono text-xs`}
                          value={combo.image}
                          onChange={(e) => setCombo(combo.id, { image: e.target.value })}
                          aria-label="Photo URL"
                          placeholder="Or paste a Cloudinary URL"
                        />
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] text-gray-400">
                        No photo yet — the combo will not publish without one.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCombo(combo.id, { isActive: !combo.isActive })}
                      className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
                    >
                      {combo.isActive ? "Hide from storefront" : "Publish to storefront"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCombo(combo.id, { isFeatured: !combo.isFeatured })}
                      className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
                    >
                      {combo.isFeatured ? "Unmark featured" : "Mark featured"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCombo(combo.id, { showOnHomepage: !combo.showOnHomepage })}
                      className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
                    >
                      {combo.showOnHomepage ? "On homepage" : "Off homepage"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCombo(combo.id, { showOnProducts: !combo.showOnProducts })}
                      className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
                    >
                      {combo.showOnProducts ? "On products page" : "Off products page"}
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={busy !== null}
          className="rounded-full bg-[var(--jaggery-brown)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--natural-green)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "save" ? "Saving…" : "Save all changes"}
        </button>
        <p className="text-xs text-gray-500">
          Prices are whole rupees here and stored in paise, like the rest of the catalogue.
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