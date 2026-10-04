import Image from 'next/image';

export default function FarmToJar() {
  return (
    <section className="py-16 bg-[var(--white)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
              Farm to Jar
            </p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[var(--dark-text)]">
              Pure Journey
            </h2>
            <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-6">
              We trace every batch from sustainable sugarcane farms to your kitchen. 
              Our gold-kettle method preserves the natural nutrients and authentic flavour 
              that commercial processing often destroys.
            </p>
            <div className="space-y-4 text-[var(--dark-text)]/90 text-base">
              <div className="flex items-start">
                <svg className="w-5 h-5 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="ml-3">
                  <p className="font-medium">Sustainable Farms</p>
                  <p>Partnering with organic farms in Maharashtra</p>
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="ml-3">
                  <p className="font-medium">Gold-Kettle Process</p>
                  <p>Traditional clay pots and natural wood fire</p>
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="ml-3">
                  <p className="font-medium">Quality Control</p>
                  <p>Laboratory tested every batch</p>
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="ml-3">
                  <p className="font-medium">Fresh Delivery</p>
                  <p>Direct from our facility to your door</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/desi-chocolatey-jaggery-06.jpeg"
              alt="Farm to jar process"
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
