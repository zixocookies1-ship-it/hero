import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { loadCatalogue } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Nature's Choice Jaggery",
  description:
    "Premium Indian jaggery - traditional gold-kettle method, no preservatives, three authentic flavours.",
};

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
      <body className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
        <CartProvider catalogue={catalogue}>{children}</CartProvider>
      </body>
    </html>
  );
}