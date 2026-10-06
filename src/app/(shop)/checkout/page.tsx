import Link from "next/link";
import CartGate from "@/components/cart-gate";
import CheckoutForm from "@/components/checkout-form";
import { getShippingPolicy } from "@/lib/pricing";
import { loadBrand } from "@/lib/cms";

export const metadata = {
  title: "Checkout - Nature's Choice Jaggery",
  description: "Enter your delivery details and pay securely with Razorpay.",
};

export default async function CheckoutPage() {
  const policy = getShippingPolicy();
  const brand = await loadBrand();

  return (
    <main className="pt-28 pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--dark-text)]/60">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/cart" className="hover:text-[var(--ginger-terracotta)]">
                Cart
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[var(--dark-text)]">
              Checkout
            </li>
          </ol>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold text-[var(--dark-text)]">Checkout</h1>
        <p className="mt-2 text-sm text-[var(--dark-text)]/70">
          Secure payment powered by Razorpay.
        </p>

        <div className="mt-8">
          <CartGate>
            <CheckoutForm
              shippingFeeInr={policy.feeInr}
              freeAboveInr={policy.freeAboveInr}
              brandName={brand.name}
            />
          </CartGate>
        </div>
      </div>
    </main>
  );
}