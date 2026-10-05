import Image from "next/image";
import Link from "next/link";
import { BRAND, whatsappLink } from "@/lib/brand";
import { products } from "@/lib/products";
import SocialLinks from "@/components/social-links";

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
                width={80}
                height={80}
                className="h-[74px] w-[74px] object-contain"
              />
              <span className="font-heading text-lg font-bold">
                Nature&apos;s Choice Jaggery
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--white)]/80">
              Premium, naturally processed jaggery from sugarcane farms in
              Uttar Pradesh. Slow-cooked in pure clay pots over natural wood
              fire, with no preservatives and no chemicals.
            </p>

            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--white)]/50">
                Visit us
              </p>
              <address className="mt-2 text-sm not-italic leading-relaxed text-[var(--white)]/80">
                {BRAND.address.line1}, {BRAND.address.line2},{" "}
                {BRAND.address.cityState} {BRAND.address.pincode},{" "}
                {BRAND.address.country}
              </address>
            </div>

            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--white)]/50">
                Talk to us
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-[var(--white)]/80">
                <li>
                  <a
                    href={whatsappLink("Hi, I have a question about your jaggery.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block whitespace-nowrap transition-colors hover:text-[var(--ginger-terracotta)]"
                  >
                    WhatsApp {BRAND.phoneDisplay}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${BRAND.phoneDial}`}
                    className="inline-block whitespace-nowrap transition-colors hover:text-[var(--ginger-terracotta)]"
                  >
                    Call {BRAND.phoneDisplay}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${BRAND.email}`}
                    className="inline-block break-all transition-colors hover:text-[var(--ginger-terracotta)]"
                  >
                    {BRAND.email}
                  </a>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <SocialLinks tone="dark" />
            </div>
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
          <p>Made with care in Azamgarh, Uttar Pradesh, India.</p>
        </div>
      </div>
    </footer>
  );
}
