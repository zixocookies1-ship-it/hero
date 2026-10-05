/**
 * Order numbers are built from a per-day counter on the Order row, so two
 * orders can never collide: NCJ-YYYYMMDD-000123
 */
export function buildOrderId(sequence: number, when: Date = new Date()): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Order sequence must be a positive integer.");
  }

  const year = when.getFullYear();
  const month = String(when.getMonth() + 1).padStart(2, "0");
  const day = String(when.getDate()).padStart(2, "0");

  return `NCJ-${year}${month}${day}-${String(sequence).padStart(6, "0")}`;
}

export const ORDER_ID_PATTERN = /^NCJ-\d{8}-\d{6}$/;

export const isValidOrderId = (value: unknown): value is string =>
  typeof value === "string" && ORDER_ID_PATTERN.test(value);

/** DD/MM/YYYY, used on the success page and in the PDF. */
export function formatIndianDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Indian numbering, e.g. 1234567 -> 12,34,567 */
export function formatIndianNumber(value: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}