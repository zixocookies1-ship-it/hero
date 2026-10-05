import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";

export const metadata: Metadata = {
  title: "Nature's Choice Jaggery",
  description:
    "Premium Indian jaggery - traditional gold-kettle method, no preservatives, three authentic flavours.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}