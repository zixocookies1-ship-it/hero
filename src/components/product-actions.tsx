"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/components/toast";
import { type Product } from "@/lib/products";

export default function ProductActions({
  product,
  layout = "stacked",
}: {
  product: Product;
  layout?: "stacked" | "row" | "card";
}) {
  const { addItem, quantityOf, hydrated } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // The label is derived from the cart, never from a local flag, so it cannot
  // claim "ADDED TO CART" unless the line is genuinely in the cart.
  const inCart = hydrated && quantityOf(product.slug) > 0;

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(null), 4000);
    return () => window.clearTimeout(timer);
  }, [error]);

  const handleAdd = () => {
    const result = addItem(product.slug, 1);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Show toast notification instead of opening cart
    showToast(`${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    // Order matters: the item must be in the cart before the navigation, or
    // checkout mounts against an empty snapshot and shows "nothing to check out".
    const result = addItem(product.slug, 1);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/checkout");
  };

  const base =
    "cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ginger-terracotta)]";

  const addLabel = inCart ? "ADDED TO CART" : "ADD TO CART";

  const errorNotice = error && (
    <p role="alert" className="mt-2 text-xs font-medium text-red-600">
      {error}
    </p>
  );

  // Card: reference storefront shows "Add to Cart" + "Buy Now" as two pills.
  if (layout === "card") {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleAdd}
          data-testid={`add-to-cart-${product.slug}`}
          aria-label={`Add ${product.name} to cart`}
          className={`${base} w-full border-[1.5px] border-[var(--natural-green)]/15 bg-[var(--mint-soft)] !text-xs font-bold uppercase tracking-[0.1em] text-[var(--natural-green)] hover:bg-[var(--dark-text)] hover:text-[var(--white)]`}
        >
          {addLabel}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          data-testid={`buy-now-${product.slug}`}
          aria-label={`Buy ${product.name} now`}
          className={`${base} w-full bg-[var(--jaggery-brown)] text-[var(--white)] hover:bg-[var(--ginger-terracotta)]`}
        >
          BUY NOW
        </button>
        {errorNotice}
      </div>
    );
  }

  if (layout === "row") {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAdd}
            data-testid={`add-to-cart-${product.slug}`}
            aria-label={`Add ${product.name} to cart`}
            className={`${base} bg-[var(--jaggery-brown)] text-[var(--white)] hover:bg-[var(--ginger-terracotta)]`}
          >
            {addLabel}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            data-testid={`buy-now-${product.slug}`}
            aria-label={`Buy ${product.name} now`}
            className={`${base} border border-[var(--jaggery-brown)] text-[var(--jaggery-brown)] hover:bg-[var(--jaggery-brown)] hover:text-[var(--white)]`}
          >
            BUY NOW
          </button>
        </div>
        {errorNotice}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleAdd}
          data-testid={`add-to-cart-${product.slug}`}
          aria-label={`Add ${product.name} to cart`}
          className={`${base} flex-1 bg-[var(--jaggery-brown)] text-[var(--white)] hover:bg-[var(--ginger-terracotta)]`}
        >
          {addLabel}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          data-testid={`buy-now-${product.slug}`}
          aria-label={`Buy ${product.name} now`}
          className={`${base} flex-1 border border-[var(--jaggery-brown)] text-[var(--jaggery-brown)] hover:bg-[var(--jaggery-brown)] hover:text-[var(--white)]`}
        >
          BUY NOW
        </button>
      </div>
      {errorNotice}
    </div>
  );
}
