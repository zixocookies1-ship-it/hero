"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { useCoupon } from "@/hooks/use-coupon";
import CouponField from "@/components/coupon-field";
import { formatPrice } from "@/lib/products";

export default function CartPage() {
  const {
    detailedLines,
    itemCount,
    subtotal,
    savings,
    hydrated,
    setQuantity,
    removeItem,
    clearCart,
  } = useCart();

  // Display only. create-order re-prices and re-validates the coupon before any
  // money moves, so this figure can never be what the shopper is charged.
  const { discountInr } = useCoupon();
  const total = Math.max(0, subtotal - discountInr);

  if (!hydrated) {
    return (
      <main className="pt-40 pb-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-[var(--dark-text)]/60">Loading your cart...</p>
        </div>
      </main>
    );
  }

  if (detailedLines.length === 0) {
    return (
      <main className="pt-40 pb-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="rounded-2xl border border-black/5 bg-[var(--white)] p-12">
            <h1 className="text-2xl font-bold text-[var(--dark-text)]">
              Your cart is empty
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[var(--dark-text)]/70">
              Browse our three authentic jaggery flavours and add your favourites
              here.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-block rounded-full bg-[var(--jaggery-brown)] px-6 py-3 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)]"
            >
              SHOP ALL PRODUCTS
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-40 pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--dark-text)]">
          Your cart
        </h1>
        <p className="mt-2 text-sm text-[var(--dark-text)]/60">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="space-y-4">
            {detailedLines.map(({ product, quantity, lineTotal }) => (
              <li
                key={product.slug}
                className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-[var(--white)] p-4 sm:flex-row sm:items-center"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="relative mx-auto h-24 w-24 flex-shrink-0 rounded-xl bg-[var(--warm-cream)] p-2 sm:mx-0"
                >
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="96px"
                    className="object-contain"
                  />
                </Link>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="text-xs uppercase tracking-widest text-[var(--ginger-terracotta)]">
                    {product.variantName}
                  </p>
                  <h2 className="mt-1 font-serif text-base font-bold text-[var(--dark-text)]">
                    <Link href={`/products/${product.slug}`} className="hover:text-[var(--ginger-terracotta)]">
                      {product.name}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-[var(--dark-text)]/60">
                    {product.weight} &bull; {product.pack} &bull;{" "}
                    {formatPrice(product.sellingPrice)} each
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center rounded-full border border-black/10">
                    <button
                      type="button"
                      onClick={() => setQuantity(product.slug, quantity - 1)}
                      aria-label={`Decrease quantity of ${product.name}`}
                      className="h-9 w-9 rounded-full text-lg text-[var(--dark-text)] transition-colors hover:bg-[var(--warm-cream)]"
                    >
                      &minus;
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(product.slug, quantity + 1)}
                      aria-label={`Increase quantity of ${product.name}`}
                      className="h-9 w-9 rounded-full text-lg text-[var(--dark-text)] transition-colors hover:bg-[var(--warm-cream)]"
                    >
                      +
                    </button>
                  </div>

                  <p className="w-20 text-right font-semibold text-[var(--jaggery-brown)]">
                    {formatPrice(lineTotal)}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeItem(product.slug)}
                    className="text-sm text-[var(--dark-text)]/50 underline underline-offset-4 transition-colors hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl border border-black/5 bg-[var(--white)] p-6 lg:sticky lg:top-40">
            <h2 className="font-serif text-lg font-bold text-[var(--dark-text)]">
              Order summary
            </h2>

            <div className="mt-6">
              <CouponField />
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--dark-text)]/70">Subtotal</dt>
                <dd className="font-medium">{formatPrice(subtotal)}</dd>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-[var(--natural-green)]">
                  <dt>You save</dt>
                  <dd className="font-medium">-{formatPrice(savings)}</dd>
                </div>
              )}
              {discountInr > 0 && (
                <div className="flex justify-between text-[var(--natural-green)]">
                  <dt>Coupon</dt>
                  <dd className="font-medium">-{formatPrice(discountInr)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[var(--dark-text)]/70">Shipping</dt>
                <dd className="font-medium">Free</dd>
              </div>
              <div className="flex justify-between border-t border-black/5 pt-3 text-base font-bold text-[var(--jaggery-brown)]">
                <dt>Total</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>

            <Link
              href="/checkout"
              className="mt-6 block rounded-full bg-[var(--jaggery-brown)] px-6 py-3.5 text-center text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)]"
            >
              PROCEED TO CHECKOUT
            </Link>

            <button
              type="button"
              onClick={clearCart}
              className="mt-4 w-full text-center text-sm text-[var(--dark-text)]/50 underline underline-offset-4 transition-colors hover:text-red-600"
            >
              Clear cart
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}