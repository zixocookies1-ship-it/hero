"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { type Product } from "@/lib/products";

export default function ProductActions({
  product,
  layout = "stacked",
}: {
  product: Product;
  layout?: "stacked" | "row";
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product.slug, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product.slug, 1);
    router.push("/checkout");
  };

  const buttonClass =
    "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ginger-terracotta)]";

  if (layout === "row") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAdd}
          className={`${buttonClass} bg-[var(--jaggery-brown)] text-[var(--white)] hover:bg-[var(--ginger-terracotta)]`}
        >
          {added ? "ADDED TO CART" : "ADD TO CART"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          className={`${buttonClass} border border-[var(--jaggery-brown)] text-[var(--jaggery-brown)] hover:bg-[var(--jaggery-brown)] hover:text-[var(--white)]`}
        >
          BUY NOW
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={handleBuyNow}
        className={`${buttonClass} bg-[var(--ginger-terracotta)] text-[var(--white)] hover:bg-[var(--jaggery-brown)]`}
      >
        BUY NOW
      </button>
      <button
        type="button"
        onClick={handleAdd}
        className={`${buttonClass} border border-[var(--jaggery-brown)] text-[var(--jaggery-brown)] hover:bg-[var(--jaggery-brown)] hover:text-[var(--white)]`}
      >
        {added ? "ADDED TO CART" : "ADD TO CART"}
      </button>
    </div>
  );
}