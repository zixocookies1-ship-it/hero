import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { products } from "@/lib/products";
import TrustStrip from "@/components/trust-strip";
import ProductCard from "@/components/product-card";
import WhyNaturesChoice from "@/components/why-natures-choice";
import FarmToJar from "@/components/farm-to-jar";
import OurStoryPreview from "@/components/our-story-preview";
import ContactBar from "@/components/contact-bar";

export const metadata: Metadata = {
  title: "Nature's Choice Jaggery",
  description:
    "Premium Indian jaggery - traditional gold-kettle method, no preservatives, three authentic flavours.",
};

export default function Home() {
  return (
    <>
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        <Image
          src="/images/hero-banner.png"
          alt="Nature's Choice Jaggery"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--warm-cream)]/85 via-[var(--warm-cream)]/55 to-transparent" />
        <div className="relative z-10 w-full px-6 py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
                Nature&apos;s Choice
              </p>
              <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] text-[var(--dark-text)]">
                Authentic Indian Jaggery,
                <span className="block text-[var(--jaggery-brown)]">
                  made the traditional way
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--dark-text)]/80">
                Slow-cooked in pure clay pots over natural wood fire. No
                preservatives, no chemicals, just honest sweetness from
                sugarcane farms in Uttar Pradesh.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/products"
                  className="rounded-full bg-[var(--jaggery-brown)] px-7 py-3.5 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)]"
                >
                  SHOP NOW
                </Link>
                <Link
                  href="/about"
                  className="rounded-full border border-[var(--jaggery-brown)] px-7 py-3.5 text-sm font-semibold text-[var(--jaggery-brown)] transition-colors hover:bg-[var(--white)]"
                >
                  OUR STORY
                </Link>
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
                Best sellers
              </p>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--dark-text)]">
                Customer favourites
              </h2>
            </div>
            <Link
              href="/products"
              className="text-sm font-semibold text-[var(--jaggery-brown)] underline underline-offset-4 transition-colors hover:text-[var(--ginger-terracotta)]"
            >
              View all products
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <WhyNaturesChoice />

      <FarmToJar />

      <OurStoryPreview />

      <ContactBar />
    </>
  );
}