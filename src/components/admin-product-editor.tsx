"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminImageUpload from "@/components/admin-image-upload";

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
  description: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  /** Custom gallery served from Cloudinary; an empty list means "ship images". */
  images: string[];
  variants: AdminVariantData[];
};

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-sm text-[var(--dark-text)] focus:border-[var(--ginger-terracotta)] focus:outline-none";

const emptyForm = {
  name: "",
  slug: "",
  flavour: "",
  description: "",
  priceInr: "",
  mrpInr: "",
  weightLabel: "",
  packCount: "1",
  inventory: "0",
  sortOrder: "0",
  images: [] as string[],
};

/**
 * Turns a Cloudinary CDN URL back into its public id so the same asset can be
 * replaced in place or deleted later. Returns "" for anything that does not
 * look like a Cloudinary upload (e.g. a shipped /images/ path).
 */
function publicIdFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const marker = "/image/upload/";
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return "";
    return parsed.pathname
      .slice(index + marker.length)
      .replace(/^v\d+\//, "")
      .replace(/\.[a-z0-9]+$/i, "");
  } catch {
    return "";
  }
}

/**
 * Product manager. Editing a price, MRP, inventory, weight, copy, the photo
 * set or the publish flag here changes what the storefront shows immediately,
 * because the storefront reads these collections on every request.
 *
 * Two-step delete: "Delete" then "Confirm delete", because removing a product
 * removes its variants too and is not reversible. "Hide" never deletes a
 * document — it only unpublishes, so pausing a product stays reversible.
 */
