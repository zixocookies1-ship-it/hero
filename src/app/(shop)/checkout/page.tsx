"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/products";

const fieldClass =
  "w-full rounded-xl border border-black/10 bg-[var(--white)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--ginger-terracotta)]";

export default function CheckoutPage() {
  const router = useRouter();
  const { detailedLines, subtotal, itemCount } = useCart();
  const [error, setError] = useState<string | null>(null);

  if (itemCount === 0) {
    return (
      <main className="pt-28 pb-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="rounded-2xl border border-black/5 bg-[var(--white)] p-12">
            <h1 className="text-2xl font-bold text-[var(--dark-text)]">
              Nothing to check out yet
            </h1>
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
        </div>
      </main>
    );
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(
      "Online payment is not enabled yet. Your order details are ready, but we cannot take payment on this site yet."
    );
  };

  return (
    <main className="pt-28 pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--dark-text)]">
          Checkout
        </h1>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-black/5 bg-[var(--white)] p-6 shadow-sm sm:p-8">
            <h2 className="font-serif text-lg font-bold text-[var(--dark-text)]">
              Delivery details
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[var(--dark-text)]">
                  Full name
                </label>
                <input id="name" name="name" type="text" required className={fieldClass} />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-[var(--dark-text)]">
                  Phone
                </label>
                <input id="phone" name="phone" type="tel" required className={fieldClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--dark-text)]">
                  Email
                </label>
                <input id="email" name="email" type="email" required className={fieldClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-[var(--dark-text)]">
                  Address
                </label>
                <input id="address" name="address" type="text" required className={fieldClass} />
              </div>
              <div>
                <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-[var(--dark-text)]">
                  City
                </label>
                <input id="city" name="city" type="text" required className={fieldClass} />
              </div>
              <div>
                <label htmlFor="pin" className="mb-1.5 block text-sm font-medium text-[var(--dark-text)]">
                  PIN code
                </label>
                <input id="pin" name="pin" type="text" inputMode="numeric" required className={fieldClass} />
              </div>
            </div>

            {error && (
              <p className="mt-6 rounded-xl bg-[var(--warm-cream)] px-4 py-3 text-sm text-[var(--dark-text)]/80">
                {error}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="rounded-full bg-[var(--jaggery-brown)] px-7 py-3.5 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)]"
              >
                PLACE ORDER
              </button>
              <button
                type="button"
                onClick={() => router.push("/cart")}
                className="rounded-full border border-black/10 px-7 py-3.5 text-sm font-semibold text-[var(--dark-text)] transition-colors hover:bg-black/5"
              >
                BACK TO CART
              </button>
            </div>

            </form>

          <aside className="h-fit rounded-2xl border border-black/5 bg-[var(--white)] p-6 lg:sticky lg:top-28">
            <h2 className="font-serif text-lg font-bold text-[var(--dark-text)]">
              Your order
            </h2>

            <ul className="mt-5 space-y-4">
              {detailedLines.map(({ product, quantity, lineTotal }) => (
                <li key={product.slug} className="flex items-center gap-3">
                  <span className="relative h-14 w-14 flex-shrink-0 rounded-lg bg-[var(--warm-cream)] p-1.5">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="56px"
                      className="object-contain"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--dark-text)]">
                      {product.name}
                    </span>
                    <span className="block text-xs text-[var(--dark-text)]/60">
                      {product.weight} &times; {quantity}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-[var(--jaggery-brown)]">
                    {formatPrice(lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-6 space-y-3 border-t border-black/5 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--dark-text)]/70">Subtotal</dt>
                <dd className="font-medium">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--dark-text)]/70">Shipping</dt>
                <dd className="font-medium">Free</dd>
              </div>
              <div className="flex justify-between border-t border-black/5 pt-3 text-base font-bold text-[var(--jaggery-brown)]">
                <dt>Total</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}