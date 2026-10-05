const items = [
  {
    eyebrow: "Pure & Natural",
    title: "Nothing Added",
    body: "No preservatives, no chemicals, no artificial colouring. Just sugarcane, slow-cooked.",
  },
  {
    eyebrow: "Traditional Method",
    title: "Gold-Kettle Cooking",
    body: "Slow-cooked in pure clay pots over natural wood fire, the way jaggery has always been made.",
  },
  {
    eyebrow: "Quality Checked",
    title: "Batch Testing",
    body: "Every batch is checked for purity, moisture content and consistency before packing.",
  },
  {
    eyebrow: "Freshness",
    title: "18-Month Shelf Life",
    body: "Packed without additives, so it keeps well in an airtight container.",
  },
  {
    eyebrow: "Sourcing",
    title: "Maharashtra Farms",
    body: "Sugarcane sourced directly from partner farms in Maharashtra, India.",
  },
];

export default function TrustStrip() {
  return (
    <section className="bg-[var(--warm-cream)] py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex flex-col rounded-2xl border border-black/5 bg-[var(--white)] p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ginger-terracotta)]/10 text-[var(--ginger-terracotta)]">
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
                {item.eyebrow}
              </p>
              <h3 className="mt-1.5 font-serif text-base font-bold leading-snug text-[var(--dark-text)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--dark-text)]/65">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}