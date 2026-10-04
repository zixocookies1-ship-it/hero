import Image from 'next/image';

export default function ProductPage() {
  return (
    <main className="pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="mb-6">
              <Image
                src="/desi-chocolatey-jaggery-01.jpeg"
                alt="Desi Chocolatey Jaggery 500g"
                width={600}
                height={400}
                className="rounded-2xl object-cover mb-6"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[var(--dark-text)]">
              Desi Chocolatey Jaggery
            </h1>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium uppercase mb-4">
              Classic Deep Brown
            </p>
            <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-6">
              Rich, traditional flavour with notes of caramel and molasses. Made using 
              the gold-kettle method in pure clay pots.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <p className="text-[var(--ginger-terracotta)] font-medium">Price</p>
                <p className="text-3xl font-bold text-[var(--jaggery-brown)]">â‚¹239</p>
              </div>
              <div>
                <p className="text-[var(--ginger-terracotta)] font-medium">Weight</p>
                <p className="text-3xl font-bold">500g</p>
              </div>
            </div>
            <div>
              <p className="text-[var(--ginger-terracotta)] font-medium">Stock</p>
              <p className="text-[var(--ginger-terracotta)] font-medium">In Stock</p>
            </div>
            <div className="mt-8">
              <p className="text-[var(--ginger-terracotta)] font-medium">Category</p>
              <p className="text-[var(--dark-text)]/80">Jaggery â€¢ Traditional</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[var(--ginger-terracotta)] font-medium">Description</p>
              <p className="text-[var(--dark-text)]/80 text-base leading-relaxed">
                Our Desi Chocolatey Jaggery is the epitome of traditional Indian sweetness. 
                Made from organically grown sugarcane in the fertile fields of Maharashtra, 
                this jaggery is processed using the ancient gold-kettle method in pure. 
                clay pots over natural wood fire, which preserves the natural molasses and 
                complex flavour compounds that commercial refining destroys.
              </p>
            </div>
            <div>
              <p className="text-[var(--ginger-terracotta)] font-medium">Health Benefits</p>
              <ul className="space-y-2 text-[var(--dark-text)]/80 text-sm">
                <li className="flex items-start">
                  <svg className="w-4 h-4 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Rich in iron and minerals</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Natural energy booster</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 flex-shrink-0 text-[var(--ginger-terracotta)] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Aids digestion</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}




