"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; contact?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
    onclose?: () => void;
  };
  retry?: { enabled: boolean };
};

type RazorpayInstance = { open: () => void; on: (event: string, cb: () => void) => void };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/**
 * Loads Razorpay's official Checkout script once and reports when it is ready.
 * If the script cannot load (offline, blocked by an extension, ad blocker), the
 * caller shows a clear message instead of a blank button.
 */
export function useRazorpayScript() {
  // Lazily seeded: if a previous mount already injected the script, the SDK is on
  // window right now and no effect needs to publish that via setState.
  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.Razorpay)
  );
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    if (typeof window === "undefined") return;

    if (window.Razorpay) return;

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    );

    if (existing) {
      existing.addEventListener("load", () => mounted.current && setReady(true));
      existing.addEventListener("error", () => mounted.current && setFailed(true));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => {
      if (!mounted.current) return;
      if (window.Razorpay) setReady(true);
      else setFailed(true);
    });
    script.addEventListener("error", () => mounted.current && setFailed(true));
    document.body.appendChild(script);

    return () => {
      mounted.current = false;
    };
  }, []);

  const open = useCallback((options: RazorpayOptions): boolean => {
    if (!window.Razorpay) {
      setFailed(true);
      return false;
    }
    try {
      const instance = new window.Razorpay(options);
      instance.open();
      return true;
    } catch (error) {
      console.error("failed to open Razorpay checkout", error);
      setFailed(true);
      return false;
    }
  }, []);

  return { ready, failed, open };
}