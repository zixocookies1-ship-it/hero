import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { whatsappLinkFor } from "@/lib/brand";
import { SHELF_LIFE_MONTHS } from "@/lib/products";
import Founders from "@/components/founders";
import SocialLinks from "@/components/social-links";
import { loadBrand, loadCatalogue } from "@/lib/cms";

export const metadata: Metadata = {
  title: "About - Nature's Choice Jaggery",
  description:
    "The story behind Nature's Choice Jaggery - a traditional Indian jaggery brand from Azamgarh, Uttar Pradesh, and its three chocolatey flavours.",
};

const process = [
  {
    title: "Sugarcane Harvest",
    body: "Fresh sugarcane from partner farms in Uttar Pradesh, cut close to the season.",
  },
  {
    title: "Gold-Kettle Cooking",
    body: "Slow-cooked in pure clay pots over natural wood fire, never refined.",
  },
  {
    title: "Batch Testing",
    body: "Checked for purity, moisture and consistency before packing.",
  },
];

const values = [
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
    title: "Sustainable Sourcing",
    body: "Partner farms in Uttar Pradesh, using farming practices that protect the soil.",
  },
];

export default async function AboutPage() {
  const [brand, products] = await Promise.all([loadBrand(), loadCatalogue()]);
  const whatsappLink = (message?: string) => whatsappLinkFor(brand, message);

  return (
    <main className="pt-40 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
            About Nature&apos;s Choice
          </p>
          <h1 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--dark-text)]">
            Jaggery the way it was always meant to taste
          </h1>
        </div>

        <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
              Our story
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--jaggery-brown)]">
              Why should jaggery always taste the same?
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--dark-text)]/75">
              It started with one simple thought — why should jaggery always taste
              the same?
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--dark-text)]/75">
              We wanted to keep the goodness and familiarity of traditional
              jaggery, but give it a new twist that today&apos;s generation would
              genuinely enjoy.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--dark-text)]/75">
              That simple idea became <strong>Nature&apos;s Choice Jaggery</strong> —
              bringing together traditional Indian jaggery and delicious chocolatey
              flavours. What started as an idea is slowly becoming a brand
              we&apos;re truly proud of. And honestly, this is just the beginning.
            </p>

            <dl className="mt-8 grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-black/5 bg-[var(--white)] p-4 text-center">
                <dd className="font-serif text-xl font-bold text-[var(--jaggery-brown)]">3</dd>
                <dt className="mt-1 text-xs text-[var(--dark-text)]/60">
                  authentic flavours
                </dt>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[var(--white)] p-4 text-center">
                <dd className="font-serif text-xl font-bold text-[var(--jaggery-brown)]">500g</dd>
                <dt className="mt-1 text-xs text-[var(--dark-text)]/60">
                  per pack
                </dt>
              </div>
              <div className="rounded-2xl border border-black/5 bg-[var(--white)] p-4 text-center">
                <dd className="font-serif text-xl font-bold text-[var(--jaggery-brown)]">
                  {SHELF_LIFE_MONTHS}
                </dd>
                <dt className="mt-1 text-xs text-[var(--dark-text)]/60">
                  month shelf life
                </dt>
              </div>
            </dl>

            <Link
              href="/products"
              className="mt-8 inline-block rounded-full bg-[var(--jaggery-brown)] px-7 py-3.5 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)]"
            >
              SHOP NOW
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl bg-[var(--white)] p-6 shadow-sm">
            <Image
              src="/images/farm-to-jar.png"
              alt="Traditional jaggery making"
              width={1200}
              height={800}
              className="h-full w-full rounded-xl object-cover"
            />
          </div>
        </section>

        <Founders />

        <section className="mt-20">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
            From an idea to chocolatey jaggery
          </p>
          <h2 className="mt-3 text-2xl font-bold text-[var(--dark-text)]">
            Today, that little idea has grown into three unique flavours
          </h2>

          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {products.map((product) => (
              <li key={product.slug}>
                <Link
                  href={`/products/${product.slug}`}
                  className="block h-full rounded-2xl border border-black/5 bg-[var(--white)] p-5 shadow-sm transition-colors hover:border-[var(--ginger-terracotta)]/40"
                >
                  <span className="block font-serif text-base font-bold text-[var(--dark-text)]">
                    {product.name}
                  </span>
                  <span className="mt-1.5 block text-sm italic text-[var(--dark-text)]/60">
                    {product.flavourNote}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 font-serif text-xl font-bold text-[var(--jaggery-brown)]">
            Nature&apos;s Choice Jaggery
          </p>
          <p className="mt-1 text-base text-[var(--dark-text)]/70">
            Traditional at heart. New in taste.
          </p>
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-bold text-[var(--dark-text)]">
            Why choose Nature&apos;s Choice
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-black/5 bg-[var(--white)] p-6 shadow-sm"
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
                <h3 className="mt-4 font-semibold text-[var(--dark-text)]">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--dark-text)]/65">
                  {value.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-bold text-[var(--dark-text)]">Our process</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {process.map((step, index) => (
              <div key={step.title}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--jaggery-brown)] font-serif text-lg font-bold text-[var(--white)]">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold text-[var(--dark-text)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--dark-text)]/65">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-2xl border border-black/5 bg-[var(--white)] p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[var(--dark-text)]">
            Food safety &amp; compliance
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--dark-text)]/70">
            We are currently finalising our FSSAI licence details and will publish
            the licence number here as soon as it is available. If you need our
            current licence details for your records, please contact us and we
            will share them directly.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-full border border-[var(--jaggery-brown)] px-6 py-3 text-sm font-semibold text-[var(--jaggery-brown)] transition-colors hover:bg-[var(--jaggery-brown)] hover:text-[var(--white)]"
          >
            REQUEST LICENCE DETAILS
          </Link>
        </section>

        <section className="mt-20 rounded-2xl border border-black/5 bg-[var(--warm-cream)] p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[var(--dark-text)]">
            Come say hello
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--dark-text)]/70">
            Our workshop and packing unit sits in Azamgarh, Uttar Pradesh. If you
            are nearby, come through for a taste. If you are far away, we are only
            a message or a call away.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
                Address
              </p>
              <address className="mt-2 text-sm not-italic leading-relaxed text-[var(--dark-text)]">
                {brand.address.line1}
                <br />
                {brand.address.line2}
                <br />
                {brand.address.cityState} {brand.address.pincode}
                <br />
                {brand.address.country}
              </address>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
                Talk to us
              </p>
              <div className="mt-2 flex flex-col gap-1.5 text-sm">
                <a
                  href={whatsappLink("Hi, I saw your website and have a question.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block whitespace-nowrap font-medium text-[var(--natural-green)] transition-colors hover:text-[var(--ginger-terracotta)]"
                >
                  WhatsApp {brand.phoneDisplay}
                </a>
                <a
                  href={`tel:${brand.phoneDial}`}
                  className="inline-block whitespace-nowrap text-[var(--dark-text)] transition-colors hover:text-[var(--ginger-terracotta)]"
                >
                  Call {brand.phoneDisplay}
                </a>
                <a
                  href={`mailto:${brand.email}`}
                  className="text-[var(--dark-text)] transition-colors hover:text-[var(--ginger-terracotta)]"
                >
                  {brand.email}
                </a>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
                Follow us
              </p>
              <div className="mt-3">
                <SocialLinks withLabels />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={whatsappLink("Hi, I would like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              ORDER ON WHATSAPP
            </a>
            <Link
              href="/contact"
              className="inline-block rounded-full border border-[var(--jaggery-brown)] px-6 py-3 text-sm font-semibold text-[var(--jaggery-brown)] transition-colors hover:bg-[var(--jaggery-brown)] hover:text-[var(--white)]"
            >
              CONTACT US
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}