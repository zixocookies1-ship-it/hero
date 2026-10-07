import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductActions from "@/components/product-actions";
import ProductCard from "@/components/product-card";
import ProductGallery from "@/components/product-gallery";
import PriceDisplay from "@/components/price-display";
import WhatsAppEnquiry from "@/components/whatsapp-enquiry";
import { loadCatalogue } from "@/lib/cms";

export async function generateStaticParams() {
  const products = await loadCatalogue();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = (await loadCatalogue()).find((entry) => entry.slug === slug);
  if (!product) return {};

  return {
    title: `${product.name} - Nature's Choice Jaggery`,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await loadCatalogue();
  const product = products.find((entry) => entry.slug === slug);

  if (!product) notFound();

  const related = products.filter((item) => item.slug !== product.slug);

  return (
    <main className="pt-40 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <ProductGallery images={product.images} alt={product.name} />

          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
              {product.variantName}
            </p>
            <h1 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--dark-text)]">
              {product.name}
            </h1>
            <p className="mt-2 text-base text-[var(--dark-text)]/70">
              {product.weight} &bull; {product.pack}
            </p>

            <div className="mt-6">
              <PriceDisplay
                size="lg"
                sellingPrice={product.sellingPrice}
                mrp={product.mrp}
                discountPercent={product.discountPercent}
              />
              <p className="mt-1 text-sm text-[var(--dark-text)]/60">Inclusive of all taxes</p>
            </div>

            <p className="mt-6 text-base leading-relaxed text-[var(--dark-text)]/80">
              {product.description}
            </p>

            <ul className="mt-6 space-y-2.5">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3 text-sm text-[var(--dark-text)]/85">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--ginger-terracotta)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {highlight}
                </li>
              ))}
            </ul>

            <div className="mt-8 border-t border-black/5 pt-6">
              <p className="mb-3 text-sm font-medium text-[var(--dark-text)]">
                Ingredients
              </p>
              <p className="text-sm leading-relaxed text-[var(--dark-text)]/70">
                {product.ingredients}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span className="rounded-full bg-[var(--natural-green)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--natural-green)]">
                {product.inStock ? "In stock" : "Out of stock"}
              </span>
              <span className="text-sm text-[var(--dark-text)]/60">
                Category: Jaggery &bull; Traditional
              </span>
            </div>

            <div className="mt-6">
              <ProductActions product={product} />
            </div>

            <div className="mt-4">
              <WhatsAppEnquiry product={product} />
            </div>
          </div>
        </div>

        <section className="mt-24">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--dark-text)]">
              You may also like
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}