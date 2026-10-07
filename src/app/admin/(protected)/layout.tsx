import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrderCounts } from "@/lib/orders";
import AdminLogout from "@/components/admin-logout";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/combos", label: "Combos" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/delivery", label: "Delivery" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/settings", label: "Settings" },
];

/**
 * Guarded admin shell. Every page under this route group requires a valid
 * signed session cookie, so customer names, addresses and payment ids are never
 * served to an anonymous visitor.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await requireAdmin();

  // The counts are a convenience only: a database problem must not lock the
  // admin out, so failures degrade to zero rather than throwing.
  let counts = { paid: 0, pending: 0, failed: 0, total: 0 };
  try {
    counts = await getOrderCounts();
  } catch (error) {
    console.error("admin order counts unavailable", error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ginger-terracotta)]">
              Admin
            </p>
            <h1 className="font-serif text-xl font-bold text-[var(--jaggery-brown)]">
              Nature&apos;s Choice
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">{email}</span>
            <AdminLogout />
          </div>
        </div>

        <nav className="mx-auto max-w-7xl px-6 pb-4">
          <ul className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block rounded-full border border-black/10 px-4 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)]"
                >
                  {item.label}
                  {item.href === "/admin/orders" && counts.total > 0
                    ? ` (${counts.total})`
                    : ""}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}