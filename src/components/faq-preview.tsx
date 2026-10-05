"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How is your jaggery made?",
    answer:
      "We use the gold-kettle method: sugarcane juice is slow-cooked in pure clay pots over natural wood fire until the sugars concentrate and the jaggery sets. Nothing is refined afterwards, and no preservatives are added.",
  },
  {
    question: "Is your jaggery suitable for diabetics?",
    answer:
      "Jaggery still contains natural sugars, so it should be eaten in moderation. If you have diabetes or are managing your blood sugar, please check with your doctor before including it in your diet.",
  },
  {
    question: "How should I store it?",
    answer:
      "Keep the jar tightly sealed in a cool, dry place away from direct sunlight. If it hardens slightly, warm it gently in the sun or over low heat and it will soften again.",
  },
  {
    question: "What is the shelf life?",
    answer:
      "18 months from the manufacturing date when stored as directed. Because we do not add preservatives, it is best used within that period for the fullest flavour.",
  },
  {
    question: "Do you ship across India?",
    answer:
      "Yes. We ship within India, and shipping is free on standard orders. Delivery timelines are confirmed when your order is placed.",
  },
  {
    question: "What is the difference between the three flavours?",
    answer:
      "Desi Chocolatey is our classic deep, malty jaggery. Desi Elaichi adds green cardamom and roasted sesame. Desi Til is made with roasted sesame for a warmer, nuttier taste. All three are 500g and contain no preservatives.",
  },
];

export default function FAQPreview() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section>
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
            FAQ
          </p>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--dark-text)]">
            Quick answers
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-black/5 bg-[var(--white)] shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-[var(--dark-text)]">
                    {faq.question}
                  </span>
                  <svg
                    className={`h-4 w-4 flex-shrink-0 text-[var(--ginger-terracotta)] transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--dark-text)]/70">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}