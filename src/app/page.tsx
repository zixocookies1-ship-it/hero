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
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/hero banner.png"
          alt="Nature's Choice Jaggery hero banner"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--warm-cream)]/40 via-white/20 to-[var(--warm-cream)]/50" />
        <div className="relative z-10 text-center max-w-5xl px-6 py-24">
          <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
            The New Age of Indian Jaggery
          </p>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[var(--dark-text)] leading-tight mb-6 drop-shadow-sm">
            Experience Authentic
            <span className="block text-[var(--jaggery-brown)]">Indian Jaggery</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--dark-text)]/90 max-w-2xl mx-auto mb-8 leading-relaxed">
            Premium, naturally processed jaggery from the finest Indian sugarcane farms. 
            A modern twist on tradition, crafted for everyday enjoyment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/products"
              className="bg-[var(--jaggery-brown)] text-[var(--white)] px-6 py-3 rounded-full text-base font-semibold transition-colors hover:bg-[var(--ginger-terracotta)]"
            >
              SHOP NOW
            </a>
            <a
              href="/about"
              className="border border-[var(--jaggery-brown)] text-[var(--jaggery-brown)] px-6 py-3 rounded-full text-base font-medium transition-colors hover:bg-[var(--warm-cream)]/60"
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


