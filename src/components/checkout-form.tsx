"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useCart } from "@/context/cart-context";
import { BRAND } from "@/lib/brand";
import { formatPrice } from "@/lib/products";
import { INDIAN_STATES, STATE_PLACEHOLDER } from "@/lib/states";
import {
  firstInvalidField,
  hasErrors,
  normaliseCheckoutDetails,
  validateCheckoutDetails,
  type CheckoutDetails,
  type FieldErrors,
} from "@/lib/validation";
import { useRazorpayScript } from "@/components/use-razorpay";

type Stage = "idle" | "preparing" | "verifying";

type CreateOrderResponse = {
  keyId: string;
  razorpayOrderId: string;
  orderId: string;
  amount: number;
  currency: string;
};

const emptyDetails: CheckoutDetails = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: STATE_PLACEHOLDER,
  postalCode: "",
};

export default function CheckoutForm({
  shippingFeeInr,
  freeAboveInr,
}: {
  shippingFeeInr: number;
  freeAboveInr: number | null;
}) {
  const router = useRouter();
  const { lines, detailedLines, clearCart } = useCart();
  const { ready: scriptReady, failed: scriptFailed, open: openRazorpay } = useRazorpayScript();

  const [details, setDetails] = useState<CheckoutDetails>(emptyDetails);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [stage, setStage] = useState<Stage>("idle");
  const [banner, setBanner] = useState<{ tone: "error" | "info"; message: string } | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  // Reopening the same Razorpay order avoids creating a duplicate if a customer's
  // first attempt failed or was dismissed, so the retry button's enabled state
  // depends on this value and it must live in state, not a ref.
  const [retryOrder, setRetryOrder] = useState<CreateOrderResponse | null>(null);

  const busy = stage !== "idle";

  // Display-only estimate. The amount charged always comes back from the server
  // after it reprices the cart from the catalogue.
  const preview = useMemo(() => {
    const mrpTotal = detailedLines.reduce(
      (sum, line) => sum + line.product.mrp * line.quantity,
      0
    );
    const subtotal = detailedLines.reduce((sum, line) => sum + line.lineTotal, 0);
    const shippingFree = freeAboveInr !== null && subtotal >= freeAboveInr;
    const shipping = shippingFree ? 0 : shippingFeeInr;
    return {
      mrpTotal,
      subtotal,
      discount: mrpTotal - subtotal,
      shipping,
      shippingFree,
      total: subtotal + shipping,
    };
  }, [detailedLines, shippingFeeInr, freeAboveInr]);

  const update = (field: keyof CheckoutDetails) => (value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const focusFirstInvalid = (fieldErrors: FieldErrors) => {
    const field = firstInvalidField(fieldErrors);
    if (!field) return;
    const element = formRef.current?.querySelector<HTMLElement>(`#${field}`);
    element?.focus();
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const verifyPayment = async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    setStage("verifying");
    setBanner(null);

    try {
      const response = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        orderId?: string;
        receiptToken?: string;
        error?: string;
      } | null;

      if (!response.ok || !data?.ok || !data.orderId || !data.receiptToken) {
        setStage("idle");
        setBanner({
          tone: "error",
          message: data?.error ?? "We could not confirm your payment.",
        });
        return;
      }

      // Only now, after server-side verification, is the cart cleared.
      clearCart();
      router.push(`/order-success/${data.orderId}?token=${encodeURIComponent(data.receiptToken)}`);
    } catch {
      setStage("idle");
      setBanner({
        tone: "error",
        message: "We could not reach the server to confirm your payment. Your cart is safe — please try again.",
      });
    }
  };

  const startPayment = async (existing?: CreateOrderResponse) => {
    setBanner(null);

    if (!scriptReady) {
      setBanner({
        tone: "error",
        message:
          "The secure payment window could not load. Check your connection, disable any ad blocker, and try again.",
      });
      return;
    }

    setStage("preparing");

    try {
      let order = existing ?? null;

      if (!order) {
        const normalised = normaliseCheckoutDetails(details);
        const response = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cart: lines.map((line) => ({ slug: line.slug, quantity: line.quantity })),
            details: normalised,
          }),
        });

        const data = (await response.json().catch(() => null)) as
          | (CreateOrderResponse & { error?: string; fieldErrors?: FieldErrors })
          | null;

        if (!response.ok || !data?.razorpayOrderId) {
          setStage("idle");
          if (data?.fieldErrors) {
            setErrors(data.fieldErrors);
            focusFirstInvalid(data.fieldErrors);
          }
          setBanner({
            tone: "error",
            message: data?.error ?? "We could not start the payment. Please try again.",
          });
          return;
        }

        order = data;
      }

      setRetryOrder(order);
      setStage("idle");

      const prefill: RazorpayOptionsPrefill = {};
      if (details.fullName.trim()) prefill.name = details.fullName.trim();
      if (details.phone) prefill.contact = `+91${details.phone}`;
      if (details.email.trim()) prefill.email = details.email.trim();

      const opened = openRazorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: BRAND.name,
        description: `Order ${order.orderId}`,
        prefill,
        notes: { orderId: order.orderId },
        theme: { color: "#5A321F" },
        retry: { enabled: true },
        handler: (response) => {
          void verifyPayment(response);
        },
        modal: {
          ondismiss: () => {
            setStage("idle");
            setBanner({
              tone: "info",
              message: "Payment cancelled. Your cart is still here whenever you are ready.",
            });
          },
          onclose: () => setStage("idle"),
        },
      });

      if (!opened) {
        setBanner({
          tone: "error",
          message: "The payment window could not be opened. Please try again.",
        });
      }
    } catch {
      setStage("idle");
      setBanner({
        tone: "error",
        message: "Something went wrong starting the payment. Please try again.",
      });
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const normalised = normaliseCheckoutDetails(details);
    const fieldErrors = validateCheckoutDetails(normalised);

    if (hasErrors(fieldErrors)) {
      setErrors(fieldErrors);
      setBanner({ tone: "error", message: "Please fix the highlighted fields." });
      focusFirstInvalid(fieldErrors);
      return;
    }

    if (lines.length === 0) {
      setBanner({ tone: "error", message: "Your cart is empty." });
      return;
    }

    setDetails(normalised);
    void startPayment();
  };

  const retryPayment = () => {
    if (retryOrder) void startPayment(retryOrder);
  };

  const fieldClass = (field: keyof CheckoutDetails) =>
    `w-full rounded-xl border bg-[var(--white)] px-4 py-3 text-sm outline-none transition-colors ${
      errors[field]
        ? "border-red-400 focus:border-red-500"
        : "border-black/10 focus:border-[var(--ginger-terracotta)]"
    }`;

  const labelClass = "mb-1.5 block text-sm font-medium text-[var(--dark-text)]";
  const requiredMark = <span aria-hidden="true" className="text-red-500"> *</span>;
  const errorFor = (field: keyof CheckoutDetails) =>
    errors[field] ? (
      <p id={`${field}-error`} role="alert" className="mt-1.5 text-xs text-red-600">
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className="rounded-2xl border border-black/5 bg-[var(--white)] p-6 shadow-sm sm:p-8"
      >
        <h2 className="font-serif text-lg font-bold text-[var(--dark-text)]">
          Delivery details
        </h2>
        <p className="mt-1 text-sm text-[var(--dark-text)]/60">
          All fields marked with an asterisk are required.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="fullName" className={labelClass}>
              Full Name{requiredMark}
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={details.fullName}
              onChange={(event) => update("fullName")(event.target.value)}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              className={fieldClass("fullName")}
            />
            {errorFor("fullName")}
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>
              Mobile Number{requiredMark}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={15}
              required
              value={details.phone}
              onChange={(event) => update("phone")(event.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
              placeholder="9876543210"
              className={fieldClass("phone")}
            />
            {errors.phone ? (
              errorFor("phone")
            ) : (
              <p id="phone-hint" className="mt-1.5 text-xs text-[var(--dark-text)]/50">
                10-digit Indian mobile number
              </p>
            )}
          </div>

          <div>
            <label htmlFor="postalCode" className={labelClass}>
              PIN Code{requiredMark}
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              required
              value={details.postalCode}
              onChange={(event) => update("postalCode")(event.target.value)}
              aria-invalid={Boolean(errors.postalCode)}
              aria-describedby={errors.postalCode ? "postalCode-error" : undefined}
              placeholder="276001"
              className={fieldClass("postalCode")}
            />
            {errorFor("postalCode")}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className={labelClass}>
              Address{requiredMark}
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              autoComplete="street-address"
              required
              value={details.address}
              onChange={(event) => update("address")(event.target.value)}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? "address-error" : undefined}
              placeholder="House/Flat No., Street, Area, Landmark"
              className={`${fieldClass("address")} resize-y`}
            />
            {errorFor("address")}
          </div>

          <div>
            <label htmlFor="city" className={labelClass}>
              City{requiredMark}
            </label>
            <input
              id="city"
              name="city"
              type="text"
              autoComplete="address-level2"
              required
              value={details.city}
              onChange={(event) => update("city")(event.target.value)}
              aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? "city-error" : undefined}
              className={fieldClass("city")}
            />
            {errorFor("city")}
          </div>

          <div>
            <label htmlFor="state" className={labelClass}>
              State{requiredMark}
            </label>
            <select
              id="state"
              name="state"
              autoComplete="address-level1"
              required
              value={details.state}
              onChange={(event) => update("state")(event.target.value)}
              aria-invalid={Boolean(errors.state)}
              aria-describedby={errors.state ? "state-error" : undefined}
              className={`${fieldClass("state")} appearance-none bg-[right_0.75rem_center] bg-no-repeat pr-10`}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%235A321F'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
                backgroundSize: "1.25rem 1.25rem",
              }}
            >
              <option value={STATE_PLACEHOLDER}>{STATE_PLACEHOLDER}</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {errorFor("state")}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="email" className={labelClass}>
              Email <span className="font-normal text-[var(--dark-text)]/50">(optional)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={details.email}
              onChange={(event) => update("email")(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              placeholder="you@example.com"
              className={fieldClass("email")}
            />
            {errorFor("email")}
          </div>
        </div>

        {banner && (
          <div
            role="alert"
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              banner.tone === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <p>{banner.message}</p>
            {banner.message.toLowerCase().includes("cancelled") && (
              <button
                type="button"
                onClick={retryPayment}
                disabled={busy || !retryOrder}
                className="mt-3 rounded-full bg-[var(--jaggery-brown)] px-4 py-2 text-xs font-semibold text-[var(--white)] disabled:opacity-50"
              >
                TRY PAYMENT AGAIN
              </button>
            )}
          </div>
        )}

        {scriptFailed && !banner && (
          <p role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            The secure payment window could not load. Please refresh the page or disable any ad blocker.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-[var(--jaggery-brown)] px-7 py-3.5 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {stage === "preparing"
              ? "Preparing secure payment..."
              : stage === "verifying"
                ? "Verifying payment..."
                : "PROCEED TO PAYMENT"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/cart")}
            disabled={busy}
            className="w-full rounded-full border border-black/10 px-7 py-3.5 text-sm font-semibold text-[var(--dark-text)] transition-colors hover:bg-black/5 disabled:opacity-50 sm:w-auto"
          >
            BACK TO CART
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-[var(--dark-text)]/55">
          Your order is only confirmed after Razorpay confirms the payment on our server. If you
          cancel or the payment fails, nothing is charged and your cart stays exactly as it is.
        </p>
      </form>

      <aside className="h-fit rounded-2xl border border-black/5 bg-[var(--white)] p-6 lg:sticky lg:top-28">
        <h2 className="font-serif text-lg font-bold text-[var(--dark-text)]">Order summary</h2>

        <CheckoutLines />

        <dl className="mt-6 space-y-3 border-t border-black/5 pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--dark-text)]/70">MRP total</dt>
            <dd className="font-medium">{formatPrice(preview.mrpTotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--dark-text)]/70">Discount</dt>
            <dd className="font-medium text-[var(--natural-green)]">
              &minus; {formatPrice(preview.discount)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--dark-text)]/70">Subtotal</dt>
            <dd className="font-medium">{formatPrice(preview.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--dark-text)]/70">Shipping</dt>
            <dd className="font-medium">
              {preview.shippingFree ? "Free" : formatPrice(preview.shipping)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-black/5 pt-3 text-base font-bold text-[var(--jaggery-brown)]">
            <dt>Total</dt>
            <dd>{formatPrice(preview.total)}</dd>
          </div>
        </dl>

        {freeAboveInr !== null && (
          <p className="mt-3 text-xs text-[var(--dark-text)]/55">
            Free shipping on orders above {formatPrice(freeAboveInr)}.
          </p>
        )}

        <p className="mt-4 text-xs leading-relaxed text-[var(--dark-text)]/55">
          The final amount is calculated on our server when the payment starts, so the total you pay
          always matches the price in our records.
        </p>

        <p className="mt-4 text-sm">
          <Link href="/cart" className="text-[var(--ginger-terracotta)] underline underline-offset-4">
            Edit cart
          </Link>
        </p>
      </aside>
    </div>
  );
}

type RazorpayOptionsPrefill = { name?: string; contact?: string; email?: string };

function CheckoutLines() {
  const { detailedLines } = useCart();

  return (
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
  );
}