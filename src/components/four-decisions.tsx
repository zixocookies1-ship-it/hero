import { products } from "@/lib/products";

/**
 * Prices are read from the catalogue rather than typed here so this copy cannot
 * drift from what checkout actually charges.
 */
const lead = products[0];

const decisions = [
  {
    number: "01",
    title: "Indian roots",
    body: "Jaggery needs no introduction in India. It is the sweetener behind chai, desserts and everyday cooking — a familiar favourite at the heart of Indian food culture. Every Nature’s Choice jar starts from that same traditional desi jaggery, so the familiarity is always there underneath the twist.",
  },
  {
    number: "02",
    title: "A different flavour experience",
    body: "The difference is the finish. Our jaggery is melted slowly and cooled into a soft, glossy slab, which rounds off the raw edge and leaves a deep, chocolatey character. That one base becomes three flavour combinations — classic, roasted sesame (til) and cracked green cardamom (elaichi).",
  },
  {
    number: "03",
    title: "Made for the modern home",
    body: "A jar that fits the way you already eat. Spoon it straight, grate it into a hot drink, spread it on toast or drop it into a dessert — no new techniques, no specialist ingredients. The flavours are built for chai, coffee, breakfast and sweet moments, not for a shelf of rarities.",
  },
  {
    number: "04",
    title: "Quality & transparency",
    body: "Our jaggery is made from unrefined cane juice — we do not bleach it, refine it or lighten the colour to make it look uniform. The til is roasted sesame; the elaichi is cracked whole green cardamom, never a powder. And we print only what we can show evidence for: no health claims, no invented certifications, no badges we cannot document.",
  },
  {
    number: "05",
    title: "Simple enjoyment",
    body: `Taste it slowly from the jar, stir it through warm milk, or shave it over a dessert. The chocolatey depth works wherever you would reach for jaggery — and the ${lead.weight} jar is made to be used, not saved. Every jar is priced at ₹${lead.sellingPrice} against an MRP of ₹${lead.mrp}.`,
  },
] as const;

export default function FourDecisions() {
  return (
    <section className="bg-[var(--warm-cream)] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
            How we make it
          </p>
          <h2 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-[var(--dark-text)]">
            Five decisions that explain the taste
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--dark-text)]/70">
            We did not set out to reinvent jaggery. We made five decisions, and you
            can taste all of them.
          </p>
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {decisions.map((decision) => (
            <li
              key={decision.number}
              className="flex gap-5 rounded-2xl border border-black/5 bg-[var(--white)] p-6 shadow-sm sm:p-7"
            >
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--jaggery-brown)] font-serif text-sm font-bold tracking-wider text-[var(--white)]"
              >
                {decision.number}
              </span>

              <div>
                <h3 className="font-serif text-xl font-bold text-[var(--dark-text)]">
                  {decision.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--dark-text)]/70">
                  {decision.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}