import Image from "next/image";
import Link from "next/link";
import { products } from "@/lib/products";

export default function Footer() {
  return (
    <footer className="bg-[var(--jaggery-brown)] py-14 text-[var(--white)]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Nature's Choice Jaggery"
                width={48}
                height={48}
                className="h-11 w-11 object-contain"
              />
              <span className="font-heading text-lg font-bold">
                Nature&apos;s Choice Jaggery
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--white)]/80">
              Premium, naturally processed jaggery from sugarcane farms in
              Maharashtra. Slow-cooked in pure clay pots over natural wood fire,
              with no preservatives and no chemicals.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest">
              Products
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--white)]/70">
              {products.map((product) => (
                <li key={product.slug}>
                  <Link
                    href={`/products/${product.slug}`}
                    className="transition-colors hover:text-[var(--ginger-terracotta)]"
                  >
                    {product.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--white)]/70">
              <li>
                <Link href="/" className="transition-colors hover:text-[var(--ginger-terracotta)]">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-[var(--ginger-terracotta)]">
                  About
                </Link>
              </li>
              <li>
                <Link href="/products" className="transition-colors hover:text-[var(--ginger-terracotta)]">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-[var(--ginger-terracotta)]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/cart" className="transition-colors hover:text-[var(--ginger-terracotta)]">
                  Cart
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--white)]/10 pt-6 text-xs text-[var(--white)]/60 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Nature&apos;s Choice Jaggery. All rights reserved.</p>
          <p>Made with care in Maharashtra, India.</p>
        </div>
      </div>
    </footer>
  );
}