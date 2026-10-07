import { SHELF_LIFE_MONTHS } from "@/lib/products";
import { loadSections, renderTemplate, type SectionItem } from "@/lib/cms";

/**
 * Copy this strip shipped with, used when the `home_trust` document is absent.
 * The shelf life is substituted at render time so an admin edit can never
 * freeze a stale number into the tile.
 */
const FALLBACK_ITEMS: SectionItem[] = [
  {
    subtitle: "Pure & Natural",
    title: "Nothing Added",
    text: "No preservatives, no chemicals, no artificial colouring. Just sugarcane, slow-cooked.",
  },
  {
    subtitle: "Traditional Method",
    title: "Gold-Kettle Cooking",
    text: "Slow-cooked in pure clay pots over natural wood fire, the way jaggery has always been made.",
  },
  {
    subtitle: "Quality Checked",
    title: "Batch Testing",
    text: "Every batch is checked for purity, moisture content and consistency before packing.",
  },
  {
    subtitle: "Freshness",
    title: "{{shelfLife}}-Month Shelf Life",
    text: "Packed without additives, so it keeps well in an airtight container.",
  },
  {
    subtitle: "Sourcing",
    title: "Uttar Pradesh Farms",
    text: "Sugarcane sourced directly from partner farms in Uttar Pradesh, India.",
  },
];

const tokens = { shelfLife: SHELF_LIFE_MONTHS };

export default async function TrustStrip() {
  const sections = await loadSections();
  const items = sections.home_trust?.items.length
    ? sections.home_trust.items
    : FALLBACK_ITEMS;

  return (
    <section className="bg-[var(--warm-cream)] py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {items.map((item, index) => (
            <div
              key={item.title}
              style={{ animationDelay: `${index * 0.7}s` }}
              className="flex flex-col rounded-2xl border border-black/5 bg-[var(--white)] p-5 shadow-sm transition-shadow hover:shadow-md motion-safe:animate-floaty"
            >
              <span
                style={{ animationDelay: `${index * 0.7 + 0.4}s` }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ginger-terracotta)]/10 text-[var(--ginger-terracotta)] motion-safe:animate-swell"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
                {item.subtitle}
              </p>
              <h3 className="mt-1.5 font-serif text-base font-bold leading-snug text-[var(--dark-text)]">
                {renderTemplate(item.title ?? "", tokens)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--dark-text)]/65">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
