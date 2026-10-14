"use client";

import { useEffect, useRef } from "react";

/**
 * Customer review wall. Each card is a vertical 9:16 clip with its label pinned
 * bottom-left, matching the reels shelves the brand already posts.
 *
 * The clips ship with the site under `public/videos`, so nothing is fetched from
 * a third party. They are only wired up lazily: a card gets its `src` the first
 * time it scrolls into view and pauses again once it leaves, so a shelf of
 * multi-megabyte phone footage never downloads all at once.
 */
type Reel = {
  id: string;
  /** Absolute path under `public`, e.g. "/videos/customer-review-1.mp4". */
  src: string;
  label: string;
};

const REELS: Reel[] = [
  {
    id: "customer-review-1",
    src: "/videos/customer-review-1.mp4",
    label: "Customer review",
  },
  {
    id: "customer-review-2",
    src: "/videos/customer-review-2.mp4",
    label: "Customer review",
  },
  {
    id: "customer-review-3",
    src: "/videos/customer-review-3.mp4",
    label: "Customer review",
  },
  {
    id: "customer-review-4",
    src: "/videos/customer-review-4.mp4",
    label: "Customer review",
  },
];

function ReelCard({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!video.getAttribute("src")) {
            video.setAttribute("src", reel.src);
          }
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [reel.src]);

  return (
    <figure className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-[var(--warm-cream)] shadow-sm transition-shadow hover:shadow-xl">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        muted
        loop
        playsInline
        preload="none"
        aria-label={reel.label}
      />

      <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
        Video review
      </span>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

      <figcaption className="absolute inset-x-0 bottom-0 p-4">
        <span className="block text-sm font-semibold leading-snug text-white">
          {reel.label}
        </span>
      </figcaption>
    </figure>
  );
}

export default function VideoReels() {
  return (
    <section className="bg-[var(--white)] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
            Customer reviews
          </p>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--dark-text)]">
            Straight From Our Customers
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--dark-text)]/65">
            Real clips shared by the people who buy our jaggery, in their own
            words and their own kitchens.
          </p>
        </div>

        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:thin] sm:gap-5">
          {REELS.map((reel) => (
            <div
              key={reel.id}
              className="w-[45vw] shrink-0 snap-start sm:w-[32vw] lg:w-[22.5vw]"
            >
              <ReelCard reel={reel} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
