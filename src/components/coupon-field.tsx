"use client";

import { useCoupon } from "@/hooks/use-coupon";
import { formatPrice } from "@/lib/products";

/**
 * Coupon entry. Shared by the cart and the checkout so the code is validated the
 * same way in both places and persisted across the navigation between them.
 */
export default function CouponField() {
  const { code, discountInr, description, status, message, draft, setDraft, apply, remove } =
    useCoupon();

  const applied = status === "applied" && code !== null;

  return (
    <div>
      <label
        htmlFor="coupon-code"
        className="block text-[11px] font-semibold uppercase tracking-widest text-[var(--dark-text)]/60"
      >
        Coupon code
      </label>

      {applied ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-[var(--natural-green)]/30 bg-[var(--natural-green)]/5 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--natural-green)]">
              {code}
              {description ? ` \u00b7 ${description}` : ""}
            </p>
            <p className="text-xs text-[var(--natural-green)]/80">
              You saved {formatPrice(discountInr)} off this order
            </p>
          </div>
          <button
            type="button"
            onClick={remove}
            className="shrink-0 text-sm text-[var(--natural-green)] underline underline-offset-4 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="mt-2 flex gap-2">
          <input
            id="coupon-code"
            name="coupon-code"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                apply();
              }
            }}
            placeholder="Enter code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-describedby={message ? "coupon-message" : undefined}
            aria-invalid={status === "error"}
            className="min-w-0 flex-1 rounded-full border border-black/10 bg-[var(--white)] px-4 py-2.5 text-sm uppercase text-[var(--dark-text)] placeholder:normal-case placeholder:text-[var(--dark-text)]/40 focus:border-[var(--jaggery-brown)] focus:outline-none focus:ring-2 focus:ring-[var(--jaggery-brown)]/20"
          />
          <button
            type="button"
            onClick={apply}
            disabled={status === "checking"}
            className="shrink-0 rounded-full bg-[var(--jaggery-brown)] px-5 py-2.5 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "checking" ? "Checking..." : "Apply"}
          </button>
        </div>
      )}

      {message && (
        <p
          id="coupon-message"
          role="status"
          className="mt-2 text-xs text-red-600"
        >
          {message}
        </p>
      )}
    </div>
  );
}
