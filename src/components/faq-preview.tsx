export default function FAQPreview() {
  return (
    <section className="py-16 bg-[var(--warm-cream)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
            FAQ Preview
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[var(--dark-text)]">
            Quick Answers
          </h2>
        </div>
        <div className="space-y-4">
          <div className="border border-border-style rounded-2xl p-6 bg-white">
            <div className="flex justify-between items-center cursor-pointer hover:text-[var(--ginger-terracotta)] transition-colors">
              <p className="text-[var(--dark-text)] font-medium">Is jaggery healthier than sugar?</p>
              <svg className="w-5 h-5 text-[var(--ginger-terracotta)] transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[var(--dark-text)]/80 text-base mt-4 hidden">
              Yes, jaggery retains the natural minerals from sugarcane juice including iron, magnesium, and potassium, unlike refined sugar which is stripped of all nutrients.
            </p>
          </div>
          <div className="border border-border-style rounded-2xl p-6 bg-white">
            <div className="flex justify-between items-center cursor-pointer hover:text-[var(--ginger-terracotta)] transition-colors">
              <p className="text-[var(--dark-text)] font-medium">How should I store jaggery?</p>
              <svg className="w-5 h-5 text-[var(--ginger-terracotta)] transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[var(--dark-text)]/80 text-base mt-4 hidden">
              Store in an airtight container in a cool, dry place. Avoid direct sunlight. If it hardens, gently warm it in the sun or with low heat to soften.
            </p>
          </div>
          <div className="border border-border-style rounded-2xl p-6 bg-white">
            <div className="flex justify-between items-center cursor-pointer hover:text-[var(--ginger-terracotta)] transition-colors">
              <p className="text-[var(--dark-text)] font-medium">Is jaggery suitable for diabetics?</p>
              <svg className="w-5 h-5 text-[var(--ginger-terracotta)] transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[var(--dark-text)]/80 text-base mt-4 hidden">
              While jaggery has a lower glycemic index than refined sugar and contains minerals, it is still a form of natural sugar. Diabetics should consume it in moderation and consult their healthcare provider.
            </p>
          </div>
          <div className="border border-border-style rounded-2xl p-6 bg-white">
            <div className="flex justify-between items-center cursor-pointer hover:text-[var(--ginger-terracotta)] transition-colors">
              <p className="text-[var(--dark-text)] font-medium">What's the shelf life?</p>
              <svg className="w-5 h-5 text-[var(--ginger-terracotta)] transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[var(--dark-text)]/80 text-base mt-4 hidden">
              18 months from manufacturing date when stored properly. No preservatives added.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}