import Image from 'next/image';

export default function UGC() {
  return (
    <section className="py-16 bg-[var(--warm-cream)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
            User Generated Content
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[var(--dark-text)]">
            Share the Love
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-border-style rounded-2xl p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Image
                src="/images/product1/02.jpeg"
                alt="UGC post 1"
                width={80}
                height={80}
                className="w-16 h-16 rounded-full object-cover mr-4 flex-shrink-0"
              />
              <div>
                <p className="font-medium text-[var(--dark-text)]">@sarah_foodie</p>
                <p className="text-xs text-[var(--dark-text)]/60">May 2024</p>
              </div>
            </div>
            <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-4">
              "My family loves the desi chocolatey jaggery! It's become staple in our home."
            </p>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium">
              #Nature'sChoice #JaggeryLover #Foodie
            </p>
          </div>

          <div className="border border-border-style rounded-2xl p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Image
                src="/images/product 2/02.jpeg"
                alt="UGC post 2"
                width={80}
                height={80}
                className="w-16 h-16 rounded-full object-cover mr-4 flex-shrink-0"
              />
              <div>
                <p className="font-medium text-[var(--dark-text)]">@kitchen.with.rani</p>
                <p className="text-xs text-[var(--dark-text)]/60">May 2024</p>
              </div>
            </div>
            <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-4">
              "The elaichi jaggery is a game-changer for my chai. Such authentic flavour!"
            </p>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium">
              #TraditionalTaste #ElaichiLove #HealthySwap
            </p>
          </div>

          <div className="border border-border-style rounded-2xl p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Image
                src="/images/product 3/11.jpg.jpeg"
                alt="UGC post 3"
                width={80}
                height={80}
                className="w-16 h-16 rounded-full object-cover mr-4 flex-shrink-0"
              />
              <div>
                <p className="font-medium text-[var(--dark-text)]">@wellness.with.jaggery</p>
                <p className="text-xs text-[var(--dark-text)]/60">May 2024</p>
              </div>
            </div>
            <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-4">
              "Finally a natural sweetener that actually tastes good and is good for you!"
            </p>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium">
              #HealthyLiving #JaggeryBenefits #NaturalFood
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

