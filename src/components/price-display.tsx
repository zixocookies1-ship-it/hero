import { formatPrice } from "@/lib/products";

export default function PriceDisplay({
  sellingPrice,
  mrp,
  discountPercent,
  size = "md",
  tone = "light",
}: {
  sellingPrice: number;
  mrp: number;
  discountPercent?: number;
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

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span
        className={`${priceSize} font-bold ${isDark ? "text-[var(--white)]" : "text-[var(--jaggery-brown)]"}`}
      >
        {formatPrice(sellingPrice)}
      </span>
      {mrp > sellingPrice && (
        <>
          <span
            className={`text-sm line-through ${isDark ? "text-[var(--white)]/60" : "text-gray-500"}`}
          >
            {formatPrice(mrp)}
          </span>
          {discountPercent ? (
            <span className="rounded-full bg-[var(--ginger-terracotta)] px-2 py-0.5 text-xs font-semibold text-[var(--white)]">
              {discountPercent}% OFF
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}