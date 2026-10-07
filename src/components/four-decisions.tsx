import { loadCatalogue, loadSections, renderTemplate, type Section, type SectionItem } from "@/lib/cms";
import { products } from "@/lib/products";

/**
 * Prices are read from the catalogue rather than typed into the copy so this
 * section cannot drift from what checkout actually charges. The fifth decision
 * carries `{{weight}}`, `{{sellingPrice}}` and `{{mrp}}` placeholders for the
 * same reason: an admin can reword it without ever freezing a price.
 */
const FALLBACK_ITEMS: SectionItem[] = [
  {
    title: "Indian roots",
    text: "Jaggery needs no introduction in India. It is the sweetener behind chai, desserts and everyday cooking - a familiar favourite at the heart of Indian food culture. Every Nature's Choice jar starts from that same traditional desi jaggery, so the familiarity is always there underneath the twist.",
  },
  {
    title: "A different flavour experience",
    text: "The difference is the finish. Our jaggery is melted slowly and cooled into a soft, glossy slab, which rounds off the raw edge and leaves a deep, chocolatey character. That one base becomes three flavour combinations - classic, roasted sesame (til) and cracked green cardamom (elaichi).",
  },
  {
    title: "Made for the modern home",
    text: "A jar that fits the way you already eat. Spoon it straight, grate it into a hot drink, spread it on toast or drop it into a dessert - no new techniques, no specialist ingredients. The flavours are built for chai, coffee, breakfast and sweet moments, not for a shelf of rarities.",
  },
  {
    title: "Quality & transparency",
    text: "Our jaggery is made from unrefined cane juice - we do not bleach it, refine it or lighten the colour to make it look uniform. The til is roasted sesame; the elaichi is cracked whole green cardamom, never a powder. And we print only what we can show evidence for: no health claims, no invented certifications, no badges we cannot document.",
  },
  {
    title: "Simple enjoyment",
    text: "Taste it slowly from the jar, stir it through warm milk, or shave it over a dessert. The chocolatey depth works wherever you would reach for jaggery - and the {{weight}} jar is made to be used, not saved. Every jar is priced at \u20B9{{sellingPrice}} against an MRP of \u20B9{{mrp}}.",
  },
];

const FALLBACK: Section = {
  key: "home_decisions",
  label: "Home - Five decisions",
  eyebrow: "How we make it",
  title: "Five decisions that explain the taste",
  titleAccent: "",
  body:
    "We did not set out to reinvent jaggery. We made five decisions, and you can taste all of them.",
  body2: "",
  image: "",
  imageMobile: "",
  items: FALLBACK_ITEMS,
  links: [],
};

export default async function FourDecisions() {
  const [sections, catalogue] = await Promise.all([
    loadSections(),
    loadCatalogue(),
  ]);

  const section = sections.home_decisions ?? FALLBACK;
  const items = section.items.length > 0 ? section.items : FALLBACK_ITEMS;

  const lead = catalogue[0] ?? products[0];
  const tokens = {
    weight: lead.weight,
    sellingPrice: lead.sellingPrice,
    mrp: lead.mrp,
  };

  return (
    <section className="relative isolate overflow-hidden bg-[var(--warm-cream)] py-16 md:py-24">
      {/*
        Ambient colour behind the panels. Decorative only, so it is hidden from
        assistive tech and cannot intercept clicks.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-[var(--ginger-terracotta)]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[var(--natural-green)]/15 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-[var(--jaggery-brown)]/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="relative max-w-3xl rounded-[2rem] border border-white/70 bg-[var(--white)]/75 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_24px_48px_-28px_rgba(90,50,31,0.45)] backdrop-blur-md sm:p-10">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
            {section.eyebrow}
          </p>
          <h2 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-[var(--dark-text)]">
            {section.title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--dark-text)]/70">
            {section.body}
          </p>
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {items.map((decision, index) => (
            <li
              key={`${index}-${decision.title}`}
              className="group relative flex gap-5 overflow-hidden rounded-2xl border border-white/70 bg-[var(--white)]/85 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_32px_-20px_rgba(90,50,31,0.5)] backdrop-blur-sm transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_28px_52px_-24px_rgba(90,50,31,0.55)] motion-reduce:transform-none motion-reduce:transition-none sm:p-7"
            >
              {/* Warm wash that fades up on hover, under the text. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(200,121,69,0.14),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
              />

              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--jaggery-brown)] to-[var(--natural-green)] font-serif text-sm font-bold tracking-wider text-[var(--white)] shadow-[0_6px_14px_-6px_rgba(90,50,31,0.7)] ring-1 ring-white/40 transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div>
                <h3 className="font-serif text-xl font-bold text-[var(--dark-text)]">
                  {decision.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--dark-text)]/70">
                  {renderTemplate(decision.text ?? "", tokens)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
