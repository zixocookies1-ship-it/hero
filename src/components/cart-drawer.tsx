"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/context/cart-context";
import { useCoupon } from "@/hooks/use-coupon";
import CouponField from "@/components/coupon-field";
import { BEST_SELLER_SLUGS, formatPrice, type Product } from "@/lib/products";

/**
 * Slide-out cart. The shopper edits quantities, drops a line, applies a coupon
 * and reads the total without leaving the page they are on, and the panel is
 * surfaced the moment something is added so the line visibly lands.
 *
 * Every figure here is display only: `create-order` re-prices the cart and
 * re-validates the coupon on the server before any money moves, so nothing the
 * drawer renders can become the amount charged.
 */
export default function CartDrawer({
  catalogue,
  shippingFeeInr,
  freeAboveInr,
}: {
  catalogue: readonly Product[];
  shippingFeeInr: number;
  freeAboveInr: number | null;
}) {
  const {
    entries,
    itemCount,
    subtotal,
    savings,
    hydrated,
    cartOpen,
    closeCart,
    setQuantity,
    removeItem,
    quantityOf,
    addItem,
  } = useCart();

  const { discountInr } = useCoupon();

  // Escape closes, and the page behind must stop scrolling while the panel is
  // up — without it the backdrop traps a wheel that keeps moving the page.
  useEffect(() => {
    if (!cartOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [cartOpen, closeCart]);

  if (!cartOpen) return null;

  const chargeableSubtotal = Math.max(0, subtotal - discountInr);
  const shippingDue =
    freeAboveInr === null || chargeableSubtotal < freeAboveInr ? shippingFeeInr : 0;
  const total = chargeableSubtotal + shippingDue;

  // Upsell: what is not in the cart yet, best seller first so the promoted
  // product is the one the shopper meets. Empty means nothing to suggest.
  const upsells = catalogue
    .filter((product) => quantityOf(product.slug) === 0)
    .sort(
      (a, b) =>
        (BEST_SELLER_SLUGS.includes(b.slug) ? 1 : 0) -
        (BEST_SELLER_SLUGS.includes(a.slug) ? 1 : 0)
    )
    .slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
      data-testid="cart-drawer"
    >
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-[var(--background)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/5 bg-[var(--warm-cream)] px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-[var(--dark-text)]">
            Your Cart
            {itemCount > 0 ? (
              <span className="ml-2 rounded-full bg-[var(--jaggery-brown)] px-2 py-0.5 align-middle text-[11px] font-semibold text-[var(--white)]">
                {itemCount}
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none text-[var(--dark-text)] transition-colors hover:bg-black/5"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!hydrated ? (
            <p className="py-8 text-center text-sm text-[var(--dark-text)]/60">
              Loading your cart...
            </p>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center">
              <h3 className="font-serif text-xl font-bold text-[var(--dark-text)]">
                Your cart is empty
              </h3>
              <p className="mx-auto mt-3 max-w-xs text-sm text-[var(--dark-text)]/70">
                Browse our three authentic jaggery flavours and add your favourites here.
              </p>
              <Link
                href="/products"
                onClick={closeCart}
                className="mt-6 inline-block rounded-full bg-[var(--jaggery-brown)] px-6 py-3 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)]"
              >
                SHOP ALL PRODUCTS
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-4">
                {entries.map((entry) => {
                  const slug =
                    entry.kind === "combo" ? entry.cartSlug : entry.product.slug;
                  const name =
                    entry.kind === "combo" ? entry.combo.name : entry.product.name;
                  const image =
                    entry.kind === "combo"
                      ? entry.combo.image
                      : (entry.product.images[0] ?? "/images/logo.png");
                  const detail =
                    entry.kind === "combo"
                      ? `${entry.combo.items.length} ${
                          entry.combo.items.length === 1 ? "item" : "items"
                        } \u00d7 ${entry.quantity}`
                      : `${entry.product.weight} \u00d7 ${entry.quantity}`;

                  return (
                    <li key={slug} className="flex gap-3">
                      <span className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--warm-cream)] p-1.5">
                        <Image
                          src={image}
                          alt={name}
                          fill
                          sizes="64px"
                          className="object-contain"
                        />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 text-sm font-semibold leading-snug text-[var(--dark-text)]">
                            {name}
                            {entry.kind === "combo" ? (
                              <span className="ml-1.5 inline-block rounded-full bg-[var(--jaggery-brown)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                Combo
                              </span>
                            ) : null}
                          </p>
                          <p className="shrink-0 text-sm font-semibold text-[var(--jaggery-brown)]">
                            {formatPrice(entry.lineTotal)}
                          </p>
                        </div>

                        <p className="mt-0.5 text-xs text-[var(--dark-text)]/60">{detail}</p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center rounded-full border border-black/10 bg-[var(--white)]">
                            <button
                              type="button"
                              onClick={() => setQuantity(slug, entry.quantity - 1)}
                              aria-label={`Decrease quantity of ${name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-base leading-none text-[var(--dark-text)] transition-colors hover:bg-[var(--warm-cream)]"
                            >
                              &minus;
                            </button>
                            <span className="w-7 text-center text-sm font-semibold">
                              {entry.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity(slug, entry.quantity + 1)}
                              aria-label={`Increase quantity of ${name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-base leading-none text-[var(--dark-text)] transition-colors hover:bg-[var(--warm-cream)]"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(slug)}
                            aria-label={`Remove ${name} from cart`}
                            className="text-xs text-[var(--dark-text)]/50 underline underline-offset-4 transition-colors hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {upsells.length > 0 ? (
                <section className="mt-7 rounded-2xl border border-black/5 bg-[linear-gradient(160deg,var(--white),var(--mint-soft))] p-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--natural-green)]">
                    Highly Selling Products
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {upsells.map((product) => (
                      <li key={product.slug} className="flex items-center gap-3">
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={closeCart}
                          className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--warm-cream)] p-1"
                        >
                          <Image
                            src={product.images[0] ?? "/images/logo.png"}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-contain"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--dark-text)]">
                            {product.name}
                          </p>
                          <p className="text-xs text-[var(--dark-text)]/60">
                            {formatPrice(product.sellingPrice)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addItem(product.slug, 1)}
                          className="shrink-0 rounded-full border border-[var(--jaggery-brown)] px-4 py-1.5 text-xs font-semibold text-[var(--jaggery-brown)] transition-colors hover:bg-[var(--jaggery-brown)] hover:text-[var(--white)]"
                        >
                          ADD
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <div className="mt-7">
                <CouponField id="cart-drawer-coupon" />
              </div>

              <dl className="mt-6 space-y-3 border-t border-black/5 pt-5 text-sm">
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
                  <dd className="font-medium">
                    {shippingDue > 0 ? formatPrice(shippingDue) : "Free"}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-black/5 pt-3 text-base font-bold text-[var(--jaggery-brown)]">
                  <dt>Total</dt>
                  <dd>{formatPrice(total)}</dd>
                </div>
              </dl>

              <p className="mt-4 text-xs text-[var(--dark-text)]/55">
                Taxes included. Delivery {shippingDue > 0 ? "charged" : "is free"} on this order.
              </p>

              <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="text-[var(--ginger-terracotta)] underline underline-offset-4"
                >
                  View full cart
                </Link>
                <button
                  type="button"
                  onClick={closeCart}
                  className="text-[var(--dark-text)]/50 underline underline-offset-4 transition-colors hover:text-red-600"
                >
                  Continue shopping
                </button>
              </div>
            </>
          )}
        </div>

        {hydrated && entries.length > 0 ? (
          <div className="border-t border-black/5 bg-[var(--white)] px-5 py-4">
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block rounded-full bg-[var(--jaggery-brown)] px-6 py-3.5 text-center text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)]"
            >
              PROCEED TO CHECKOUT
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
