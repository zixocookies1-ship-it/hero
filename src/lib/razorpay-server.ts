import crypto from "node:crypto";
import Razorpay from "razorpay";
import { optionalEnv, razorpayConfigured, requireEnv } from "@/lib/env";

/**
 * Razorpay Checkout is opened in the browser with the KEY ID only. The secret
 * never leaves this module.
 */
export function getRazorpayKeyId(): string {
  return requireEnv("RAZORPAY_KEY_ID");
}

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: requireEnv("RAZORPAY_KEY_ID"),
      key_secret: requireEnv("RAZORPAY_KEY_SECRET"),
    });
  }
  return client;
}

export type CreatedRazorpayOrder = {
  id: string;
  amountInPaise: number;
  currency: string;
  receipt: string;
};

/**
 * Creates the Razorpay order server-side for an amount we calculated ourselves.
 * The amount is passed in paise, never in rupees, and never from the browser.
 */
export async function createRazorpayOrder(params: {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<CreatedRazorpayOrder> {
  if (!Number.isInteger(params.amountInPaise) || params.amountInPaise < 100) {
    throw new Error("Refusing to create a Razorpay order for an invalid amount.");
  }

  const order = await getClient().orders.create({
    amount: params.amountInPaise,
    currency: "INR",
    receipt: params.receipt,
    notes: params.notes ?? {},
  });

  if (!order.id) throw new Error("Razorpay did not return an order id.");

  return {
    id: order.id,
    amountInPaise: order.amount as number,
    currency: order.currency,
    receipt: String(order.receipt ?? params.receipt),
  };
}

export async function fetchRazorpayOrder(razorpayOrderId: string) {
  return getClient().orders.fetch(razorpayOrderId);
}

/**
 * Fetches a payment from Razorpay's server. This is the authoritative answer to
 * "was this money actually taken?", so reconciliation paths (webhook, status
 * polling) confirm capture here rather than trusting anything the browser sent.
 */
export async function fetchRazorpayPayment(razorpayPaymentId: string) {
  return getClient().payments.fetch(razorpayPaymentId);
}

/**
 * Reduces a Razorpay SDK failure to safe, loggable fields.
 *
 * Razorpay's errors carry the merchant-facing description we need for
 * diagnostics ("Business - Website mismatch", "Payment details not provided",
 * bank declines) alongside a request id. The key secret and the payment payload
 * are never included, so this is safe to write to logs.
 */
export function describeRazorpayError(error: unknown): {
  code: string | null;
  description: string | null;
  source: string | null;
  step: string | null;
  requestId: string | null;
  status: number | null;
} {
  const raw = (error ?? {}) as {
    code?: unknown;
    description?: unknown;
    source?: unknown;
    step?: unknown;
    request_id?: unknown;
    statusCode?: unknown;
    status?: unknown;
    message?: unknown;
  };
  const text = (value: unknown) =>
    typeof value === "string" && value.trim() ? value.trim().slice(0, 300) : null;

  return {
    code: text(raw.code),
    description: text(raw.description),
    source: text(raw.source),
    step: text(raw.step),
    requestId: text(raw.request_id),
    status: typeof raw.statusCode === "number" ? raw.statusCode : null,
  };
}

/**
 * Best-effort Razorpay connectivity check for the admin Payments page.
 *
 * Listing one order exercises the full request/signing round-trip against the
 * configured key pair without handing the secret to the browser. The scope is
 * intentional: count: 1, so zero orders placed here is still a "connected"
 * result.
 *
 * Never logs, echoes or returns the key secret.
 */
export async function testRazorpayConnection(): Promise<void> {
  const instance = getClient();
  const orders = (await instance.orders.all({ count: 1 })) as { items?: unknown[] };
  void orders.items;
}

/**
 * Verifies the Razorpay payment signature exactly as Razorpay documents:
 *
 *   HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
 *
 * This must run on the server. A payment is only treated as paid when this
 * returns true.
 */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  keySecret?: string;
}): boolean {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;

  const keySecret = params.keySecret ?? optionalEnv("RAZORPAY_KEY_SECRET");
  if (!keySecret) return false;

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  // Length check first: timingSafeEqual throws if the buffers differ in length.
  const received = Buffer.from(razorpaySignature, "utf8");
  const computed = Buffer.from(expected, "utf8");
  if (received.length !== computed.length) return false;

  return crypto.timingSafeEqual(received, computed);
}

export { razorpayConfigured };