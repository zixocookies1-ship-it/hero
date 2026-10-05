import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import WhatsAppFloat from "@/components/whatsapp-float";

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