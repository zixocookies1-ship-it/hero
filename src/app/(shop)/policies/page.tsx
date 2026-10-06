import type { Metadata } from "next";
import Link from "next/link";

import { POLICIES } from "@/lib/policies";

export const metadata: Metadata = {
  title: "Policies & Legal | Nature's Choice Jaggery",
  description:
    "Shipping, delivery, returns, cancellations, privacy and terms for Nature's Choice Jaggery.",
};

export default function PoliciesIndexPage() {
  return (
    <main className="min-h-screen pb-24">
      <section className="bg-[var(--jaggery-brown)] pb-16 pt-40 text-[var(--white)]">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
            Policies &amp; Legal
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold">
            Policies &amp; Legal
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--white)]/80">
            Everything about ordering, delivery, returns, privacy and the terms
            that apply to this website.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {POLICIES.map((policy) => (
            <Link
              key={policy.slug}
              href={`/policies/${policy.slug}`}
              className="group rounded-2xl border border-black/5 bg-[var(--white)] p-6 transition-colors hover:border-[var(--jaggery-brown)]/30"
            >
              <h2 className="text-lg font-bold text-[var(--jaggery-brown)] group-hover:text-[var(--ginger-terracotta)]">
                {policy.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--dark-text)]/75">
                {policy.shortDescription}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}