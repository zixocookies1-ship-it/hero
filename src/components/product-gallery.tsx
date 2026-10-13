"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import Image from "next/image";

export default function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];
  const touchStartX = useRef<number | null>(null);
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);

  const step = (direction: number) => {
    if (images.length < 2) return;
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  };

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || images.length < 2) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) > 48) step(delta > 0 ? -1 : 1);
  };

  useEffect(() => {
    const strip = stripRef.current;
    const thumb = activeThumbRef.current;
    if (!strip || !thumb) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: reduced ? "auto" : "smooth" });
  }, [activeIndex]);

  if (!activeImage) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-black/5 bg-[var(--warm-cream)]">
        <span className="text-sm text-[var(--dark-text)]/50">No photos yet</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative mx-auto aspect-square w-full max-w-[458px] touch-pan-y overflow-hidden rounded-2xl border border-black/5 bg-[var(--warm-cream)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          key={activeImage}
          src={activeImage}
          alt={`${alt} - view ${activeIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 90vw, 458px"
          className="scale-100 object-cover transition-transform duration-300"
          priority
        />
      </div>

      {images.length > 1 && (
        <div
          ref={stripRef}
          className="-mx-1 flex snap-x snap-mandatory justify-center gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
        >
          {images.map((image, index) => (
            <button
              key={`${index}-${image}`}
              ref={index === activeIndex ? activeThumbRef : undefined}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex}
              className={`relative aspect-square w-16 shrink-0 snap-start overflow-hidden rounded-xl border-2 bg-[var(--warm-cream)] transition-colors ${
                index === activeIndex
                  ? "border-[var(--ginger-terracotta)]"
                  : "border-black/5 hover:border-[var(--ginger-terracotta)]/50"
              }`}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="64px"
                className="scale-110 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}