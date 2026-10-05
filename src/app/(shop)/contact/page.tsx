import type { Metadata } from "next";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "Contact - Nature's Choice Jaggery",
  description:
    "Questions about our jaggery, wholesale enquiries or partnerships? Send us a message and we will get back to you.",
};

const contactDetails = [
  { label: "Email", value: "support@natureschoicejaggery.com" },
  { label: "Phone", value: "+91 98765 43210" },
  { label: "Office", value: "Mumbai, Maharashtra, India" },
];

export default function ContactPage() {
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
                <p className="mt-2 text-base text-[var(--dark-text)]">{detail.value}</p>
              </div>
            ))}

            <div className="overflow-hidden rounded-2xl border border-black/5 bg-[var(--white)] shadow-sm">
              <iframe
                title="Nature's Choice Jaggery location"
                src="https://www.google.com/maps?q=Mumbai,Maharashtra,India&output=embed"
                className="h-72 w-full"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>

          <ContactForm />
        </div>
      </div>
    </main>
  );
}