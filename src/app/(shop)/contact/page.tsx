import type { Metadata } from "next";
import { addressLineOf } from "@/lib/brand";
import ContactForm from "./contact-form";
import FAQPreview from "@/components/faq-preview";
import SocialLinks from "@/components/social-links";
import { loadBrand, loadSections } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Contact - Nature's Choice Jaggery",
  description:
    "Questions about our jaggery, wholesale enquiries or partnerships? Send us a message and we will get back to you.",
};

export default async function ContactPage() {
  const [brand, sections] = await Promise.all([loadBrand(), loadSections()]);
  const faq = sections.contact_faq;

  // The phone number lives in the footer and the floating WhatsApp button, so
  // it is deliberately absent here.
  const contactDetails = [
    { label: "Email", value: brand.email, href: `mailto:${brand.email}` },
    { label: "Address", value: addressLineOf(brand), href: undefined },
  ];

  return (
    <main className="pt-28 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
            Get in touch
          </p>
          <h1 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--dark-text)]">
            Let&apos;s connect
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--dark-text)]/70">
            Questions about our jaggery, a wholesale enquiry, or you just want to
            say hello? Send us a message and we will get back to you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            {contactDetails.map((detail) => (
              <div
                key={detail.label}
                className="rounded-2xl border border-black/5 bg-[var(--white)] p-5 shadow-sm"
              >
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
                  {detail.label}
                </p>
                {detail.href ? (
                  <a
                    href={detail.href}
                    target={detail.href.startsWith("http") ? "_blank" : undefined}
                    rel={detail.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="mt-2 block text-base text-[var(--dark-text)] transition-colors hover:text-[var(--ginger-terracotta)]"
                  >
                    {detail.value}
                  </a>
                ) : (
                  <p className="mt-2 text-base text-[var(--dark-text)]">{detail.value}</p>
                )}
              </div>
            ))}

            <div className="overflow-hidden rounded-2xl border border-black/5 bg-[var(--white)] shadow-sm">
              <iframe
                title="Nature's Choice Jaggery location"
                src="https://www.google.com/maps?q=316+Puranapul,+Harbanshpur,+Azamgarh,+Uttar+Pradesh+276001&output=embed"
                className="h-72 w-full"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            <div className="rounded-2xl border border-black/5 bg-[var(--white)] p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
                Follow us
              </p>
              <div className="mt-3">
                <SocialLinks withLabels />
              </div>
            </div>
          </div>

          <ContactForm whatsappNumber={brand.whatsappNumber} />
        </div>
      </div>

      <div className="mt-16">
        <FAQPreview
          items={faq?.items}
          eyebrow={faq?.eyebrow}
          title={faq?.title}
        />
      </div>
    </main>
  );
}