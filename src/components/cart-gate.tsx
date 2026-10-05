"use client";

import Link from "next/link";
import { useCart } from "@/context/cart-context";

/**
 * The cart lives in localStorage, so the server cannot know whether it is empty.
 * This waits for hydration before deciding, which avoids flashing the empty-cart
 * screen at someone who does have items.
 */
export default function CartGate({ children }: { children: React.ReactNode }) {
  const { hydrated, itemCount } = useCart();

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-black/5 bg-[var(--white)] p-12 text-center shadow-sm">
        <p className="text-sm text-[var(--dark-text)]/60">Loading your cart…</p>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="rounded-2xl border border-black/5 bg-[var(--white)] p-12 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-[var(--dark-text)]">Nothing to check out yet</h2>
        <p className="mt-3 text-[var(--dark-text)]/70">
          Add a product to your cart first.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-block rounded-full bg-[var(--jaggery-brown)] px-6 py-3 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)]"
        >
          SHOP ALL PRODUCTS
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}