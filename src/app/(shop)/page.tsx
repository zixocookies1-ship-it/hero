import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import TrustStrip from "@/components/trust-strip";
import ProductCard from "@/components/product-card";
import WhyNaturesChoice from "@/components/why-natures-choice";
import FarmToJar from "@/components/farm-to-jar";
import OurStoryPreview from "@/components/our-story-preview";
import CustomerReviews from "@/components/customer-reviews";
import FourDecisions from "@/components/four-decisions";
import { loadCatalogue, loadSections, type Section } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Nature's Choice Jaggery",
  description:
    "Premium Indian jaggery - traditional gold-kettle method, no preservatives, three authentic flavours.",
};

/**
 * Copy the hero shipped with. Used only when the `home_hero` document is
 * missing or the database is unreachable, so the section never renders blank.
 */
const HERO_FALLBACK: Section = {
  key: "home_hero",
  label: "Home - Hero banner",
  eyebrow: "Nature's Choice",
  title: "Authentic Indian Jaggery,",
  titleAccent: "made the traditional way",
  body:
    "Slow-cooked in pure clay pots over natural wood fire. No preservatives, no chemicals, just honest sweetness from sugarcane farms in Uttar Pradesh.",
  body2: "",
  image: "/images/hero-banner.png",
  imageMobile: "",
  items: [],
  links: [
    { label: "SHOP NOW", href: "/products" },
    { label: "OUR STORY", href: "/about" },
  ],
};

const FEATURED_FALLBACK: Section = {
  key: "home_featured",
  label: "Home - Featured products",
  eyebrow: "Best sellers",
  title: "Customer favourites",
  titleAccent: "",
  body: "",
  body2: "",
  image: "",
  imageMobile: "",
  items: [],
  links: [{ label: "View all products", href: "/products" }],
};

export default async function Home() {
  const [sections, catalogue] = await Promise.all([
    loadSections(),
    loadCatalogue(),
  ]);

  const hero = sections.home_hero ?? HERO_FALLBACK;
  const featured = sections.home_featured ?? FEATURED_FALLBACK;
  const viewAll = featured.links[0] ?? FEATURED_FALLBACK.links[0];

  // "Best sellers" is driven by the admin's featured flag. Until at least one
  // product is flagged, no best-seller decision has been made, so the shipped
  // behaviour of showing every product stands rather than an empty grid.
  const flagged = catalogue.filter((product) => product.featured === true);
  const displayed = flagged.length > 0 ? flagged : catalogue;

  // The hero banner photograph is the first catalogue product (Desi
  // Chocolatey). Linking the image itself to that product keeps the whole hero
  // clickable instead of leaving a large, unclickable visual dead zone.
  const heroProduct = displayed[0] ?? catalogue[0] ?? null;

  return (
    <>
      <section className="group relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        <Link
          href={heroProduct ? `/products/${heroProduct.slug}` : "/products"}
          className="absolute inset-0 z-[5]"
          aria-label={
            heroProduct
              ? `Shop ${heroProduct.name}`
              : "Shop our jaggery"
          }
        />
        <Image
          src={hero.imageMobile || hero.image || "/images/hero-banner.png"}
          alt={hero.title || "Nature's Choice Jaggery"}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 md:hidden"
        />
        <Image
          src={hero.image || "/images/hero-banner.png"}
          alt={hero.title || "Nature's Choice Jaggery"}
          fill
          priority
          sizes="100vw"
          className="hidden object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 md:block"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--warm-cream)]/85 via-[var(--warm-cream)]/55 to-transparent" />
        <div className="relative z-10 w-full px-6 py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
                {hero.eyebrow}
              </p>
              <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] text-[var(--dark-text)]">
                {hero.title}
                <span className="block text-[var(--jaggery-brown)]">
                  {hero.titleAccent}
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--dark-text)]/80">
                {hero.body}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {hero.links.map((link, index) => (
                  <Link
                    key={`${link.href}-${index}`}
                    href={link.href}
                    className={
                      index === 0
                        ? "rounded-full bg-[var(--jaggery-brown)] px-7 py-3.5 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)]"
                        : "rounded-full border border-[var(--jaggery-brown)] px-7 py-3.5 text-sm font-semibold text-[var(--jaggery-brown)] transition-colors hover:bg-[var(--white)]"
                    }
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustStrip />

      <section className="bg-[var(--white)] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
                {featured.eyebrow}
              </p>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--dark-text)]">
                {featured.title}
              </h2>
            </div>
            <Link
              href={viewAll.href}
              className="text-sm font-semibold text-[var(--jaggery-brown)] underline underline-offset-4 transition-colors hover:text-[var(--ginger-terracotta)]"
            >
              {viewAll.label}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <WhyNaturesChoice />

      <FarmToJar />

      <OurStoryPreview />

      <FourDecisions />

      <CustomerReviews />
    </>
  );
}
