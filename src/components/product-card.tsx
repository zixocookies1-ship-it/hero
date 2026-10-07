"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { type Product } from "@/lib/products";
import PriceDisplay from "@/components/price-display";
import ProductActions from "@/components/product-actions";

/**
 * Card image strip. One slide per stored image — never duplicated — laid out as
 * a horizontal snap scroller so touch users swipe between photos and dot
 * buttons give mouse users the same control. A single-image product renders
 * the same structure with nothing to scroll, so old records keep working
 * untouched.
 *
 * Every slide is the same square box with the shared cover+zoom treatment, so
 * any aspect ratio of photo lands at a consistent visual scale across cards.
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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-[var(--white)] shadow-sm transition-shadow hover:shadow-xl">
      <div className="relative bg-[var(--warm-cream)]">
        <Link
          href={`/products/${product.slug}`}
          className="block"
          aria-label={`View ${product.name}`}
        >
          <div
            ref={stripRef}
            onScroll={onStripScroll}
            className="flex aspect-square w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((src, index) => (
              <div
                key={`${product.slug}-${index}-${src}`}
                className="relative aspect-square w-full shrink-0 snap-center overflow-hidden"
              >
                <Image
                  src={src}
                  alt={index === active ? `${product.name} ${product.weight}` : ""}
                  fill
                  sizes="(max-width: 768px) 80vw, 300px"
                  className="scale-110 object-cover transition-transform duration-500 ease-out group-hover:scale-125 motion-reduce:group-hover:scale-110"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </Link>

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

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
          {product.variantName}
        </p>
        <h3 className="mt-2 font-serif text-lg font-bold text-[var(--dark-text)]">
          <Link
            href={`/products/${product.slug}`}
            className="hover:text-[var(--ginger-terracotta)]"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-[var(--dark-text)]/60">
          {product.weight} &bull; {product.pack}
        </p>

        <div className="mt-4">
          <PriceDisplay
            sellingPrice={product.sellingPrice}
            mrp={product.mrp}
            discountPercent={product.discountPercent}
          />
        </div>

        <div className="mt-5 flex-1" />

        <ProductActions product={product} layout="row" />
      </div>
    </article>
  );
}
