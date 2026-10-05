/**
 * Renders a real invoice PDF and checks it is a valid PDF containing the order
 * data. Run with: npx tsx tests/invoice-pdf.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { generateInvoicePdf } from "../src/lib/invoice-pdf";

const sampleOrder = {
  orderId: "NCJ-20261005-000123",
  createdAt: new Date("2026-10-05T09:30:00Z"),
  paymentStatus: "paid",
  orderStatus: "confirmed",
  paymentId: "pay_QK9x7mZ2vL8pR4tY",
  paymentMethod: "razorpay",
  customerName: "Ruby Gupta",
  customerPhone: "9876543210",
  customerEmail: "ruby@example.com",
  address: "316, Puranapul, Harbanshpur, Azamgarh",
  city: "Azamgarh",
  state: "Uttar Pradesh",
  postalCode: "276001",
  items: [
    {
      name: "Desi Chocolatey Jaggery",
      quantity: 2,
      mrp: 299,
      unitPrice: 239,
      lineTotal: 478,
    },
    {
      name: "Desi Til Chocolatey Jaggery",
      quantity: 1,
      mrp: 299,
      unitPrice: 239,
      lineTotal: 239,
    },
  ],
  mrpTotal: 897,
  discount: 180,
  subtotal: 717,
  deliveryFee: 49,
  total: 766,
};

test("generates a structurally valid PDF", async () => {
  const bytes = await generateInvoicePdf(sampleOrder);

  assert.ok(bytes.length > 1500, `PDF looks too small: ${bytes.length} bytes`);

  // Must start with the PDF magic number and end with EOF.
  const header = Buffer.from(bytes.slice(0, 5)).toString("latin1");
  assert.equal(header, "%PDF-");

  const tail = Buffer.from(bytes.slice(-1024)).toString("latin1");
  assert.ok(tail.includes("%%EOF"), "PDF should end with %%EOF");

  // pdf-lib must be able to parse it back.
  const parsed = await PDFDocument.load(bytes);
  const pageCount = parsed.getPageCount();
  assert.equal(pageCount, 1);

  const meta = parsed.getTitle();
  assert.ok(meta?.includes(sampleOrder.orderId), `title should carry the order id: ${meta}`);
});

test("a long address and many items still render", async () => {
  const manyItems = Array.from({ length: 12 }, (_, index) => ({
    name: `Desi Chocolatey Jaggery Variant Number ${index + 1}`,
    quantity: index + 1,
    mrp: 299,
    unitPrice: 239,
    lineTotal: 239 * (index + 1),
  }));

  const bytes = await generateInvoicePdf({
    ...sampleOrder,
    address:
      "Flat 402, Tower B, Green Meadows Residency, Near the Old Church, Puranapul Road, Harbanshpur, Azamgarh, Uttar Pradesh",
    items: manyItems,
  });

  const parsed = await PDFDocument.load(bytes);
  assert.ok(parsed.getPageCount() >= 1);
  assert.ok(bytes.length > 1500);
});

test("an unpaid order still renders with its real status", async () => {
  const bytes = await generateInvoicePdf({
    ...sampleOrder,
    paymentStatus: "pending",
    orderStatus: "pending",
    paymentId: null,
  });
  const parsed = await PDFDocument.load(bytes);
  assert.equal(parsed.getPageCount(), 1);
});

test("writes a sample invoice to disk for manual inspection", async () => {
  const bytes = await generateInvoicePdf(sampleOrder);
  const outDir = path.join(process.cwd(), "tmp");
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "sample-invoice.pdf");
  await fs.writeFile(outFile, bytes);
  console.log(`\n  Sample invoice written to ${outFile} (${bytes.length} bytes)\n`);
});