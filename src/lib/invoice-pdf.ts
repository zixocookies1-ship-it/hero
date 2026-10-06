import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { BRAND, type Address } from "@/lib/brand";
import { formatIndianDate } from "@/lib/order-id";

const BROWN = rgb(0x5a / 255, 0x32 / 255, 0x1f / 255);
const TERRACOTTA = rgb(0xc8 / 255, 0x79 / 255, 0x45 / 255);
const CREAM = rgb(0xf7 / 255, 0xf1 / 255, 0xe7 / 255);
const DARK = rgb(0x24 / 255, 0x21 / 255, 0x1d / 255);
const MUTED = rgb(0x6b / 255, 0x64 / 255, 0x5d / 255);
const GREEN = rgb(0x31 / 255, 0x4c / 255, 0x38 / 255);

const PAGE_WIDTH = 595.28; // A4 at 72dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 44;

export type InvoiceOrder = {
  orderId: string;
  createdAt: Date;
  paymentStatus: string;
  orderStatus: string;
  paymentId: string | null;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  items: Array<{
    name: string;
    quantity: number;
    mrp: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  mrpTotal: number;
  discount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
};

const rupees = (value: number): string =>
  `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function loadLogo(): Promise<Buffer | null> {
  // public/ ships with the build output, but a missing file must never break a
  // customer's receipt, so failure falls back to a drawn wordmark.
  const publicDir = path.join(process.cwd(), "public");

  try {
    return await fs.readFile(path.join(publicDir, "images", "logo.png"));
  } catch {
    return null;
  }
}

/** Wraps text to a width, returning the lines that fit. */
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawLabel(page: PDFPage, text: string, x: number, y: number, font: PDFFont) {
  page.drawText(text.toUpperCase(), {
    x,
    y,
    size: 7.5,
    font,
    color: MUTED,
  });
}

export async function generateInvoicePdf(
  order: InvoiceOrder,
  /**
   * Business details printed on the invoice. Defaults to the shipped values so
   * the existing call sites keep working; the route that streams the PDF passes
   * the stored settings so an edit to the company name reaches the receipt.
   */
  brand: {
    name: string;
    address: Address;
    phoneDisplay: string;
    email: string;
  } = BRAND
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${brand.name} — Order ${order.orderId}`);
  doc.setAuthor(brand.name);
  doc.setSubject("Order confirmation and invoice");
  doc.setCreator(brand.name);

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  let logoBytes: Buffer | null = null;
  try {
    logoBytes = await loadLogo();
  } catch {
    logoBytes = null;
  }

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  let y = PAGE_HEIGHT - MARGIN;

  // ---- Header band -------------------------------------------------------
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 96,
    width: PAGE_WIDTH,
    height: 96,
    color: BROWN,
  });

  let headerTextX = MARGIN;
  if (logoBytes) {
    try {
      const logo = await doc.embedPng(logoBytes);
      const scaled = logo.scaleToFit(46, 46);
      page.drawImage(logo, {
        x: MARGIN,
        y: PAGE_HEIGHT - 72,
        width: scaled.width,
        height: scaled.height,
      });
      headerTextX = MARGIN + scaled.width + 14;
    } catch {
      headerTextX = MARGIN;
    }
  }

  page.drawText(brand.name.toUpperCase(), {
    x: headerTextX,
    y: PAGE_HEIGHT - 42,
    size: 15,
    font: bold,
    color: CREAM,
  });
  page.drawText("Order Confirmation / Invoice", {
    x: headerTextX,
    y: PAGE_HEIGHT - 60,
    size: 10,
    font: regular,
    color: TERRACOTTA,
  });

  page.drawText(`#${order.orderId}`, {
    x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(`#${order.orderId}`, 11),
    y: PAGE_HEIGHT - 46,
    size: 11,
    font: bold,
    color: CREAM,
  });
  page.drawText(formatIndianDate(order.createdAt), {
    x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(formatIndianDate(order.createdAt), 9),
    y: PAGE_HEIGHT - 62,
    size: 9,
    font: regular,
    color: CREAM,
  });

  y = PAGE_HEIGHT - 128;

  // ---- Payment status pill ----------------------------------------------
  const paid = order.paymentStatus === "paid";
  const statusText = paid ? "PAID" : order.paymentStatus.toUpperCase();
  page.drawRectangle({
    x: MARGIN,
    y: y - 6,
    width: 78,
    height: 22,
    color: paid ? GREEN : TERRACOTTA,
  });
  page.drawText(statusText, {
    x: MARGIN + 12,
    y: y + 1,
    size: 10,
    font: bold,
    color: CREAM,
  });
  page.drawText(
    paid
      ? "Thank you. Your payment has been received and your order is confirmed."
      : "This order is not yet paid.",
    { x: MARGIN + 92, y: y + 1, size: 9.5, font: regular, color: DARK }
  );
  y -= 40;

  // ---- Two column info block --------------------------------------------
  const columnWidth = (contentWidth - 16) / 2;
  const blockHeight = 104;

  const drawInfoBlock = (
    x: number,
    heading: string,
    rows: Array<[string, string]>
  ) => {
    page.drawRectangle({
      x,
      y: y - blockHeight,
      width: columnWidth,
      height: blockHeight,
      borderColor: CREAM,
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });
    page.drawRectangle({ x, y: y - 22, width: columnWidth, height: 22, color: CREAM });

    drawLabel(page, heading, x + 12, y - 15, bold);

    let cursor = y - 38;
    for (const [key, value] of rows) {
      page.drawText(`${key}`, { x: x + 12, y: cursor, size: 8, font: regular, color: MUTED });
      const lines = wrap(value, bold, 8.5, columnWidth - 24 - 62);
      lines.slice(0, 2).forEach((line, index) => {
        page.drawText(line, {
          x: x + 74,
          y: cursor - index * 10,
          size: 8.5,
          font: bold,
          color: DARK,
        });
      });
      cursor -= 22;
    }
  };

  drawInfoBlock(MARGIN, "Order details", [
    ["Order ID", order.orderId],
    ["Order date", formatIndianDate(order.createdAt)],
    ["Order status", order.orderStatus],
    ["Payment ID", order.paymentId ?? "—"],
  ]);

  drawInfoBlock(MARGIN + columnWidth + 16, "Customer details", [
    ["Name", order.customerName],
    ["Mobile", order.customerPhone],
    ["City / State", `${order.city}, ${order.state}`],
    ["PIN code", order.postalCode],
  ]);

  y -= blockHeight + 10;

  page.drawText(`${order.address}`, {
    x: MARGIN,
    y,
    size: 8.5,
    font: regular,
    color: MUTED,
  });
  y -= 26;

  // ---- Items table -------------------------------------------------------
  const columns = {
    name: MARGIN,
    qty: MARGIN + 250,
    mrp: MARGIN + 300,
    price: MARGIN + 370,
    total: MARGIN + 448,
  };

  page.drawRectangle({ x: MARGIN, y: y - 16, width: contentWidth, height: 20, color: BROWN });
  const header = (text: string, x: number, align: "left" | "right") => {
    const size = 8;
    const width = bold.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: align === "right" ? x - width : x,
      y: y - 10,
      size,
      font: bold,
      color: CREAM,
    });
  };
  header("Product", columns.name + 8, "left");
  header("Qty", columns.qty, "right");
  header("MRP", columns.mrp, "right");
  header("Selling", columns.price, "right");
  header("Subtotal", columns.total + 60, "right");
  y -= 16;

  for (const item of order.items) {
    y -= 24;
    const nameLines = wrap(item.name, regular, 9, 236);
    page.drawText(nameLines[0] ?? item.name, {
      x: columns.name + 8,
      y,
      size: 9,
      font: regular,
      color: DARK,
    });

    const cell = (text: string, x: number) => {
      const width = regular.widthOfTextAtSize(text, 9);
      page.drawText(text, { x: x - width, y, size: 9, font: regular, color: DARK });
    };
    cell(String(item.quantity), columns.qty);
    cell(rupees(item.mrp), columns.mrp);
    cell(rupees(item.unitPrice), columns.price);
    cell(rupees(item.lineTotal), columns.total + 60);

    if (nameLines.length > 1) {
      page.drawText(nameLines[1], {
        x: columns.name + 8,
        y: y - 11,
        size: 8,
        font: regular,
        color: MUTED,
      });
    }

    page.drawLine({
      start: { x: MARGIN, y: y - 16 },
      end: { x: MARGIN + contentWidth, y: y - 16 },
      thickness: 0.5,
      color: CREAM,
    });
  }

  y -= 34;

  // ---- Price summary -----------------------------------------------------
  const summaryX = MARGIN + contentWidth - 220;
  const summaryWidth = 220;
  const summaryRows: Array<[string, string, boolean]> = [
    ["MRP total", rupees(order.mrpTotal), false],
    ["Discount", `- ${rupees(order.discount)}`, false],
    ["Subtotal", rupees(order.subtotal), false],
    ["Shipping", order.deliveryFee > 0 ? rupees(order.deliveryFee) : "Free", false],
  ];

  page.drawRectangle({
    x: summaryX,
    y: y - 18 - summaryRows.length * 20 - 30,
    width: summaryWidth,
    height: 18 + summaryRows.length * 20 + 30,
    color: CREAM,
  });

  let cursor = y - 12;
  for (const [label, value, strong] of summaryRows) {
    page.drawText(label, { x: summaryX + 12, y: cursor, size: 9, font: strong ? bold : regular, color: DARK });
    const width = regular.widthOfTextAtSize(value, 9);
    page.drawText(value, {
      x: summaryX + summaryWidth - 12 - width,
      y: cursor,
      size: 9,
      font: strong ? bold : regular,
      color: DARK,
    });
    cursor -= 20;
  }

  page.drawRectangle({
    x: summaryX,
    y: cursor - 6,
    width: summaryWidth,
    height: 26,
    color: BROWN,
  });
  page.drawText("Total paid", {
    x: summaryX + 12,
    y: cursor + 2,
    size: 10,
    font: bold,
    color: CREAM,
  });
  const totalText = rupees(order.total);
  page.drawText(totalText, {
    x: summaryX + summaryWidth - 12 - bold.widthOfTextAtSize(totalText, 10.5),
    y: cursor + 1,
    size: 10.5,
    font: bold,
    color: CREAM,
  });

  y = cursor - 46;

  // ---- Payment block -----------------------------------------------------
  page.drawRectangle({
    x: MARGIN,
    y: y - 74,
    width: contentWidth,
    height: 74,
    borderColor: CREAM,
    borderWidth: 1,
  });
  drawLabel(page, "Payment", MARGIN + 12, y - 16, bold);

  const paymentRows: Array<[string, string]> = [
    ["Payment method", order.paymentMethod === "razorpay" ? "Razorpay" : order.paymentMethod],
    ["Payment status", order.paymentStatus.toUpperCase()],
    ["Razorpay payment ID", order.paymentId ?? "—"],
  ];

  let payCursor = y - 34;
  for (const [key, value] of paymentRows) {
    page.drawText(key, { x: MARGIN + 12, y: payCursor, size: 8.5, font: regular, color: MUTED });
    page.drawText(value, { x: MARGIN + 150, y: payCursor, size: 8.5, font: bold, color: DARK });
    payCursor -= 15;
  }

  y -= 108;

  // ---- Footer ------------------------------------------------------------
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + contentWidth, y },
    thickness: 0.5,
    color: CREAM,
  });
  y -= 18;

  page.drawText("Thank you for choosing Nature's Choice Jaggery.", {
    x: MARGIN,
    y,
    size: 9.5,
    font: bold,
    color: BROWN,
  });
  y -= 14;
  page.drawText(`${brand.address.line1}, ${brand.address.line2}, ${brand.address.cityState} ${brand.address.pincode}`, {
    x: MARGIN,
    y,
    size: 8,
    font: regular,
    color: MUTED,
  });
  y -= 12;
  page.drawText(`WhatsApp ${brand.phoneDisplay}  ·  ${brand.email}`, {
    x: MARGIN,
    y,
    size: 8,
    font: regular,
    color: MUTED,
  });

  page.drawText("This is a computer generated invoice.", {
    x: MARGIN,
    y: 46,
    size: 7.5,
    font: oblique,
    color: MUTED,
  });

  return doc.save();
}