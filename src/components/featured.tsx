import Image from 'next/image';

export default function Featured() {
  return (
    <section className="py-16 bg-[var(--warm-cream)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
            Featured & Best Sellers
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[var(--dark-text)]">
            Customer Favorites
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-border-style rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-shadow">
            <Image
              src="/desi-chocolatey-jaggery-04.jpeg"
              alt="Best seller jaggery"
              width={400}
              height={300}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-3">
                Best Seller
              </p>
              <h3 className="text-xl font-serif text-[var(--dark-text)]">
                Desi Chocolatey Jaggery (500g)
              </h3>
              <p className="text-[var(--dark-text)]/70 text-base mb-4">
                Our most popular blend - rich and authentic.
              </p>
              <p className="text-[var(--jaggery-brown)] font-medium">
                â‚¹199
              </p>
            </div>
          </div>

          <div className="border border-border-style rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-shadow">
            <Image
              src="/desi-elaichi-chocolatey-jaggery-03.jpeg"
              alt="Elaichi jaggery"
              width={400}
              height={300}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-3">
                New Arrival
              </p>
              <h3 className="text-xl font-serif text-[var(--dark-text)]">
                Desi Elaichi Jaggery (500g)
              </h3>
              <p className="text-[var(--dark-text)]/70 text-base mb-4">
                Cardamom-infused sweetness.
              </p>
              <p className="text-[var(--jaggery-brown)] font-medium">
                â‚¹219
              </p>
            </div>
          </div>

          <div className="border border-border-style rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-shadow">
            <Image
              src="/desi-til-chocolatey-jaggery-03.jpeg"
              alt="Til jaggery"
              width={400}
              height={300}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-3">
                Premium Choice
              </p>
              <h3 className="text-xl font-serif text-[var(--dark-text)]">
                Desi Til Jaggery (500g)
              </h3>
              <p className="text-[var(--dark-text)]/70 text-base mb-4">
                Sesame-enriched goodness.
              </p>
              <p className="text-[var(--jaggery-brown)] font-medium">
                â‚¹239
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
