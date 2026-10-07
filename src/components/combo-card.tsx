"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "@/context/cart-context";
import { comboCartSlug, type Combo } from "@/lib/combos";
import { formatPrice } from "@/lib/products";

/**
 * One purchasable combo. Lives on the home and products pages next to the
 * product grid and adds itself to the same cart as products, so it flows
 * through cart, checkout and the Razorpay order exactly like a product.
 */
export default function ComboCard({ combo }: { combo: Combo }) {
  const { addComboItem, quantityOf, hydrated } = useCart();
  const [error, setError] = useState<string | null>(null);

  const inCart = hydrated && quantityOf(comboCartSlug(combo.id)) > 0;

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(null), 4000);
    return () => window.clearTimeout(timer);
  }, [error]);

  const handleAdd = () => {
    const result = addComboItem(combo.id, 1);
    if (!result.ok) setError(result.error);
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-[var(--white)] shadow-sm">
      <div className="relative aspect-square bg-[var(--warm-cream)] p-4">
        <Image
          src={combo.image}
          alt={combo.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
          className="object-contain transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
        />
        {combo.discountPercent > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--ginger-terracotta)] px-3 py-1 text-xs font-semibold text-[var(--white)]">
            {combo.discountPercent}% OFF
          </span>
        ) : null}
        <span className="absolute right-3 top-3 rounded-full bg-[var(--jaggery-brown)] px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--white)]">
          Combo
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-bold leading-snug text-[var(--dark-text)]">
          {combo.name}
        </h3>
        <p className="mt-2 hidden text-sm leading-relaxed text-[var(--dark-text)]/70 sm:block">
          {combo.description}
        </p>
        <ul className="mt-3 space-y-1">
          {combo.items.map((item) => (
            <li key={`${combo.id}-${item.slug}`} className="flex items-center gap-2 text-sm text-[var(--dark-text)]/70">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--ginger-terracotta)]" aria-hidden="true" />
              <span>
                {item.quantity} &times; {item.name}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-bold text-[var(--jaggery-brown)]">
              {formatPrice(combo.priceInr)}
            </span>
            {combo.mrpInr > combo.priceInr ? (
              <span className="text-sm text-[var(--dark-text)]/45 line-through">
                {formatPrice(combo.mrpInr)}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Add ${combo.name} to cart`}
            className="mt-4 w-full rounded-full bg-[var(--jaggery-brown)] px-5 py-2.5 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ginger-terracotta)]"
          >
            {inCart ? "ADDED TO CART" : "ADD TO CART"}
          </button>

          {error ? (
            <p role="alert" className="mt-2 text-xs font-medium text-red-600">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}