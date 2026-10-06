/**
 * Offline cover for the Delhivery wire format — the exact payload we send and
 * the exact AWB/pincode answers we read. These are deliberately pure: no HTTP,
 * so the byte layout is exercised here rather than against a live account whose
 * keys this repo must never hold. The fetch wrappers in delhivery-server.ts
 * build on exactly these functions, so a passing test pins the wire contract.
 *
 * Run with: npx tsx --test tests/delhivery-server.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildShipmentJson,
  parseAWB,
  parsePincodeServiceability,
  paymentModeForOrder,
  roundKg,
  type DelhiveryShipmentInput,
} from "../src/lib/delhivery-server";

const input = (overrides: Partial<DelhiveryShipmentInput> = {}): DelhiveryShipmentInput => ({
  orderId: "NC-000123",
  customerName: "Ruby Gupta",
  address: "12, Rosewood Lane, Defence Colony",
  city: "New Delhi",
  state: "Delhi",
  pin: "110024",
  phone: "+91 98765 43210",
  totalAmountInr: 287,
  paymentMode: "Prepaid",
  orderDate: new Date("2026-10-05T09:30:00.000Z"),
  weightKg: 1.25,
  quantity: 2,
  description: "2× Desi Chocolatey Jaggery",
  ...overrides,
});

// 1. The shipment JSON we post to /api/p/create-new-shipment.
test("the shipment payload carries the fields Delhivery needs", () => {
  const payload = buildShipmentJson(input());

  assert.equal(payload.format, "json");
  const shipments = payload.shipments as Array<Record<string, unknown>>;
  assert.equal(shipments.length, 1);

  const row = shipments[0];
  assert.equal(row.name, "Ruby Gupta");
  assert.equal(row.add, "12, Rosewood Lane, Defence Colony");
  assert.equal(row.city, "New Delhi");
  assert.equal(row.state, "Delhi");
  assert.equal(row.pin, "110024");
  assert.equal(row.phone, "9876543210", "the phone is sent bare and digit-only");
  assert.equal(row.country, "India");
  assert.equal(row.order, "NC-000123");
  assert.equal(row.payment_mode, "Prepaid");
  assert.equal(row.order_date, "05/10/2026", "order dates are DD/MM/YYYY");
  assert.equal(row.total_amount, 287, "amounts go in whole rupees");
  assert.equal(row.weight, 1.25);
  assert.equal(row.quantity, 2);
  assert.equal(row.shipment_type, "Surface");
});

test("the shipment payload truncates and scrubs free-text fields", () => {
  const payload = buildShipmentJson(
    input({
      customerName: "A".repeat(300),
      address: "B".repeat(300),
      orderId: "C".repeat(300),
      phone: "call me: 98765 43210 x 1",
      totalAmountInr: 287.6,
      weightKg: 0.001,
    })
  );
  const row = (payload.shipments as Array<Record<string, unknown>>)[0];

  assert.equal((row.name as string).length, 100);
  assert.equal((row.add as string).length, 200);
  assert.equal((row.order as string).length, 50);
  assert.equal((row.phone as string).length, 10, "non-digits are stripped");
  assert.equal(row.total_amount, 288, "waist-up totals round");
});

test("a weight below the floor still books as half a kilogram", () => {
  const payload = buildShipmentJson(input({ weightKg: 0 }));
  const row = (payload.shipments as Array<Record<string, unknown>>)[0];
  assert.equal(row.weight, 0.5);
});

// 2. Small helpers.
test("roundKg clamps to a positive number and 3 decimal places", () => {
  assert.equal(roundKg(1), 1);
  assert.equal(roundKg(1.23456), 1.235);
  assert.equal(roundKg(-5), 0.5);
  assert.equal(roundKg(Number.NaN), 0.5);
});

test("an order is Prepaid only once its payment is verified, else COD", () => {
  assert.equal(paymentModeForOrder(true), "Prepaid");
  assert.equal(paymentModeForOrder(false), "COD");
});

// 3. Reading the booking response.
test("parseAWB finds the AWB across the documented response shapes", () => {
  assert.equal(
    parseAWB({
      Shipments: [{ ShipmentData: [{ AWB: "20317488613", OrderID: "NC-000123" }] }],
    }),
    "20317488613"
  );
  assert.equal(
    parseAWB({ Shipments: [{ Shipment: [{ AWB: "20317488614" }] }] }),
    "20317488614"
  );
  assert.equal(parseAWB({ Shipments: [{ DeliveryResponse: { dlvresponse: [{ Waybill: "ABC2026" }] } }] }), "ABC2026");
});

test("parseAWB returns null when no AWB exists", () => {
  assert.equal(parseAWB({}), null);
  assert.equal(parseAWB({ Shipments: [{ Response: "Failed" }] }), null);
  assert.equal(parseAWB(null), null);
  assert.equal(parseAWB("not json"), null);
});

// 4. Reading the pincode serviceability response.
test("a deliverable pincode reads as true", () => {
  const response = {
    delivery_codes: [
      { is_rt: false, postal_code: { pin: "110024", delivery_status: "Y" } },
    ],
  };
  assert.equal(parsePincodeServiceability(response), true);
});

test("an undeliverable pincode reads as false", () => {
  const response = {
    delivery_codes: [
      { is_rt: false, postal_code: { pin: "110024", delivery_status: "N", delivery_status_long: "No route available" } },
    ],
  };
  assert.equal(parsePincodeServiceability(response), false);
});

test("an answer without a readable status returns null, so checkout can skip it", () => {
  assert.equal(parsePincodeServiceability({}), null);
  assert.equal(parsePincodeServiceability({ delivery_codes: [] }), null);
  assert.equal(
    parsePincodeServiceability({ delivery_codes: [{ postal_code: { pin: "110024" } }] }),
    null
  );
  assert.equal(parsePincodeServiceability(null), null);
});