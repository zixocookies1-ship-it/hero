import Image from "next/image";

export default function About() {
  return (
    <main className="pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
            About Nature's Choice
          </p>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-[var(--dark-text)]">
            The Story Behind
            <span className="text-[var(--jaggery-brown)]">Our Jaggery</span>
          </h1>
        </div>

        {/* Our Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <div>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-6">
              Our Story
            </p>
            <h2 className="text-3xl font-serif font-bold text-[var(--jaggery-brown)] mb-6">
              From Farm to Family
            </h2>
            <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-6">
              Nature's Choice Jaggery was founded in 2014 with a simple mission: to bring 
              the authentic taste of traditional Indian jaggery to modern households. What 
              started as a family tradition of gold-kettle cooking in the villages of 
              Maharashtra has grown into a brand trusted by over 50,000 households across 
              India.
            </p>
            <p className="text-[var(--dark-text)]/80 text-base leading-relaxed">
              Our journey began when our founder, Arjun Patel, noticed that the jaggery 
              available in markets was often adulterated or poorly processed. He decided 
              to go back to the ancient gold-kettle method, using pure clay pots and 
              natural wood fire to preserve the natural minerals and complex flavours 
              that commercial processing destroys.
            </p>
            <div className="mt-8 pt-8 border-t border-border-style border-white/10">
              <p className="text-[var(--white)]/70 text-base">
                <span className="font-medium text-[var(--white)]">10+ Years</span> of 
                excellence 
                <span className="mx-2">|</span>
                <span className="font-medium text-[var(--white)]">50,000+</span> happy 
                families 
                <span className="mx-2">|</span>
                <span className="font-medium text-[var(--white)]">3</span> authentic 
                flavours
              </p>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/desi-elaichi-chocolatey-jaggery-05.jpeg"
              alt="Founder Arjun Patel"
              width={500}
              height={400}
              className="rounded-2xl object-cover transition-transform hover:scale-[1.02] duration-300"
            />
            <div className="absolute -bottom-4 -right-4 bg-[var(--jaggery-brown)] text-[var(--white)] px-4 py-2 rounded text-sm font-medium">
              Founder Arjun Patel
            </div>
          </div>
        </div>

        {/* Why Nature's Choice - merged from spec */}
        <div className="mb-20">
          <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-6">
            Why Choose Nature's Choice
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="border border-border-style rounded-2xl p-6 bg-white transition-colors hover:shadow-lg">
              <div className="w-10 h-10 rounded-full bg-[var(--ginger-terracotta)] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[var(--white)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-2 5.586 3.093 3.237c.39.41.391.924.001 1.323l-2.328 1.552c-.39.41-1.019.41-1.411 0L3.073 15.35a1 1 0 0 1-1.41-.593l-1.324-1.767 3.094-3.237a1 1 0 0 1 0-1.324l3.305 1.655 1.608-3.237a1 1 0 0 1 .306-.306l1.766 1.324z" />
                </svg>
              </div>
              <div>
                <h4 className="text-base font-medium text-[var(--dark-text)]">Pure & Natural</h4>
                <p className="text-[var(--dark-text)]/70 text-sm mt-1">
                  No additives, no preservatives - just pure, unadulterated jaggery.
                </p>
              </div>
            </div>
            <div className="border border-border-style rounded-2xl p-6 bg-white transition-colors hover:shadow-lg">
              <div className="w-10 h-10 rounded-full bg-[var(--ginger-terracotta)] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[var(--white)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-base font-medium text-[var(--dark-text)]">Traditional Method</h4>
                <p className="text-[var(--dark-text)]/70 text-sm mt-1">
                  Gold-kettle process using clay pots and natural wood fire.
                </p>
              </div>
            </div>
            <div className="border border-border-style rounded-2xl p-6 bg-white transition-colors hover:shadow-lg">
              <div className="w-10 h-10 rounded-full bg-[var(--ginger-terracotta)] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[var(--white)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-base font-medium text-[var(--dark-text)]">Lab Tested</h4>
                <p className="text-[var(--dark-text)]/70 text-sm mt-1">
                  Every batch tested for purity and safety standards.
                </p>
              </div>
            </div>
            <div className="border border-border-style rounded-2xl p-6 bg-white transition-colors hover:shadow-lg">
              <div className="w-10 h-10 rounded-full bg-[var(--ginger-terracotta)] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[var(--white)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-base font-medium text-[var(--dark-text)]">Sustainable</h4>
                <p className="text-[var(--dark-text)]/70 text-sm mt-1">
                  Regenerative farming practices that protect the land.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sourcing - merged from spec */}
        <div className="mb-20">
          <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-6">
            Sustainable Sourcing
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-serif text-[var(--jaggery-brown)] mb-4">
                Our Farmer Partners
              </h3>
              <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-6">
                We work with 50+ organic family farms in Maharashtra, India. Each partner 
                farm follows regenerative agriculture practices that protect the soil, 
                conserve water, and promote biodiversity. Farmers receive fair trade prices 
                and support for sustainable certification.
              </p>
              <ul className="space-y-3 text-[var(--dark-text)]/80 text-sm">
                <li className="flex items-start">
                  <svg className="w-4 h-4 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Organic certified farms</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Fair trade pricing</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Sustainable practices</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-serif text-[var(--jaggery-brown)] mb-4">
                Supply Chain Transparency
              </h3>
              <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-6">
                From the moment sugarcane is harvested to the final jar, every step of our 
                supply chain is tracked and transparent. We believe consumers have the right 
                to know exactly where their food comes from and how it's made.
              </p>
              <ul className="space-y-3 text-[var(--dark-text)]/80 text-sm">
                <li className="flex items-start">
                  <svg className="w-4 h-4 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Seed to harvest tracking</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Traditional gold-kettle process</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Laboratory quality testing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Process - merged from spec */}
        <div>
          <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-6">
            Our Process
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 rounded-full bg-[var(--jaggery-brown)] flex items-center justify-center text-2xl font-serif text-[var(--white)]">
                1
              </div>
              <h3 className="text-base font-medium text-[var(--dark-text)] mt-4">Sugarcane Harvest</h3>
              <p className="text-[var(--dark-text)]/70 text-sm">
                Fresh sugarcane sourced from partner farms within 24 hours of harvest.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-[var(--ginger-terracotta)] flex items-center justify-center text-2xl font-serif text-[var(--white)]">
                2
              </div>
              <h3 className="text-base font-medium text-[var(--dark-text)] mt-4">Gold-Kettle Process</h3>
              <p className="text-[var(--dark-text)]/70 text-sm">
                Traditional clay pots with natural wood fire for authentic flavour.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-[var(--natural-green)] flex items-center justify-center text-2xl font-serif text-[var(--white)]">
                3
              </div>
              <h3 className="text-base font-medium text-[var(--dark-text)] mt-4">Quality Testing</h3>
              <p className="text-[var(--dark-text)]/70 text-sm">
                Laboratory tested for purity, moisture, and safety standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}