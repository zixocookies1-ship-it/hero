"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useCart } from "@/context/cart-context";
import type { CartLine } from "@/lib/cart";

export type CouponState = {
  /** The code persisted in the cart, which is what gets sent at checkout. */
  code: string | null;
  discountInr: number;
  description: string | null;
  status: "idle" | "checking" | "applied" | "error";
  message: string | null;
  /** Field the shopper is typing, before they press Apply. */
  draft: string;
  setDraft: (value: string) => void;
  apply: () => void;
  remove: () => void;
};

type AppliedResult = { code: string; discountInr: number; description: string };

type Outcome =
  | { ok: true; discountInr: number; description: string }
  | { ok: false; error: string };

const toRequestCart = (lines: CartLine[]) =>
  lines.map((line) => ({ slug: line.slug, quantity: line.quantity }));

/**
 * Asks the server what a code is worth against the current cart.
 *
 * Deliberately free of any state updates: an effect calling this is then only a
 * request against an external system, and its result is applied from the async
 * continuation rather than from the body of the effect itself. The server decides
 * every figure — nothing here computes a discount, so nothing here can be talked
 * into a price the checkout would not honour.
 */
const requestCoupon = async (code: string, cart: CartLine[]): Promise<Outcome> => {
  try {
    const response = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, cart: toRequestCart(cart) }),
    });

    const data = (await response.json().catch(() => null)) as {
      ok?: boolean;
      discountInr?: number;
      description?: string;
      error?: string;
    } | null;

    if (response.ok && data?.ok) {
      return {
        ok: true,
        discountInr: Number(data.discountInr) || 0,
        description: typeof data.description === "string" ? data.description : "",
      };
    }

    return { ok: false, error: data?.error ?? "That coupon code could not be applied." };
  } catch {
    return { ok: false, error: "Could not reach the server to check that coupon." };
  }
};

/**
 * Coupon entry for the cart and checkout.
 *
 * It re-validates whenever the cart changes, because a percentage or a
 * minimum-order rule can stop applying the moment a quantity is edited, and
 * showing a stale discount until checkout would be a price the shopper never
 * agreed to. Until the answer arrives the previous figure stays visible rather
 * than blanking out. create-order runs the same check before charging, so a
 * stale figure here is corrected server-side regardless.
 */
export function useCoupon(): CouponState {
  const { lines, couponCode, setCouponCode } = useCart();

  const [draft, setDraft] = useState("");
  // The last result the server returned, tagged with the code it validated. It is
  // matched against the current code rather than trusted, so clearing the code
  // makes the discount disappear without a second effect to zero it out.
  const [result, setResult] = useState<AppliedResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Discards an in-flight answer that a later interaction has superseded.
  const requestId = useRef(0);

  // Re-check the applied code whenever the cart changes. Keyed on a signature so a
  // re-render alone does not re-request. No state is touched until the response
  // lands, so this effect never causes a cascading render.
  const signature = lines.map((line) => `${line.slug}:${line.quantity}`).join("|");

  useEffect(() => {
    if (!couponCode) return;

    const id = ++requestId.current;
    let cancelled = false;

    void requestCoupon(couponCode, lines).then((outcome) => {
      if (cancelled || id !== requestId.current) return;

      if (outcome.ok) {
        setResult({
          code: couponCode.trim().toUpperCase(),
          discountInr: outcome.discountInr,
          description: outcome.description,
        });
        setMessage(null);
        return;
      }

      setResult(null);
      setMessage(outcome.error);
      // Drop a code the server rejected so it is never carried to checkout only to
      // fail there. The message is kept, and the effect re-entering on a null code
      // deliberately clears nothing, so the reason stays readable.
      setCouponCode(null);
    });

    return () => {
      cancelled = true;
    };
    // lines is covered by signature; requestCoupon is a module-level function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, couponCode]);

  const applied = result !== null && result.code === couponCode ? result : null;
  // The background re-check above keeps showing the previous figure while it
  // waits, so "checking" only means a fresh code is awaiting its first answer.
  const checking = couponCode !== null && result === null && message === null;

  const apply = useCallback(() => {
    const code = draft.trim();
    if (!code) {
      setResult(null);
      setMessage("Enter a coupon code.");
      return;
    }
    setMessage(null);
    setCouponCode(code);
  }, [draft, setCouponCode]);

  const remove = useCallback(() => {
    // Bump the id so any in-flight validation is discarded.
    requestId.current += 1;
    setCouponCode(null);
    setDraft("");
    setResult(null);
    setMessage(null);
  }, [setCouponCode]);

  return {
    code: couponCode,
    discountInr: applied ? applied.discountInr : 0,
    description: applied ? applied.description || null : null,
    status: checking ? "checking" : applied ? "applied" : message ? "error" : "idle",
    message,
    draft,
    setDraft,
    apply,
    remove,
  };
}
