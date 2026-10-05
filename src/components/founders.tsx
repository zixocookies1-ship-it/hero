const founders = [
  {
    name: "Ruby Gupta",
    role: "Founder, Nature's Choice Jaggery",
    initials: "RG",
    paragraphs: [
      "Ruby started this journey with a simple belief — traditional Indian flavours can have a place in the modern world too.",
      "Her vision was to create something familiar, but different. Something that could make people look at jaggery in a completely new way.",
    ],
    quote:
      "We didn’t want to change what makes jaggery special. We just wanted to give it a new way to be enjoyed.",
  },
  {
    name: "Vijay Gupta",
    role: "Co-Founder, Nature's Choice Jaggery",
    initials: "VG",
    paragraphs: [
      "For Vijay, this journey has been about turning an idea into something real — from developing the product to packaging it, taking it to customers, and building the brand step by step.",
      "There’s been a lot to learn along the way, but one thing has stayed constant — build something people can genuinely trust and enjoy.",
    ],
    quote:
      "We’re still at the beginning, but we have a big dream — to build an Indian brand that people can truly be proud of.",
  },
] as const;

export default function Founders() {
  return (
    <section className="mt-20">
      <h2 className="text-2xl font-bold text-[var(--dark-text)]">The people behind it</h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--dark-text)]/70">
        Two people, one shared idea about what Indian jaggery could be.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {founders.map((founder) => (
          <article
            key={founder.name}
            className="flex flex-col rounded-2xl border border-black/5 bg-[var(--white)] p-7 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--jaggery-brown)] font-serif text-lg font-bold text-[var(--white)]"
              >
                {founder.initials}
              </span>
              <div>
                <h3 className="font-serif text-xl font-bold text-[var(--dark-text)]">
                  {founder.name}
                </h3>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
                  {founder.role}
                </p>
              </div>
            </div>

            {founder.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-5 text-base leading-relaxed text-[var(--dark-text)]/75"
              >
                {paragraph}
              </p>
            ))}

            <blockquote className="mt-6 border-l-2 border-[var(--ginger-terracotta)] pl-5">
              <p className="font-serif text-lg leading-relaxed text-[var(--jaggery-brown)]">
                {founder.quote}
              </p>
            </blockquote>
          </article>
        ))}
      </div>
    </section>
  );
}