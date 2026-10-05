import Image from "next/image";

const reasons = [
  {
    title: "Pure & Natural",
    body: "No additives, no preservatives, no chemicals - just sugarcane jaggery.",
  },
  {
    title: "Traditional Method",
    body: "Gold-kettle cooking in pure clay pots over natural wood fire.",
  },
  {
    title: "Batch Tested",
    body: "Every batch checked for purity, moisture and consistency.",
  },
  {
    title: "Direct from Farms",
    body: "Sugarcane sourced from partner farms in Uttar Pradesh, India.",
  },
];

export default function WhyNaturesChoice() {
  return (
    <section className="bg-[var(--jaggery-brown)] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
              Why choose us
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-[var(--white)]">
              Premium quality you can taste
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--white)]/80">
              We believe in delivering honest jaggery - pure, natural and
              unadulterated. From farm to jar, every step is handled with care
              and tradition.
            </p>

            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {reasons.map((reason) => (
                <li
                  key={reason.title}
                  className="rounded-2xl border border-[var(--white)]/10 bg-[var(--white)]/5 p-5"
                >
                  <p className="font-semibold text-[var(--white)]">{reason.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--white)]/75">
                    {reason.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl bg-[var(--warm-cream)]/10 p-8">
            <Image
              src="/images/farm-to-jar.png"
              alt="Traditional jaggery preparation"
              width={600}
              height={400}
              className="rounded-2xl object-cover"
            />
          </div>
        </div>

        </div>
    </section>
  );
}