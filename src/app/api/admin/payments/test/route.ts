import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { razorpayConfigured } from "@/lib/env";
import { testRazorpayConnection } from "@/lib/razorpay-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only probe that exercises the configured Razorpay key pair against
 * Razorpay's API (a one-order listing round-trip). The key secret never
 * appears in the request, the response or the logs.
 *
 * Returns 409 when no key pair is configured at all, so the page can prompt
 * the operator to add the environment variables instead of wiring credentials
 * into the database.
 */
export async function POST() {
  const email = await requireAdminApi();
  if (!email) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  if (!razorpayConfigured()) {
    return NextResponse.json({ ok: false, error: "No Razorpay key pair is configured on the server." }, { status: 409 });
  }

  try {
    await testRazorpayConnection();
    return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error("[razorpay] admin connectivity test failed", error);
    return NextResponse.json(
      { ok: false, error: "Razorpay could not be reached with the configured keys. Check the key id and secret on the server." },
      { status: 502 }
    );
  }
}