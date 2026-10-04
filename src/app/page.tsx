import Image from "next/image";
import TrustStrip from "@/components/trust-strip";
import ThreeFlavours from "@/components/three-flavours";
import WhyNaturesChoice from "@/components/why-natures-choice";
import Featured from "@/components/featured";
import FarmToJar from "@/components/farm-to-jar";
import OurStoryPreview from "@/components/our-story-preview";
import Reviews from "@/components/reviews";
import UGC from "@/components/ugc";
import TrioBundle from "@/components/trio-bundle";
import Recipes from "@/components/recipes";
import FAQPreview from "@/components/faq-preview";
import FinalCTA from "@/components/final-cta";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      {/* 1. HERO */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[var(--warm-cream)] to-[var(--white)]">
        <Image
          src="/images/product1/01.jpeg"
          alt="Nature's Choice Jaggery premium product"
          width={800}
          height={600}
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 transform rotate-[-2deg] object-cover w-full max-w-[600px]"
          priority
        />
        <div className="relative z-10 text-center max-w-5xl px-6 py-24">
          <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-6">
            The New Age of Indian Jaggery
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-[var(--dark-text)] leading-tight mb-6">
            Experience Authentic
            <span className="text-[var(--jaggery-brown)]">Jaggery</span>
            Like Never Before
          </h1>
          <p className="text-lg md:text-xl text-[var(--dark-text)]/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            Premium, naturally processed jaggery from the finest Indian sugarcane farms. 
            A modern twist on tradition, crafted for everyday enjoyment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/products"
              className="bg-[var(--jaggery-brown)] text-[var(--white)] px-8 py-4 rounded-full text-lg font-semibold transition-colors hover:bg-[var(--ginger-terracotta)]"
            >
              SHOP NOW
            </a>
            <a
              href="/about"
              className="border border-[var(--jaggery-brown)] text-[var(--jaggery-brown)] px-8 py-4 rounded-full text-lg font-medium transition-colors hover:bg-[var(--warm-cream)]"
            >
              EXPLORE OUR STORY
            </a>
          </div>
        </div>
      </section>

      {/* 2. TRUST STRIP */}
      <TrustStrip />

      {/* 3. THREE FLAVOURS */}
      <ThreeFlavours />

      {/* 4. WHY NATURE'S CHOICE */}
      <WhyNaturesChoice />

      {/* 5. FEATURED / BEST SELLER */}
      <Featured />

      {/* 6. FARM TO JAR */}
      <FarmToJar />

      {/* 7. OUR STORY PREVIEW */}
      <OurStoryPreview />

      {/* 8. REVIEWS */}
      <Reviews />

      {/* 9. UGC / SOCIAL PROOF */}
      <UGC />

      {/* 10. TRIO BUNDLE */}
      <TrioBundle />

      {/* 11. RECIPES / WAYS TO ENJOY */}
      <Recipes />

      {/* 12. FAQ PREVIEW */}
      <FAQPreview />

      {/* 13. FINAL CTA */}
      <FinalCTA />

      {/* 14. FOOTER */}
      <Footer />
    </main>
  );
}

