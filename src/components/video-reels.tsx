"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Customer review wall. Each card is a vertical 9:16 clip with its label pinned
 * bottom-left, matching the reels shelves the brand already posts.
 *
 * The clips ship with the site under `public/videos`, so nothing is fetched from
 * a third party. `preload="none"` keeps a shelf of multi-megabyte phone footage
 * from downloading before anyone presses play: a card only starts fetching when
 * it scrolls into view, and pauses again once it leaves.
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
  const [playing, setPlaying] = useState(false);
  // Autoplay is only permitted on a muted element, so every clip starts silent
  // and the speaker control is what turns the customer's voice back on.
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Autoplay is allowed because the element is muted, but the promise
            // still rejects if the browser declines, so it is swallowed rather
            // than left unhandled.
            void video.play().catch(() => {});
          } else if (!video.paused) {
            video.pause();
          }
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
  };

  return (
    <figure className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-[var(--warm-cream)] shadow-sm transition-shadow hover:shadow-xl">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={reel.src}
        muted
        loop
        playsInline
        preload="none"
        aria-label={reel.label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause review" : "Play review"}
        className={`absolute inset-0 z-10 flex items-center justify-center bg-black/30 transition-opacity duration-300 ${
          playing ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[var(--jaggery-brown)] shadow-lg">
          <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true">
            <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86A1 1 0 008 5.14z" />
          </svg>
        </span>
      </button>

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Turn sound on" : "Mute review"}
        aria-pressed={!muted}
        className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65"
      >
        {muted ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      <span className="absolute left-3 top-3 z-20 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
        Video review
      </span>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

      <figcaption className="absolute inset-x-0 bottom-0 z-20 p-4">
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
