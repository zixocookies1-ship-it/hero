import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND, whatsappLink } from "@/lib/brand";
import SocialLinks from "@/components/social-links";

export const metadata: Metadata = {
  title: "About - Nature's Choice Jaggery",
  description:
    "The story behind Nature's Choice Jaggery - traditional gold-kettle cooking, partner farms in Uttar Pradesh, and three authentic flavours.",
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

export default function AboutPage() {
  return (
    <main className="pt-28 pb-24">
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
              From farm to family
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--dark-text)]/75">
              Nature&apos;s Choice Jaggery started with a gap between what jaggery
              used to taste like and what was easy to buy. So we went back to the
              gold-kettle method that our families had used for generations - pure
              clay pots, natural wood fire, and enough time for the sweetness to
              develop properly.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--dark-text)]/75">
              That process has not changed. What we added is modern hygiene and
              batch testing, so the jar you receive tastes the same every time.
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
                <dd className="font-serif text-xl font-bold text-[var(--jaggery-brown)]">18</dd>
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
                {BRAND.address.line1}
                <br />
                {BRAND.address.line2}
                <br />
                {BRAND.address.cityState} {BRAND.address.pincode}
                <br />
                {BRAND.address.country}
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
                  className="font-medium text-[var(--natural-green)] transition-colors hover:text-[var(--ginger-terracotta)]"
                >
                  WhatsApp {BRAND.phoneDisplay}
                </a>
                <a
                  href={`tel:${BRAND.phoneDial}`}
                  className="text-[var(--dark-text)] transition-colors hover:text-[var(--ginger-terracotta)]"
                >
                  Call {BRAND.phoneDisplay}
                </a>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="text-[var(--dark-text)] transition-colors hover:text-[var(--ginger-terracotta)]"
                >
                  {BRAND.email}
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