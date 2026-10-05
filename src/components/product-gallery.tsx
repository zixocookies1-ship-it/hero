"use client";

import { useState } from "react";
import Image from "next/image";
import { type Product } from "@/lib/products";

export default function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  if (!activeImage) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-black/5 bg-[var(--warm-cream)] p-8">
        <Image
          key={activeImage}
          src={activeImage}
          alt={`${alt} - view ${activeIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 90vw, 520px"
          className="object-contain"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-6">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-[var(--warm-cream)] p-1.5 transition-colors ${
                index === activeIndex
                  ? "border-[var(--ginger-terracotta)]"
                  : "border-black/5 hover:border-[var(--ginger-terracotta)]/50"
              }`}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="96px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}