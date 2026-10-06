import Image from "next/image";
import { loadSections, type Section, type SectionItem } from "@/lib/cms";

const FALLBACK_ITEMS: SectionItem[] = [
  {
    title: "Pure & Natural",
    text: "No additives, no preservatives, no chemicals - just sugarcane jaggery.",
  },
  {
    title: "Traditional Method",
    text: "Gold-kettle cooking in pure clay pots over natural wood fire.",
  },
  {
    title: "Batch Tested",
    text: "Every batch checked for purity, moisture and consistency.",
  },
  {
    title: "Direct from Farms",
    text: "Sugarcane sourced from partner farms in Uttar Pradesh, India.",
  },
];

const FALLBACK: Section = {
  key: "home_why",
  label: "Home - Why Nature's Choice",
  eyebrow: "Why choose us",
  title: "Premium quality you can taste",
  titleAccent: "",
  body:
    "We believe in delivering honest jaggery - pure, natural and unadulterated. From farm to jar, every step is handled with care and tradition.",
  body2: "",
  image: "/images/farm-to-jar.png",
  items: FALLBACK_ITEMS,
  links: [],
};

export default async function WhyNaturesChoice() {
  const sections = await loadSections();
  const section = sections.home_why ?? FALLBACK;
  const items = section.items.length > 0 ? section.items : FALLBACK_ITEMS;

  return (
    <section className="bg-[var(--jaggery-brown)] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
              {section.eyebrow}
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-[var(--white)]">
              {section.title}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--white)]/80">
              {section.body}
            </p>

            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map((reason) => (
                <li
                  key={reason.title}
                  className="rounded-2xl border border-[var(--white)]/10 bg-[var(--white)]/5 p-5"
                >
                  <p className="font-semibold text-[var(--white)]">
                    {reason.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--white)]/75">
                    {reason.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl bg-[var(--warm-cream)]/10 p-8">
            <Image
              src={section.image || "/images/farm-to-jar.png"}
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
