export default function FinalCTA() {
  return (
    <section className="py-16 bg-[var(--jaggery-brown)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center py-20">
          <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-6">
            The New Age of Indian Jaggery
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[var(--white)] leading-tight mb-6">
            Start Your Authentic Jaggery Journey Today
          </h2>
          <p className="text-[var(--white)]/80 text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Join thousands of customers who have discovered the authentic taste of Indian jaggery. 
            Premium quality, delivered to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/cart"
              className="bg-[var(--white)] text-[var(--jaggery-brown)] px-8 py-4 rounded-full text-lg font-semibold transition-colors hover:bg-[var(--warm-cream)]"
            >
              SHOP NOW
            </a>
            <a
              href="/about"
              className="border border-[var(--white)] text-[var(--white)] px-8 py-4 rounded-full text-lg font-medium transition-colors hover:bg-[var(--warm-cream)]"
            >
              LEARN MORE
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}