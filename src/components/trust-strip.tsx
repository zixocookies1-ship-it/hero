export default function TrustStrip() {
  return (
    <section className="py-12 bg-[var(--warm-cream)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
              Verified by Our Suppilers
            </p>
            <h3 className="text-2xl font-serif text-[var(--dark-text)]">
              Pure & Natural
            </h3>
            <p className="text-[var(--dark-text)]/70 text-base">
              Sourced directly from organic sugarcane farms in Maharashtra, India.
            </p>
          </div>
          <div>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
              Quality Assured
            </p>
            <h3 className="text-2xl font-serif text-[var(--dark-text)]">
              Laboratory Tested
            </h3>
            <p className="text-[var(--dark-text)]/70 text-base">
              Every batch tested for purity, moisture content, and safety standards.
            </p>
          </div>
          <div>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
              Traditional Process
            </p>
            <h3 className="text-2xl font-serif text-[var(--dark-text)]">
              Gold-Kettle Method
            </h3>
            <p className="text-[var(--dark-text)]/70 text-base">
              Time-honored technique using pure clay pots and natural wood fire.
            </p>
          </div>
          <div>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
              Freshness Guaranteed
            </p>
            <h3 className="text-2xl font-serif text-[var(--dark-text)]">
              18-Month Shelf Life
            </h3>
            <p className="text-[var(--dark-text)]/70 text-base">
              No preservatives, no additives - just natural goodness.
            </p>
          </div>
          <div>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
              Sustainable Farming
            </p>
            <h3 className="text-2xl font-serif text-[var(--dark-text)]">
              Earth-Friendly
            </h3>
            <p className="text-[var(--dark-text)]/70 text-base">
              Regenerative agriculture practices that protect the land and communities.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}