import Image from "next/image";
import Link from "next/link";
import { products } from "@/lib/products";
import PriceDisplay from "@/components/price-display";
import ProductActions from "@/components/product-actions";

const reasons = [
  {
    title: "Pure & Natural",
    body: "No additives, no preservatives, no chemicals - just sugarcane jaggery.",
  },
  {
    title: "Traditional Method",
    body: "Gold-kettle cooking in pure clay pots over natural wood fire.",
  },
  {
    title: "Batch Tested",
    body: "Every batch checked for purity, moisture and consistency.",
  },
  {
    title: "Direct from Farms",
    body: "Sugarcane sourced from partner farms in Maharashtra, India.",
  },
];

export default function WhyNaturesChoice() {
  return (
    <section className="bg-[var(--jaggery-brown)] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
              Why choose us
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-[var(--white)]">
              Premium quality you can taste
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--white)]/80">
              We believe in delivering honest jaggery - pure, natural and
              unadulterated. From farm to jar, every step is handled with care
              and tradition.
            </p>

            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {reasons.map((reason) => (
                <li
                  key={reason.title}
                  className="rounded-2xl border border-[var(--white)]/10 bg-[var(--white)]/5 p-5"
                >
                  <p className="font-semibold text-[var(--white)]">{reason.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--white)]/75">
                    {reason.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl bg-[var(--warm-cream)]/10 p-8">
            <Image
              src="/images/farm-to-jar.png"
              alt="Traditional jaggery preparation"
              width={600}
              height={400}
              className="rounded-2xl object-cover"
            />
          </div>
        </div>

        <div className="mt-20">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
              Three authentic flavours
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--white)]">
              Discover your favourite
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.slug}
                className="flex flex-col overflow-hidden rounded-2xl bg-[var(--warm-cream)]"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="relative aspect-square w-full bg-[var(--white)] p-6"
                >
                  <Image
                    src={product.images[0]}
                    alt={`${product.name} ${product.weight}`}
                    fill
                    sizes="(max-width: 768px) 90vw, 320px"
                    className="object-contain"
                  />
                </Link>

                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
                    {product.shortName}
                  </p>
                  <h3 className="mt-2 font-serif text-lg font-bold text-[var(--dark-text)]">
                    <Link href={`/products/${product.slug}`} className="hover:text-[var(--ginger-terracotta)]">
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1.5 text-sm italic text-[var(--dark-text)]/60">
                    {product.flavourNote}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--dark-text)]/70">
                    {product.highlights[0]}
                  </p>

                  <div className="mt-4">
                    <PriceDisplay
                      size="sm"
                      sellingPrice={product.sellingPrice}
                      mrp={product.mrp}
                      discountPercent={product.discountPercent}
                    />
                  </div>

                  <div className="mt-5 flex-1" />

                  <ProductActions product={product} layout="row" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}