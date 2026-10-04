import Image from 'next/image';

export default function OurStoryPreview() {
  return (
    <section className="py-16 bg-[var(--warm-cream)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
              Our Story
            </p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[var(--dark-text)]">
              The New Age of Indian Jaggery
            </h2>
            <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-6">
              Founded with a vision to redefine jaggery for the modern era, Nature's Choice 
              Jaggery brings together ancient wisdom and contemporary taste. Our journey 
              began in the fertile fields of Maharashtra, where sugarcane has been cultivated 
              for centuries using traditional, sustainable methods.
            </p>
            <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-6">
              What started as a family tradition of gold-kettle jaggery making has grown into 
              a brand trusted by thousands of households. We remain committed to transparency, 
              quality, and preserving India's rich culinary heritage while making it accessible 
              for everyday enjoyment.
            </p>
            <div className="flex gap-3">
              <span className="bg-[var(--jaggery-brown)] text-[var(--white)] px-4 py-2 rounded-full text-sm font-medium">
                10+ Years of Excellence
              </span>
              <span className="bg-[var(--ginger-terracotta)] text-[var(--white)] px-4 py-2 rounded-full text-sm font-medium">
                50,000+ Happy Customers
              </span>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/desi-elaichi-chocolatey-jaggery-06.jpeg"
              alt="Founder story"
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
