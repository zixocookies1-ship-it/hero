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