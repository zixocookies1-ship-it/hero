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
              Uttar Pradesh. Slow-cooked in pure clay pots over natural wood
              fire, with no preservatives and no chemicals.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={whatsappLink("Hi, I have a question about your jaggery.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.896 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.886-9.885 9.886m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>

              <a
                href={`tel:${BRAND.phoneDial}`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--white)]/25 px-4 py-2 text-xs font-semibold text-[var(--white)] transition-colors hover:bg-[var(--white)]/10"
              >
                {BRAND.phoneDisplay}
              </a>

              <a
                href={`mailto:${BRAND.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--white)]/25 px-4 py-2 text-xs font-semibold text-[var(--white)] transition-colors hover:bg-[var(--white)]/10"
              >
                Email us
              </a>
            </div>

            <address className="mt-6 text-xs not-italic leading-relaxed text-[var(--white)]/60">
              {BRAND.address.line1}, {BRAND.address.line2},{" "}
              {BRAND.address.cityState} {BRAND.address.pincode},{" "}
              {BRAND.address.country}
            </address>

            <div className="mt-4">
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