import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import WhatsAppFloat from "@/components/whatsapp-float";

/**
 * The storefront renders from the database, so none of it can be baked at build
 * time — an admin edit to a price, a banner or a product must appear on the
 * next request rather than on the next deploy. Inherited by every route in this
 * segment.
 */
export const dynamic = "force-dynamic";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}