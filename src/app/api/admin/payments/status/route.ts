import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import { razorpayConfigured, optionalEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reports the payment configuration in a form the admin page can render:
 * whether online payments are switched on, the display name shown at checkout,
 * and whether a Razorpay key pair exists on the server. Only a masked key id
 * ever leaves the server — the full key id stays server-side and the key secret
 * is never read out, let alone returned.
 */
export async function GET() {
  const email = await requireAdminApi();
  if (!email) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  try {
    const row = await prisma.businessSettings.findFirst({
      select: { onlinePaymentEnabled: true, razorpayDisplayName: true },
    });

    const keyId = optionalEnv("RAZORPAY_KEY_ID");
    const maskedKeyId = keyId
      ? `${keyId.slice(0, 8)}…${keyId.slice(-4)}`
      : null;

    return NextResponse.json({
      configured: razorpayConfigured(),
      keyId: maskedKeyId,
      onlinePaymentsEnabled: row?.onlinePaymentEnabled ?? true,
      displayName: row?.razorpayDisplayName ?? "",
    });
  } catch (error) {
    console.error("[mongo] admin payment status failed", error);
    return NextResponse.json(
      { error: "Payment settings could not be loaded." },
      { status: 500 }
    );
  }
}