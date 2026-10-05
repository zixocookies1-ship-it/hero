import Image from "next/image";
import Link from "next/link";
import { type Product } from "@/lib/products";
import PriceDisplay from "@/components/price-display";
import ProductActions from "@/components/product-actions";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-[var(--white)] shadow-sm transition-shadow hover:shadow-xl">
      <Link
        href={`/products/${product.slug}`}
        className="block bg-[var(--warm-cream)] p-6"
      >
        <div className="relative mx-auto aspect-square w-full max-w-[240px]">
          <Image
            src={product.images[0]}
            alt={`${product.name} ${product.weight}`}
            fill
            sizes="(max-width: 768px) 80vw, 240px"
            className="object-contain"
            priority={false}
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
          {product.variantName}
        </p>
        <h3 className="mt-2 font-serif text-lg font-bold text-[var(--dark-text)]">
          <Link
            href={`/products/${product.slug}`}
            className="hover:text-[var(--ginger-terracotta)]"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-[var(--dark-text)]/60">
          {product.weight} &bull; {product.pack}
        </p>

        <div className="mt-4">
          <PriceDisplay
            sellingPrice={product.sellingPrice}
            mrp={product.mrp}
            discountPercent={product.discountPercent}
          />
        </div>

        <div className="mt-5 flex-1" />

        <ProductActions product={product} layout="row" />
      </div>
    </article>
  );
}