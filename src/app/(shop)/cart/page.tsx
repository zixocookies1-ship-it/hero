import type { Metadata } from "next";
import CartView from "@/components/cart-view";
import { loadShippingPolicy } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review the items in your Nature's Choice Jaggery cart.",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  // The live delivery rule drives the shipping shown in the order summary, so
  // the cart can never promise free shipping that checkout then charges for.
  const policy = await loadShippingPolicy();

  return (
    <CartView
      shippingFeeInr={policy.feeInr}
      freeAboveInr={policy.freeAboveInr}
    />
  );
}