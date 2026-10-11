"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Next.js App Router keeps the browser's scroll position when two routes share
 * a layout, so a storefront links acts like an anchor to wherever the visitor
 * was — a product page would open mid-page, near "You may also like", instead of
 * at the product. This resets the scroll to the top on every route change so a
 * clicked product opens at its own gallery.
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}