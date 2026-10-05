import Link from "next/link";
import { BRAND, addressLine, whatsappLink } from "@/lib/brand";
import SocialLinks from "@/components/social-links";

export default function ContactBar() {
  return (
    <section className="bg-[var(--warm-cream)] py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-black/5 bg-[var(--white)] p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
              Visit us
            </p>
            <address className="mt-2 text-sm not-italic leading-relaxed text-[var(--dark-text)]">
              {addressLine()}
            </address>
          </div>

          <div className="rounded-2xl border border-black/5 bg-[var(--white)] p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
              Talk to us
            </p>
            <div className="mt-2 flex flex-col gap-1.5 text-sm">
              <a
                href={whatsappLink("Hi, I have a question about your jaggery.")}
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

          <div className="rounded-2xl border border-black/5 bg-[var(--white)] p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
              Follow us
            </p>
            <div className="mt-3">
              <SocialLinks />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-center">
          <Link
            href="/contact"
            className="text-sm font-medium text-[var(--jaggery-brown)] underline underline-offset-4 transition-colors hover:text-[var(--ginger-terracotta)]"
          >
            Send us a message
          </Link>
        </div>
      </div>
    </section>
  );
}