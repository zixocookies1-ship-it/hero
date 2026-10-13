import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductActions from "@/components/product-actions";
import ProductCard from "@/components/product-card";
import ProductGallery from "@/components/product-gallery";
import PriceDisplay from "@/components/price-display";
import WhatsAppEnquiry from "@/components/whatsapp-enquiry";
import { BRAND } from "@/lib/brand";
import { loadCatalogue, loadShippingPolicy } from "@/lib/cms";
import { siteUrl } from "@/lib/env";
import { formatPrice } from "@/lib/products";

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
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [products, policy] = await Promise.all([
    loadCatalogue(),
    loadShippingPolicy(),
  ]);
  const product = products.find((entry) => entry.slug === slug);

  if (!product) notFound();

  const related = products.filter((item) => item.slug !== product.slug);

  const deliveryNote = (() => {
    if (!policy.shippingEnabled || policy.feeInr === 0) {
      return "Free delivery across India";
    }
    if (policy.freeAboveInr === null) {
      return `${formatPrice(policy.feeInr)} flat delivery across India`;
    }
    return `${formatPrice(policy.feeInr)} flat delivery across India, free on orders over ${formatPrice(policy.freeAboveInr)}`;
  })();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((src) => new URL(src, siteUrl()).toString()),
    brand: { "@type": "Brand", name: BRAND.name },
    offers: {
      "@type": "Offer",
      url: new URL(`/products/${product.slug}`, siteUrl()).toString(),
      priceCurrency: "INR",
      price: product.sellingPrice,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <main className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ProductGallery images={product.images} alt={product.name} />

          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--natural-green)]">
              {product.variantName}
              <span className="text-[var(--dark-text)]/40"> &bull; </span>
              {product.inStock ? "In Stock" : "Out of Stock"}
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--dark-text)]">
              {product.name}
            </h1>

            <div className="mt-3">
              <PriceDisplay
                size="lg"
                sellingPrice={product.sellingPrice}
                mrp={product.mrp}
                discountPercent={product.discountPercent}
                unit={product.weight}
              />
              <p className="mt-1.5 text-sm text-[var(--dark-text)]/60">Inclusive of all taxes</p>
            </div>

            <p className="mt-5 text-base leading-relaxed text-[var(--dark-text)]/80">
              {product.description}
            </p>

            {/* Benefits are framed so the scannable list reads as one block rather
                than loose lines floating between the description and the CTA. */}
            <div className="mt-5 rounded-2xl border border-[var(--natural-green)]/12 bg-[var(--mint-soft)] p-5">
              <div className="space-y-2.5">
              {product.highlights.map((highlight) => (
                <p
                  key={highlight}
                  className="flex items-start gap-3 text-sm text-[var(--dark-text)]/85"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--natural-green)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {highlight}
                </p>
              ))}
              <p className="flex items-start gap-3 text-sm font-medium text-[var(--natural-green)]">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375A1.125 1.125 0 012.25 17.625V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                  />
                </svg>
                {deliveryNote}
              </p>
              </div>
            </div>

            <div className="mt-5 border-t border-black/5 pt-5">
              <p className="mb-1.5 text-sm font-medium text-[var(--dark-text)]">
                Ingredients
              </p>
              <p className="text-sm leading-relaxed text-[var(--dark-text)]/70">
                {product.ingredients}
              </p>
            </div>

            <div className="mt-5">
              <ProductActions product={product} />
            </div>

            <div className="mt-3">
              <WhatsAppEnquiry product={product} />
            </div>
          </div>
        </div>

        <section className="mt-20">
          <div className="mb-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--dark-text)]">
              You may also like
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    </main>
  );
}