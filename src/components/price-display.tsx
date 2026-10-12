import { formatPrice } from "@/lib/products";

/**
 * Price block shared by the product card and the product detail page. Mirrors
 * the reference storefront: the selling price reads green, the MRP is struck
 * in red with a trailing unit, and the saving pulses underneath as
 * "Save ₹X (Y% OFF)".
 */
export default function PriceDisplay({
  sellingPrice,
  mrp,
  discountPercent,
  unit,
  size = "md",
  tone = "light",
}: {
  sellingPrice: number;
  mrp: number;
  discountPercent?: number;
  /** Rendered after the prices, e.g. "/ 500g". Omitted when empty. */
  unit?: string;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
}) {
  const priceSize =
    size === "lg"
      ? "text-3xl"
      : size === "sm"
        ? "text-lg"
        : "text-xl";

  const isDark = tone === "dark";
  const saving = mrp - sellingPrice;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span
          className={`${priceSize} font-bold text-[var(--price-green)]`}
        >
          {formatPrice(sellingPrice)}
        </span>
        {mrp > sellingPrice && (
          <>
            <del
              className={`text-sm text-[var(--sale-red)] line-through ${
                isDark ? "text-[var(--white)]/70" : ""
              }`}
            >
              {formatPrice(mrp)}
            </del>
            {unit ? (
              <small
                className={`text-xs font-normal ${
                  isDark ? "text-[var(--white)]/60" : "text-[var(--dark-text)]/60"
                }`}
              >
                / {unit}
              </small>
            ) : null}
          </>
        )}
      </div>

      {mrp > sellingPrice && discountPercent ? (
        <div className="mt-1.5 text-sm font-bold motion-safe:animate-pulse-soft">
          <span className="text-[var(--dark-text)]">Save {formatPrice(saving)}</span>
          <span className="ml-1 text-[var(--price-green)]">({discountPercent}% OFF)</span>
        </div>
      ) : null}
    </div>
  );
}
