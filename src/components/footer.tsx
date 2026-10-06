import Image from "next/image";
import Link from "next/link";
import SocialLinks from "@/components/social-links";
import { loadBrand, loadCatalogue, loadSections } from "@/lib/cms";

const FALLBACK_BODY =
  "Premium, naturally processed jaggery from sugarcane farms in Uttar Pradesh. Slow-cooked in pure clay pots over natural wood fire, with no preservatives and no chemicals.";
const FALLBACK_TAGLINE = "Made with care in Azamgarh, Uttar Pradesh, India.";
const FALLBACK_COMPANY_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Contact", href: "/contact" },
  { label: "Cart", href: "/cart" },
];

export default async function Footer() {
  const [brand, catalogue, sections] = await Promise.all([
    loadBrand(),
    loadCatalogue(),
    loadSections(),
  ]);

  const footer = sections.footer;
  const body = footer?.body || FALLBACK_BODY;
  const tagline = footer?.body2 || FALLBACK_TAGLINE;
  const companyLinks =
    footer && footer.links.length > 0 ? footer.links : FALLBACK_COMPANY_LINKS;

  return (
    <footer className="bg-[var(--jaggery-brown)] py-14 text-[var(--white)]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.png?v=2"
                alt={brand.name}
                width={96}
                height={96}
                className="h-24 w-24 object-contain drop-shadow-[0_0_2px_rgba(255,255,255,0.85),0_0_6px_rgba(255,255,255,0.4)]"
              />
              <span className="font-heading text-lg font-bold">
                {brand.name}
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--white)]/80">
              {body}
            </p>

            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--white)]/50">
                Visit us
              </p>
              <address className="mt-2 text-sm not-italic leading-relaxed text-[var(--white)]/80">
                {brand.address.line1}, {brand.address.line2},{" "}
                {brand.address.cityState} {brand.address.pincode},{" "}
                {brand.address.country}
              </address>
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
              {catalogue.map((product) => (
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
              {companyLinks.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-[var(--ginger-terracotta)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--white)]/10 pt-6 text-xs text-[var(--white)]/60 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <p>{tagline}</p>
        </div>
      </div>
    </footer>
  );
}
