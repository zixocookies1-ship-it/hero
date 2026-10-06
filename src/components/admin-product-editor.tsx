"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminVariantData = {
  id: string;
  sku: string;
  weightLabel: string;
  weightGrams: number;
  packCount: number;
  priceInr: number;
  mrpInr: number | null;
  inventory: number;
  isActive: boolean;
};

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  flavour: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  variants: AdminVariantData[];
};

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-sm text-[var(--dark-text)] focus:border-[var(--ginger-terracotta)] focus:outline-none";

const emptyForm = {
  name: "",
  slug: "",
  flavour: "",
  priceInr: "",
  mrpInr: "",
  weightLabel: "",
  packCount: "1",
  inventory: "0",
};

/**
 * Product manager. Editing a price, MRP, inventory, weight or the publish flag
 * here changes what the storefront charges immediately, because the storefront
 * reads these collections on every request.
 *
 * "Hide" never deletes a document — this screen cannot destroy data, only
 * unpublish it, so removing a product stays reversible.
 */
export default function AdminProductEditor({ products }: { products: AdminProductRow[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState(products);
  const [busy, setBusy] = useState<null | "save" | "create">(null);
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const setProduct = (id: string, patch: Partial<AdminProductRow>) =>
    setDrafts((current) =>
      current.map((product) => (product.id === id ? { ...product, ...patch } : product))
    );

  const setVariant = (productId: string, variantId: string, patch: Partial<AdminVariantData>) =>
    setDrafts((current) =>
      current.map((product) =>
        product.id === productId
          ? {
              ...product,
              variants: product.variants.map((variant) =>
                variant.id === variantId ? { ...variant, ...patch } : variant
              ),
            }
          : product
      )
    );

  const save = async () => {
    setBusy("save");
    setResult(null);
    try {
      for (const product of drafts) {
        const original = products.find((entry) => entry.id === product.id);
        if (!original) continue;

        if (
          product.name !== original.name ||
          product.tagline !== original.tagline ||
          product.flavour !== original.flavour ||
          product.isActive !== original.isActive ||
          product.isFeatured !== original.isFeatured ||
          product.sortOrder !== original.sortOrder
        ) {
          const response = await fetch(`/api/admin/products/${product.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: product.name,
              tagline: product.tagline,
              flavour: product.flavour,
              isActive: product.isActive,
              isFeatured: product.isFeatured,
              sortOrder: product.sortOrder,
            }),
          });
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          if (!response.ok) throw new Error(payload.error ?? "Product update failed.");
        }

        for (const variant of product.variants) {
          const originalVariant = original.variants.find((entry) => entry.id === variant.id);
          if (!originalVariant) continue;

          if (
            variant.priceInr !== originalVariant.priceInr ||
            variant.mrpInr !== originalVariant.mrpInr ||
            variant.inventory !== originalVariant.inventory ||
            variant.isActive !== originalVariant.isActive ||
            variant.weightLabel !== originalVariant.weightLabel ||
            variant.weightGrams !== originalVariant.weightGrams ||
            variant.packCount !== originalVariant.packCount
          ) {
            const response = await fetch(
              `/api/admin/products/${product.id}/variants/${variant.id}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  priceInr: variant.priceInr,
                  mrpInr: variant.mrpInr,
                  inventory: variant.inventory,
                  isActive: variant.isActive,
                  weightLabel: variant.weightLabel,
                  weightGrams: variant.weightGrams,
                  packCount: variant.packCount,
                }),
              }
            );
            const payload = (await response.json().catch(() => ({}))) as { error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Variant update failed.");
          }
        }
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
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          flavour: form.flavour || null,
          priceInr: form.priceInr ? Number(form.priceInr) : null,
          mrpInr: form.mrpInr ? Number(form.mrpInr) : null,
          weightLabel: form.weightLabel || null,
          packCount: Number(form.packCount || "1"),
          inventory: Number(form.inventory || "0"),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Create failed.");
      setForm(emptyForm);
      setResult({ ok: true, text: "Product created and published with its first variant." });
      router.refresh();
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : "Create failed." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <section className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-[var(--dark-text)]">Add a product</h3>
        <p className="mt-1 text-xs text-gray-500">
          A slug is what the product URL uses (/products/&lt;slug&gt;) and cannot change later.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Name</span>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Slug</span>
            <input
              className={`${inputClass} font-mono`}
              value={form.slug}
              onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))}
              placeholder="new-jaggery-jar"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Flavour</span>
            <input
              className={inputClass}
              value={form.flavour}
              onChange={(e) => setForm((c) => ({ ...c, flavour: e.target.value }))}
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
            <span className="mb-1 block text-xs font-medium text-gray-600">MRP (₹)</span>
            <input
              className={inputClass}
              type="number"
              min="1"
              value={form.mrpInr}
              onChange={(e) => setForm((c) => ({ ...c, mrpInr: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Weight label</span>
            <input
              className={inputClass}
              value={form.weightLabel}
              onChange={(e) => setForm((c) => ({ ...c, weightLabel: e.target.value }))}
              placeholder="500g"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Pack count</span>
            <input
              className={inputClass}
              type="number"
              min="1"
              value={form.packCount}
              onChange={(e) => setForm((c) => ({ ...c, packCount: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Inventory</span>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={form.inventory}
              onChange={(e) => setForm((c) => ({ ...c, inventory: e.target.value }))}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={create}
          disabled={busy !== null || !form.name.trim() || !form.slug.trim() || !form.priceInr}
          className="mt-4 rounded-full bg-[var(--jaggery-brown)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--natural-green)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "create" ? "Creating…" : "Add product"}
        </button>
      </section>

      <div className="mt-6 space-y-4">
        {products.length === 0 ? (
          <div className="rounded-lg bg-white p-10 text-center shadow">
            <p className="text-gray-600">The database answered, and the products collection is empty.</p>
          </div>
        ) : (
          drafts.map((product) => (
            <details key={product.id} className="rounded-lg bg-white shadow">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-6 py-4">
                <span>
                  <span className="font-serif text-base font-bold text-[var(--jaggery-brown)]">
                    {product.name}
                  </span>
                  <span className="ml-2 font-mono text-xs text-gray-500">{product.slug}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                      product.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {product.isActive ? "live" : "hidden"}
                  </span>
                  {product.isFeatured ? (
                    <span className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase text-amber-800">
                      featured
                    </span>
                  ) : null}
                </span>
              </summary>

              <div className="space-y-4 border-t border-black/5 px-6 py-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">Name</span>
                    <input
                      className={inputClass}
                      value={product.name}
                      onChange={(e) => setProduct(product.id, { name: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">Tagline</span>
                    <input
                      className={inputClass}
                      value={product.tagline}
                      onChange={(e) => setProduct(product.id, { tagline: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">Flavour</span>
                    <input
                      className={inputClass}
                      value={product.flavour}
                      onChange={(e) => setProduct(product.id, { flavour: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">Sort order</span>
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      value={product.sortOrder}
                      onChange={(e) =>
                        setProduct(product.id, {
                          sortOrder: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setProduct(product.id, { isActive: !product.isActive })}
                    className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
                  >
                    {product.isActive ? "Hide from catalogue" : "Publish to catalogue"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProduct(product.id, { isFeatured: !product.isFeatured })}
                    className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
                  >
                    {product.isFeatured ? "Unmark featured" : "Mark featured"}
                  </button>
                </div>

                <div className="overflow-x-auto rounded-md border border-black/5">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-black/5 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-3 py-2 font-semibold">Price (₹)</th>
                        <th className="px-3 py-2 font-semibold">MRP (₹)</th>
                        <th className="px-3 py-2 font-semibold">Weight label</th>
                        <th className="px-3 py-2 font-semibold">Pack</th>
                        <th className="px-3 py-2 font-semibold">Inventory</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant) => (
                        <tr key={variant.id} className="border-b border-black/5">
                          <td className="px-3 py-2">
                            <input
                              className={`${inputClass} w-28`}
                              type="number"
                              min="1"
                              value={variant.priceInr}
                              onChange={(e) =>
                                setVariant(product.id, variant.id, {
                                  priceInr: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className={`${inputClass} w-28`}
                              type="number"
                              min="1"
                              value={variant.mrpInr ?? ""}
                              placeholder="None"
                              onChange={(e) =>
                                setVariant(product.id, variant.id, {
                                  mrpInr: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className={`${inputClass} w-32`}
                              value={variant.weightLabel}
                              onChange={(e) =>
                                setVariant(product.id, variant.id, {
                                  weightLabel: e.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className={`${inputClass} w-24`}
                              type="number"
                              min="1"
                              value={variant.packCount}
                              onChange={(e) =>
                                setVariant(product.id, variant.id, {
                                  packCount: Number(e.target.value) || 1,
                                })
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className={`${inputClass} w-28`}
                              type="number"
                              min="0"
                              value={variant.inventory}
                              onChange={(e) =>
                                setVariant(product.id, variant.id, {
                                  inventory: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() =>
                                setVariant(product.id, variant.id, {
                                  isActive: !variant.isActive,
                                })
                              }
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                variant.isActive
                                  ? "border-green-200 bg-green-50 text-green-800"
                                  : "border-black/10 text-gray-500 hover:text-[var(--ginger-terracotta)]"
                              }`}
                            >
                              {variant.isActive ? "active" : "hidden"}
                            </button>
                            <span className="ml-2 font-mono text-[11px] text-gray-400">
                              {variant.sku}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
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