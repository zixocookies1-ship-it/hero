"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { isBestSeller, type Product } from "@/lib/products";
import PriceDisplay from "@/components/price-display";
import ProductActions from "@/components/product-actions";

/**
 * Storefront product card, laid out to match the reference shop: a fixed-height
 * artwork panel on a warm-to-mint wash, the category eyebrow, serif product
 * name, a short description, the green/red price block and a single full-width
 * "Add to Cart" pill.
 *
 * The image panel is still a horizontal snap scroller — one slide per stored
 * image, never duplicated — so touch users swipe between photos and the dot
 * buttons give mouse users the same control. A single-image product renders the
 * same structure with nothing to scroll, so old records keep working untouched.
 */
export default function ProductCard({ product }: { product: Product }) {
  // Stored images only — one slide per entry, never duplicated. The loader in
  // cms.ts guarantees at least one (shipped photo fallback), so index 0 is safe.
  const images = product.images;
  const [active, setActive] = useState(0);
  const stripRef = useRef<HTMLDivElement | null>(null);

  const onStripScroll = () => {
    const strip = stripRef.current;
    if (!strip || strip.clientWidth === 0) return;
    const index = Math.round(strip.scrollLeft / strip.clientWidth);
    const clamped = Math.min(Math.max(index, 0), images.length - 1);
    setActive((current) => (current === clamped ? current : clamped));
  };

  const goTo = (index: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({
      left: index * strip.clientWidth,
      behavior: reduced ? "auto" : "smooth",
    });
    setActive(index);
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--dark-text)]/10 bg-[var(--white)] shadow-sm transition-all duration-500 ease-out hover:-translate-y-2 hover:border-[var(--mint-soft)] hover:shadow-xl">
      <div className="relative bg-[linear-gradient(135deg,var(--warm-cream),var(--mint-soft))]">
        <Link
          href={`/products/${product.slug}`}
          className="block"
          aria-label={`View ${product.name}`}
        >
          <div
            ref={stripRef}
            onScroll={onStripScroll}
            className="flex h-60 w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.length > 0 ? (
              images.map((src, index) => (
                <div
                  key={`${product.slug}-${index}-${src}`}
                  className="relative h-60 w-full shrink-0 snap-center overflow-hidden"
                >
                  <Image
                    src={src}
                    alt={index === active ? `${product.name} ${product.weight}` : ""}
                    fill
                    sizes="(max-width: 768px) 80vw, 340px"
                    className="object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
                    loading="lazy"
                  />
                </div>
              ))
            ) : (
              <div className="flex h-60 w-full shrink-0 snap-center items-center justify-center">
                <span className="text-sm text-[var(--dark-text)]/50">No photos yet</span>
              </div>
            )}
          </div>
        </Link>

        {isBestSeller(product.slug) ? (
          <span className="absolute left-3.5 top-3.5 z-10 rounded-full bg-[var(--jaggery-brown)] px-3 py-1 text-[0.63rem] font-semibold uppercase tracking-[0.14em] text-[var(--white)] shadow-md">
            Best Seller
          </span>
        ) : null}

        {images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {images.map((_, index) => (
              <button
                key={`${product.slug}-dot-${index}`}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show image ${index + 1} of ${images.length} for ${product.name}`}
                aria-current={index === active}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === active
                    ? "bg-[var(--jaggery-brown)]"
                    : "bg-black/25 hover:bg-black/40"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--natural-green)]">
          {product.variantName}
        </p>
        <h3 className="mt-2 font-serif text-xl font-normal leading-tight text-[var(--dark-text)]">
          <Link
            href={`/products/${product.slug}`}
            className="hover:text-[var(--ginger-terracotta)]"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[0.8rem] leading-relaxed text-[var(--dark-text)]/60">
          {product.description}
        </p>

        <div className="mt-4">
          <PriceDisplay
            sellingPrice={product.sellingPrice}
            mrp={product.mrp}
            discountPercent={product.discountPercent}
            unit={product.weight}
          />
        </div>

        <div className="mt-5 flex-1" />

        <ProductActions product={product} layout="card" />
      </div>
    </article>
  );
}
