import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { loadCatalogue } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Nature's Choice Jaggery",
  description:
    "Premium Indian jaggery - traditional gold-kettle method, no preservatives, three authentic flavours.",
};

// The design calls for DM Serif Display on headings and Inter for body copy.
// They are loaded via next/font (self-hosted at build time, display: swap) and
// the CSS variable names are consumed by globals.css, which lists the same
// families as fallbacks so nothing breaks if a subset fails to load.
const headingFont = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading-loaded",
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // One catalogue read per request, handed to the cart so slugs validate and
  // lines price against what the admin currently has published. loadCatalogue
  // falls back to the shipped list rather than throwing, so this await cannot
  // take the whole tree down if the database is unreachable.
  const catalogue = await loadCatalogue();

  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]`}
      >
        <CartProvider catalogue={catalogue}>{children}</CartProvider>
      </body>
    </html>
  );
}