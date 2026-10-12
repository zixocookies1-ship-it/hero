import Image from "next/image";

/**
 * Short-form video wall. Each card is a vertical 9:16 reel with its caption
 * pinned bottom-left, styled after the reels shelves the brand already posts.
 *
 * Clips are referenced by `src`. When `src` is empty the card falls back to a
 * still, so the shelf reads as intended before the footage lands; drop the
 * files into `public/videos/` and fill in the paths to switch a card over to a
 * playing reel. Nothing here is fetched from a third party — the videos ship
 * with the site.
 */
type Reel = {
  id: string;
  /** Absolute path under `public`, e.g. "/videos/gold-kettle.mp4". */
  src: string;
  poster: string;
  label: string;
  caption: string;
};

const REELS: Reel[] = [
  {
    id: "wood-fire",
    src: "",
    poster: "/images/hero-banner.png",
    label: "The batch",
    caption: "Slow-cooked over natural wood fire",
  },
  {
    id: "clay-pots",
    src: "",
    poster: "/images/farm-to-jar.png",
    label: "The vessel",
    caption: "Clay pots, the traditional way",
  },
  {
    id: "hand-packed",
    src: "",
    poster: "/images/products/desi-til-chocolatey-jaggery/06.jpeg",
    label: "The pack",
    caption: "Filled and sealed by hand",
  },
  {
    id: "real-elaichi",
    src: "",
    poster: "/images/products/desi-elaichi-chocolatey-jaggery/03 (1).jpeg",
    label: "The flavour",
    caption: "Real elaichi, ground in-house",
  },
];

function ReelCard({ reel }: { reel: Reel }) {
  return (
    <figure className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-[var(--warm-cream)] shadow-sm transition-shadow hover:shadow-xl">
      {reel.src ? (
        <video
          className="h-full w-full object-cover"
          src={reel.src}
          poster={reel.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <Image
          src={reel.poster}
          alt={reel.caption}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
        />
      )}

      <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
        Reel
      </span>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

      <figcaption className="absolute inset-x-0 bottom-0 p-4">
        <span className="block text-[10px] font-semibold uppercase tracking-widest text-white/70">
          {reel.label}
        </span>
        <span className="mt-1 block text-sm font-semibold leading-snug text-white">
          {reel.caption}
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
            From the kitchen
          </p>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--dark-text)]">
            Real Ingredients. Real Work
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--dark-text)]/65">
            No studio, no stand-ins — the same sugarcane, clay pots and wood fire
            behind every jar, captured the way it happens.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {REELS.map((reel) => (
            <ReelCard key={reel.id} reel={reel} />
          ))}
        </div>
      </div>
    </section>
  );
}
