import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import CartDrawer from "@/components/cart-drawer";
import { loadCatalogue, loadCombos, loadShippingPolicy } from "@/lib/cms";
import { siteUrl } from "@/lib/env";

const DEFAULT_DESCRIPTION =
  "Premium Indian jaggery - traditional gold-kettle method, no preservatives, three authentic flavours.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Nature's Choice Jaggery",
  description: DEFAULT_DESCRIPTION,
  applicationName: "Nature's Choice Jaggery",
  openGraph: {
    type: "website",
    siteName: "Nature's Choice Jaggery",
    locale: "en_IN",
    title: "Nature's Choice Jaggery",
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: "Nature's Choice Jaggery",
    description: DEFAULT_DESCRIPTION,
  },
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
  // take the whole tree down if the database is unreachable. Combos ride the
  // same path so a bundle can be added, priced and checked out like a product.
  const catalogue = await loadCatalogue();
  const combos = await loadCombos();
  // The slide-out cart quotes the same shipping rule the cart and checkout
  // pages use, so it is loaded here once (request-cached) rather than fetched
  // from the client — no figure is ever read from the browser.
  const shipping = await loadShippingPolicy();

  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]`}
      >
        <CartProvider catalogue={catalogue} combos={combos}>
          {children}
          <CartDrawer
            catalogue={catalogue}
            shippingFeeInr={shipping.feeInr}
            freeAboveInr={shipping.freeAboveInr}
          />
        </CartProvider>
      </body>
    </html>
  );
}