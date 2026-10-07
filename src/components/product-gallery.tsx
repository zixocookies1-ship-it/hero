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
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    activeThumbRef.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex]);

  if (!activeImage) return null;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative aspect-square w-full touch-pan-y overflow-hidden rounded-2xl border border-black/5 bg-[var(--warm-cream)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          key={activeImage}
          src={activeImage}
          alt={`${alt} - view ${activeIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 90vw, 520px"
          className="scale-105 object-cover transition-transform duration-300"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {images.map((image, index) => (
            <button
              key={`${index}-${image}`}
              ref={index === activeIndex ? activeThumbRef : undefined}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex}
              className={`relative aspect-square w-20 shrink-0 snap-start overflow-hidden rounded-xl border-2 bg-[var(--warm-cream)] transition-colors ${
                index === activeIndex
                  ? "border-[var(--ginger-terracotta)]"
                  : "border-black/5 hover:border-[var(--ginger-terracotta)]/50"
              }`}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="80px"
                className="scale-110 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}