export default function AdminProductEditor({ products }: { products: AdminProductRow[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState(products);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "save" | "create" | "delete">(null);
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const toggleExpand = (id: string) =>
    setExpanded((current) => (current === id ? null : id));

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
          product.description !== original.description ||
          product.isActive !== original.isActive ||
          product.isFeatured !== original.isFeatured ||
          product.sortOrder !== original.sortOrder ||
          product.images.join("\u0000") !== original.images.join("\u0000")
        ) {
          const response = await fetch(`/api/admin/products/${product.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: product.name,
              tagline: product.tagline,
              flavour: product.flavour,
              description: product.description,
              isActive: product.isActive,
              isFeatured: product.isFeatured,
              sortOrder: product.sortOrder,
              images: product.images,
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
          description: form.description || null,
          priceInr: form.priceInr ? Number(form.priceInr) : null,
          mrpInr: form.mrpInr ? Number(form.mrpInr) : null,
          weightLabel: form.weightLabel || null,
          packCount: Number(form.packCount || "1"),
          inventory: Number(form.inventory || "0"),
          sortOrder: Number(form.sortOrder || "0"),
          // Upload the gallery before publishing so the product never shows a
          // broken image while the first variant row is being created.
          images: form.images,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Create failed.");
      setForm({ ...emptyForm });
      setResult({ ok: true, text: "Product created and published with its first variant." });
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
      const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Delete failed.");
      setDrafts((current) => current.filter((product) => product.id !== id));
      if (expanded === id) setExpanded(null);
      setDeleteTarget(null);
      setResult({ ok: true, text: "Product deleted." });
      router.refresh();
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : "Delete failed." });
    } finally {
      setBusy(null);
    }
  };

  const moveToPrimary = (product: AdminProductRow, index: number) => {
    const next = [...product.images];
    const [target] = next.splice(index, 1);
    if (target) setProduct(product.id, { images: [target, ...next] });
  };

  const removeImage = (product: AdminProductRow, index: number) => {
    const next = product.images.filter((_, entryIndex) => entryIndex !== index);
    setProduct(product.id, { images: next });
  };

  return (
    <div>
      <section className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-[var(--dark-text)]">Add a product</h3>
        <p className="mt-1 text-xs text-gray-500">
          A slug is what the product URL uses (/products/&lt;slug&gt;) and cannot change later.
          Photos are optional here — the product ships with its own images until you upload a
          custom gallery (up to six).
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
          <label className="block sm:col-span-2 lg:col-span-4">
            <span className="mb-1 block text-xs font-medium text-gray-600">Description</span>
            <textarea
              className={`${inputClass} resize-y`}
              rows={3}
              value={form.description}
              onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
              placeholder="Shown on the product page."
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <span className="mb-1 block text-xs font-medium text-gray-600">Photos (optional)</span>
            <div className="flex flex-wrap items-center gap-3">
              <AdminImageUpload
                folder={`products/${form.slug.trim() || "new-product"}`}
                value=""
                onChange={(url) =>
                  setForm((c) => ({ ...c, images: [...c.images, url].slice(0, 6) }))
                }
                label="Add photo"
              />
              <span className="text-[11px] text-gray-400">
                {form.images.length}/6 — the first photo is the primary thumbnail.
              </span>
            </div>
            {form.images.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-3">
                {form.images.map((image, index) => (
                  <li key={`${image}-${index}`} className="w-28">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin panel thumbs */}
                    <img
                      src={image}
                      alt=""
                      className="h-28 w-28 rounded-md border border-black/10 object-cover"
                    />
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {index === 0 ? (
                        <span className="rounded-full bg-[var(--jaggery-brown)] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                          primary
                        </span>
                      ) : (
                        <span className="px-2 text-[10px] text-gray-400">photo {index + 1}</span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((c) => ({
                            ...c,
                            images: c.images.filter((_, entryIndex) => entryIndex !== index),
                          }))
                        }
                        className="ml-auto rounded-full border border-red-200 px-2 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
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
            <article key={product.id} className="rounded-lg bg-white shadow">
              <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
                <span className="flex min-w-0 items-center gap-3">
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin panel thumb
                    <img
                      src={product.images[0]}
                      alt=""
                      className="h-12 w-12 flex-shrink-0 rounded-md border border-black/10 object-cover"
                    />
                  ) : (
                    <span className="h-12 w-12 flex-shrink-0 rounded-md border border-dashed border-black/10" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-base font-bold text-[var(--jaggery-brown)]">
                      {product.name}
                    </span>
                    <span className="block font-mono text-xs text-gray-500">{product.slug}</span>
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {product.isActive ? (
                    <span className="inline-block rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold uppercase text-green-800">
                      live
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold uppercase text-gray-700">
                      hidden
                    </span>
                  )}
                  {product.isFeatured ? (
                    <span className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase text-amber-800">
                      featured
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => toggleExpand(product.id)}
                    disabled={busy !== null}
                    className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {expanded === product.id ? "Close" : "Edit"}
                  </button>
                  {deleteTarget === product.id ? (
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void remove(product.id)}
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
                      onClick={() => setDeleteTarget(product.id)}
                      disabled={busy !== null}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </span>
              </div>

              {expanded === product.id ? (
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
                    <label className="block sm:col-span-2 lg:col-span-2">
                      <span className="mb-1 block text-xs font-medium text-gray-600">Description</span>
                      <textarea
                        className={`${inputClass} resize-y`}
                        rows={3}
                        value={product.description}
                        onChange={(e) =>
                          setProduct(product.id, { description: e.target.value })
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

                  <div className="mt-4 rounded-md border border-black/5 bg-gray-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-[var(--dark-text)]">Photos</p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          The first photo is the primary thumbnail. All are served from
                          Cloudinary; an empty gallery shows the shipped images instead.
                        </p>
                      </div>
                      <AdminImageUpload
                        folder={`products/${product.slug}`}
                        value=""
                        onChange={(url) =>
                          setProduct(product.id, {
                            images: [...product.images, url].slice(0, 6),
                          })
                        }
                        label="Add photo"
                      />
                    </div>

                    {product.images.length > 0 ? (
                      <ul className="mt-4 flex flex-wrap gap-3">
                        {product.images.map((image, index) => (
                          <li key={`${image}-${index}`} className="w-28">
                            {/* eslint-disable-next-line @next/next/no-img-element -- admin panel thumbs */}
                            <img
                              src={image}
                              alt=""
                              className="h-28 w-28 rounded-md border border-black/10 object-cover"
                            />
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {index === 0 ? (
                                <span className="rounded-full bg-[var(--jaggery-brown)] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                                  primary
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => moveToPrimary(product, index)}
                                  className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] font-medium text-[var(--dark-text)] hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
                                >
                                  Make primary
                                </button>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              <AdminImageUpload
                                folder={`products/${product.slug}`}
                                value=""
                                onChange={(url) =>
                                  setProduct(product.id, {
                                    images: product.images.map((entry, entryIndex) =>
                                      entryIndex === index ? url : entry
                                    ),
                                  })
                                }
                                updateUrl={publicIdFromUrl(image)}
                                label="Replace"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(product, index)}
                                className="rounded-full border border-red-200 px-2 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-[11px] text-gray-400">
                        No custom photos yet — the storefront is showing the shipped images.
                      </p>
                    )}

                    {product.images.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setProduct(product.id, { images: [] })}
                        className="mt-3 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
                      >
                        Reset to shipped images
                      </button>
                    ) : null}
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