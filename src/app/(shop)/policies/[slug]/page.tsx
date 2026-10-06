import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getPolicy,
  POLICIES,
  type Policy,
} from "@/lib/policies";
import { getShippingPolicy } from "@/lib/pricing";
import { formatPrice } from "@/lib/products";

/**
 * Policy pages are dynamic because the shipping policy embeds the live
 * delivery charge from the shipping configuration. Keeping that read on the
 * server means the printed figures can never drift from what is charged.
 */
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  return {
    title: policy ? `${policy.title} | Nature's Choice Jaggery` : "Policies",
  };
}

/**
 * Fills the shipping-charge tokens (`{{deliveryFee}}`, `{{freeAbove}}`) with
 * the live configured values. A sentence whose token has no configured value
 * (e.g. the free-delivery line when no threshold is set) is dropped whole,
 * rather than rendering a dangling placeholder.
 */
function withLiveShippingCharges(template: Policy): Policy {
  const shipping = getShippingPolicy();
  const tokens: Record<string, string | null> = {
    deliveryFee: formatPrice(shipping.feeInr),
    freeAbove:
      shipping.freeAboveInr !== null
        ? formatPrice(shipping.freeAboveInr)
        : null,
  };
  const fill = (value: string) =>
    value.replace(/\{\{(\w+)\}\}/g, (whole, name: string) => {
      const replacement = tokens[name];
      return replacement === undefined || replacement === null
        ? whole
        : replacement;
    });

  return {
    ...template,
    intro: fill(template.intro),
    sections: template.sections
      .map((section) => ({
        ...section,
        body: section.body
          .map((paragraph) => fill(paragraph))
          .filter(
            (paragraph) =>
              paragraph.length > 0 && !paragraph.includes("{{")
          ),
      }))
      .filter((section) => section.body.length > 0),
  };
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const template = getPolicy(slug);
  if (!template) notFound();

  const policy = withLiveShippingCharges(template);

  return (
    <main className="min-h-screen pb-24">
      <section className="bg-[var(--jaggery-brown)] pb-16 pt-40 text-[var(--white)]">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
            Policies &amp; Legal
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold">
            {policy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--white)]/80">
            {policy.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[280px_1fr]">
        <aside>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--jaggery-brown)]">
            All policies
          </h2>
          <ul className="mt-4 space-y-1">
            {POLICIES.map((entry) => {
              const active = entry.slug === policy.slug;
              return (
                <li key={entry.slug}>
                  <Link
                    href={`/policies/${entry.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      active
                        ? "bg-[var(--jaggery-brown)] font-semibold text-[var(--white)]"
                        : "text-[var(--dark-text)]/75 transition-colors hover:bg-black/5 hover:text-[var(--jaggery-brown)]"
                    }`}
                  >
                    {entry.navTitle}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <article className="rounded-2xl border border-black/5 bg-[var(--white)] p-6 sm:p-10">
          {policy.sections.map((section, index) => (
            <section
              key={`${policy.slug}-${index}`}
              className={index > 0 ? "mt-10 border-t border-black/5 pt-8" : ""}
            >
              <h2 className="text-xl font-bold text-[var(--jaggery-brown)]">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph, paragraphIndex) => (
                  <p
                    key={paragraphIndex}
                    className="text-sm leading-relaxed text-[var(--dark-text)]/80"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-10 rounded-xl bg-[var(--warm-cream)] p-5 text-sm text-[var(--dark-text)]/80">
            Questions about this policy?{" "}
            <Link
              href="/contact"
              className="font-semibold text-[var(--jaggery-brown)] underline underline-offset-4 hover:text-[var(--ginger-terracotta)]"
            >
              Contact us
            </Link>
            .
          </div>
        </article>
      </section>
    </main>
  );
}