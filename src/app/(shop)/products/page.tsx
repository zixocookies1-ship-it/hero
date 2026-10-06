import type { Metadata } from "next";
import ProductCard from "@/components/product-card";
import { loadCatalogue } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Products - Nature's Choice Jaggery",
  description:
    "Shop all three authentic flavours of Nature's Choice Jaggery. 500g packs, traditional gold-kettle method, no preservatives.",
};

export default async function ProductsPage() {
  const products = await loadCatalogue();

  return (
    <main className="pt-28 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
            All Products
          </p>
          <h1 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--dark-text)]">
            Three authentic flavours
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--dark-text)]/70">
            Every jar is slow-cooked in pure clay pots over natural wood fire,
            with no preservatives and no chemicals.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </main>
  );
}