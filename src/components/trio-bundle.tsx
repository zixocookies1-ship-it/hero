import Image from 'next/image';

export default function TrioBundle() {
  return (
    <section className="py-16 bg-[var(--jaggery-brown)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
              Trio Bundle
            </p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[var(--white)]">
              Save 15% on Our Best-Selling Set
            </h2>
            <p className="text-[var(--white)]/80 text-base leading-relaxed mb-6">
              Get all three authentic flavours in one convenient package. Perfect for 
              exploring the diverse taste of Indian jaggery or gifting to loved ones.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-border-style rounded-xl p-6 bg-[var(--white)] hover:shadow-lg transition-shadow">
                <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-3">Desi Chocolatey</p>
                <h3 className="text-xl font-serif text-[var(--white)]">Classic Deep Brown</h3>
                <p className="text-[var(--white)]/80 text-base">500g Ã— 1</p>
                <p className="text-[var(--white)] font-medium text-3xl">â‚¹199</p>
              </div>
              <div className="border border-border-style rounded-xl p-6 bg-[var(--white)] hover:shadow-lg transition-shadow">
                <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-3">Desi Elaichi</p>
                <h3 className="text-xl font-serif text-[var(--white)]">Cardamom Infused</h3>
                <p className="text-[var(--white)]/80 text-base">500g Ã— 1</p>
                <p className="text-[var(--white)] font-medium text-3xl">â‚¹219</p>
              </div>
              <div className="border border-border-style rounded-xl p-6 bg-[var(--white)] hover:shadow-lg transition-shadow">
                <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-3">Desi Til</p>
                <h3 className="text-xl font-serif text-[var(--white)]">Nutty Sesame</h3>
                <p className="text-[var(--white)]/80 text-base">500g Ã— 1</p>
                <p className="text-[var(--white)] font-medium text-3xl">â‚¹239</p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-border-style">
              <p className="text-[var(--white)]/70 text-base mb-4">You Save: â‚¹45</p>
              <a
                href="/cart"
                className="bg-[var(--ginger-terracotta)] text-[var(--white)] px-8 py-4 rounded-full text-lg font-semibold transition-colors hover-opacity-90"
              >
                BUY TRIO BUNDLE
              </a>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/desi-chocolatey-jaggery-05.jpeg"
              alt="Trio bundle"
              width={600}
              height={400}
              className="rounded-2xl object-cover transition-transform hover:scale-[1.02] duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
