import { hasEnv, requireEnv } from "@/lib/env";

/**
 * Delhivery — the only logistics provider this store hands a shipment to.
 * Every call runs server-side behind an admin session; the API key never
 * reaches the browser.
 *
 * Env: DELHIVERY_API_KEY, DELHIVERY_BASE_URL. `delhiveryConfigured()` gates all
 * live calls, and every network function throws a DelhiveryError that the
 * caller answers cleanly instead of leaking a stack trace.
 *
 * The payload builders and parsers are pure and unit-tested; only the three
 * fetch wrappers touch the network.
 */

export const delhiveryConfigured = (): boolean =>
  hasEnv("DELHIVERY_API_KEY") &&
  hasEnv("DELHIVERY_BASE_URL");

const apiKey = () => requireEnv("DELHIVERY_API_KEY");

const baseUrl = (): string => {
  const value = requireEnv("DELHIVERY_BASE_URL").trim().replace(/\/+$/, "");
  if (/^https?:\/\//.test(value)) return value;
  throw new DelhiveryError(`DELHIVERY_BASE_URL must be a full URL, got "${value}".`);
};

export class DelhiveryError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "DelhiveryError";
  }
}

const INDIAN_PIN_PATTERN = /^[1-9][0-9]{5}$/;

const ddmm = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
};

export type DelhiveryShipmentInput = {
  orderId: string;
  customerName: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  phone: string;
  totalAmountInr: number;
  paymentMode: "Prepaid" | "COD";
  orderDate: Date;
  /** Total order weight in kilograms, at least 0.1. */
  weightKg: number;
  /** Total number of items in the order. */
  quantity: number;
  description: string;
};

/**
 * Builds the JSON body Delhivery's /api/p/create-new-shipment accepts. Kept
 * pure so the exact wire payload is unit-tested without a live account.
 */
export function buildShipmentJson(input: DelhiveryShipmentInput): Record<string, unknown> {
  // Delhivery wants a bare 10-digit Indian mobile. Country and trunk prefixes
  // ("+91", "0") are dropped by keeping only the trailing ten digits.
  const phone = input.phone.replace(/\D/g, "").slice(-10);
  return {
    format: "json",
    shipments: [
      {
        name: input.customerName.trim().slice(0, 100),
        add: input.address.trim().slice(0, 200),
        city: input.city.trim().slice(0, 60),
        state: input.state.trim().slice(0, 60),
        pin: input.pin.trim().slice(0, 6),
        phone,
        country: "India",
        order: input.orderId.trim().slice(0, 50),
        payment_mode: input.paymentMode,
        order_date: ddmm(input.orderDate),
        total_amount: Math.round(input.totalAmountInr),
        weight: roundKg(input.weightKg),
        quantity: Math.max(1, Math.round(input.quantity)),
        shipment_type: "Surface",
        products_desc: input.description.trim().slice(0, 500),
      },
    ],
  };
}

export const roundKg = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0.5;
  return Math.round(value * 1000) / 1000;
};

/**
 * A booking response contains one or more Shipment objects carrying an AWB.
 * The shape has drifted across Delhivery API versions, so it is walked
 * defensively rather than pinned to one layout.
 */
export function parseAWB(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const root = response as Record<string, unknown>;

  const shipments = Array.isArray(root.Shipments) ? root.Shipments : [];
  for (const shipment of shipments) {
    if (!shipment || typeof shipment !== "object") continue;
    const entry = shipment as Record<string, unknown>;

    const candidates: unknown[] = [];
    if (Array.isArray(entry.ShipmentData)) candidates.push(...entry.ShipmentData);
    if (Array.isArray(entry.Shipment)) candidates.push(...entry.Shipment);
    const delivery = entry.DeliveryResponse;
    if (delivery && typeof delivery === "object") {
      const dlv = (delivery as { dlvresponse?: unknown }).dlvresponse;
      if (Array.isArray(dlv)) candidates.push(...dlv);
    }

    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== "object") continue;
      const row = candidate as Record<string, unknown>;
      const awb = row.AWB ?? row.awb ?? row.Waybill ?? row.waybill;
      if (typeof awb === "string" && awb.trim()) return awb.trim();
    }
  }

  return null;
}

