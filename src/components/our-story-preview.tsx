import Image from "next/image";
import Link from "next/link";
import { loadSections, type Section, type SectionItem } from "@/lib/cms";

const FALLBACK_ITEMS: SectionItem[] = [
  { value: "3", text: "authentic flavours" },
  { value: "100%", text: "no preservatives" },
  { value: "Clay pot", text: "gold-kettle method" },
];

const FALLBACK: Section = {
  key: "home_story",
  label: "Home - Our story preview",
  eyebrow: "Our story",
  title: "Traditional At Heart. New In Taste.",
  titleAccent: "",
  body:
    "It started with one simple thought - why should jaggery always taste the same? We wanted to keep the goodness and familiarity of traditional jaggery, but give it a new twist that today's generation would genuinely enjoy.",
  body2:
    "That simple idea became Nature's Choice Jaggery - traditional Indian jaggery with a delicious chocolatey twist. What started as an idea is slowly becoming a brand we're truly proud of. And honestly, this is just the beginning.",
  image: "/images/jaggery-blocks.webp",
  imageMobile: "",
  items: FALLBACK_ITEMS,
  links: [{ label: "READ OUR STORY", href: "/about" }],
};

export default async function OurStoryPreview() {
  const sections = await loadSections();
  const section = sections.home_story ?? FALLBACK;
  const highlights =
    section.items.length > 0 ? section.items : FALLBACK_ITEMS;
  const cta = section.links[0] ?? FALLBACK.links[0];

  return (
    <section className="bg-[var(--warm-cream)] py-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* The page behind this section is already warm cream, so the boundary
            comes from a white card rather than a second tone. */}
        <div className="rounded-3xl border border-[var(--natural-green)]/10 bg-[var(--white)] p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
                {section.eyebrow}
              </p>
              <h2 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--dark-text)]">
                {section.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--dark-text)]/70">
                {section.body}
              </p>
              <p className="mt-3 text-base leading-relaxed text-[var(--dark-text)]/70">
                {section.body2}
              </p>

              <dl className="mt-7 grid grid-cols-3 gap-3">
                {highlights.map((item) => (
                  <div
                    key={item.text}
                    className="rounded-2xl bg-[var(--mint-soft)] p-4 text-center"
                  >
                    <dt className="sr-only">{item.text}</dt>
                    <dd>
                      <span className="block font-serif text-xl font-bold text-[var(--jaggery-brown)]">
                        {item.value}
                      </span>
                      <span className="mt-1 block text-xs text-[var(--dark-text)]/60">
                        {item.text}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>

              <Link
                href={cta.href}
                className="mt-7 inline-block rounded-full border border-[var(--jaggery-brown)] px-7 py-3.5 text-sm font-semibold text-[var(--jaggery-brown)] transition-colors hover:bg-[var(--jaggery-brown)] hover:text-[var(--white)]"
              >
                {cta.label}
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl bg-[var(--warm-cream)] p-3">
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl">
                <Image
                  src={section.image || "/images/jaggery-blocks.webp"}
                  alt="Nature's Choice Jaggery"
                  fill
                  sizes="(max-width: 1024px) calc(100vw - 4rem), 600px"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
