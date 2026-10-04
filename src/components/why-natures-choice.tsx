import Image from 'next/image';

export default function WhyNaturesChoice() {
  return (
    <section className="py-16 bg-[var(--jaggery-brown)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
              Why Choose Nature's Choice
            </p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[var(--white)] leading-tight mb-6">
              Premium Quality You Can Trust
            </h2>
            <p className="text-[var(--white)]/80 text-base leading-relaxed mb-6">
              We believe in delivering the finest jaggery - pure, natural, and unadulterated. 
              From farm to jar, every step is handled with care and tradition.
            </p>
            <ul className="space-y-4 text-[var(--white)]/90 text-base">
              <li className="flex items-start">
                <svg className="w-5 h-5 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Pure & Natural</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>No Additives</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Traditional Method</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Lab Tested</span>
              </li>
            </ul>
          </div>
          <div className="relative">
            <Image
              src="/images/product1/03.jpeg"
              alt="Premium jaggery products"
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

