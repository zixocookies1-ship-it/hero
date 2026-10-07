import Image from "next/image";
import Link from "next/link";
import { loadSections, type Section, type SectionItem } from "@/lib/cms";

const FALLBACK_ITEMS: SectionItem[] = [
  {
    title: "Sugarcane Harvest",
    text: "Fresh sugarcane sourced from partner farms in Uttar Pradesh.",
  },
  {
    title: "Gold-Kettle Cooking",
    text: "Slow-cooked in pure clay pots over natural wood fire.",
  },
  {
    title: "Batch Testing",
    text: "Checked for purity, moisture and consistency before packing.",
  },
  {
    title: "Packed & Delivered",
    text: "Sealed without preservatives and sent to your door.",
  },
];

const FALLBACK: Section = {
  key: "home_process",
  label: "Home - Farm to jar",
  eyebrow: "Farm to jar",
  title: "A shorter, clearer journey",
  titleAccent: "",
  body:
    "We trace every batch from sugarcane farms in Uttar Pradesh to your kitchen. The gold-kettle method keeps the natural character of the sugarcane that industrial refining strips away.",
  body2: "",
  image: "/images/farm-to-jar.png",
  imageMobile: "",
  items: FALLBACK_ITEMS,
  links: [{ label: "SHOP NOW", href: "/products" }],
};

export default async function FarmToJar() {
  const sections = await loadSections();
  const section = sections.home_process ?? FALLBACK;
  const steps = section.items.length > 0 ? section.items : FALLBACK_ITEMS;
  const cta = section.links[0] ?? FALLBACK.links[0];

  return (
    <section className="bg-[var(--white)] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-[var(--warm-cream)] p-4">
            <Image
              src={section.image || "/images/farm-to-jar.png"}
              alt="From sugarcane farm to jar"
              width={1200}
              height={800}
              className="h-full w-full rounded-xl object-cover"
            />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
              {section.eyebrow}
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--dark-text)]">
              {section.title}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--dark-text)]/70">
              {section.body}
            </p>

            <ol className="mt-8 space-y-5">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--jaggery-brown)] text-sm font-bold text-[var(--white)]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--dark-text)]">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--dark-text)]/65">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              href={cta.href}
              className="mt-8 inline-block rounded-full bg-[var(--jaggery-brown)] px-7 py-3.5 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)]"
            >
              {cta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
