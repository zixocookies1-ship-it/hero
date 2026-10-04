import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata = {
  title: "Nature's Choice Jaggery - The New Age of Indian Jaggery",
  description: "Premium Indian jaggery brand - authentic, natural, and modern",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}