/** An order can only be booked as Prepaid once its payment is verified. */
export function paymentModeForOrder(paymentVerified: boolean): "Prepaid" | "COD" {
  return paymentVerified ? "Prepaid" : "COD";
}

/**
 * Reads the pincode-serviceability response. Returns true when Delhivery says
 * the pin is deliverable, false when it is not, and null when the payload does
 * not carry an answer we can trust (so a caller can skip the check instead of
 * blocking a shopper on a malformed reply).
 */
export function parsePincodeServiceability(response: unknown): boolean | null {
  if (!response || typeof response !== "object") return null;
  const root = response as Record<string, unknown>;
  const codes = Array.isArray(root.delivery_codes) ? root.delivery_codes : [];

  for (const entry of codes) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as { postal_code?: unknown };
    if (!row.postal_code || typeof row.postal_code !== "object") continue;
    const post = row.postal_code as { delivery_status?: unknown; deliverability?: unknown };
    const status = post.delivery_status ?? post.deliverability;
    if (typeof status === "string") {
      return status.trim().toUpperCase() === "Y";
    }
  }

  return null;
}

async function requestJson(url: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Token ${apiKey()}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new DelhiveryError("Delhivery could not be reached. Check DELHIVERY_BASE_URL.");
  }

  if (!response.ok) {
    throw new DelhiveryError(
      `Delhivery answered with HTTP ${response.status}.`,
      response.status
    );
  }

  try {
    return await response.json();
  } catch {
    throw new DelhiveryError("Delhivery answered with something that is not JSON.");
  }
}

export type ShipmentBooking = {
  awb: string;
  raw: unknown;
};

/** Books a shipment. Only returns after an AWB has actually been seen. */
export async function createDelhiveryShipment(
  input: DelhiveryShipmentInput
): Promise<ShipmentBooking> {
  const payload = buildShipmentJson(input);
  const raw = await requestJson(`${baseUrl()}/api/p/create-new-shipment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const awb = parseAWB(raw);
  if (!awb) {
    throw new DelhiveryError("Delhivery accepted the request but returned no AWB.");
  }

  return { awb, raw };
}

export type DelhiveryStatus = {
  awb: string;
  status: string;
  scans: Array<{ location: string; scan: string; timestamp: string }>;
};

/** Latest tracking detail for one AWB. */
export async function delhiveryTrack(awb: string): Promise<DelhiveryStatus> {
  if (!awb.trim()) throw new DelhiveryError("An AWB number is required to track a shipment.");

  const raw = (await requestJson(
    `${baseUrl()}/api/packet/fetch_packet_details?waybill=${encodeURIComponent(awb.trim())}`
  )) as { ShipmentData?: unknown };

  const rows = Array.isArray(raw.ShipmentData) ? raw.ShipmentData : [];
  const row = (rows[0] ?? {}) as {
    AwbNumber?: unknown;
    Status?: unknown;
    Scan?: unknown;
    Scans?: unknown;
  };

  const scans = Array.isArray(row.Scans)
    ? row.Scans.flatMap((scan: unknown) => {
        if (!scan || typeof scan !== "object") return [];
        const entry = scan as { Scan?: unknown; Location?: unknown; ScannedDateTime?: unknown; DateTime?: unknown; Status?: unknown };
        const location = String(entry.Location ?? entry.Scan ?? "").trim();
        const text = String(entry.Scan ?? entry.Status ?? "").trim();
        const timestamp = String(entry.ScannedDateTime ?? entry.DateTime ?? "").trim();
        return [{ location, scan: text, timestamp }];
      })
    : [];

  return {
    awb: String(row.AwbNumber ?? row.Status ?? awb).trim() || awb,
    status: String(row.Status ?? scans[scans.length - 1]?.scan ?? "").trim(),
    scans,
  };
}

/** True when Delhivery says the pincode is deliverable; null when unknown. */
export async function delhiveryPincodeServiceable(
  pincode: string
): Promise<boolean | null> {
  if (!INDIAN_PIN_PATTERN.test(pincode.trim())) return null;

  const raw = await requestJson(
    `${baseUrl()}/api/pincode/json/?filter_codes=${encodeURIComponent(pincode.trim())}`
  );
  return parsePincodeServiceability(raw);
}