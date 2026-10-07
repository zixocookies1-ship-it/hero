import Image from "next/image";
import Link from "next/link";
import SocialLinks from "@/components/social-links";
import { loadBrand, loadCatalogue, loadSections } from "@/lib/cms";
import { POLICY_LINKS } from "@/lib/policies";

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

  const heading = "font-heading text-base font-semibold";

  return (
    <footer className="relative overflow-hidden bg-[var(--jaggery-brown)] text-[var(--white)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80rem_30rem_at_120%_-10%,rgba(200,121,69,0.28),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-[50%] bg-[var(--ginger-terracotta)]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.png?v=2"
                alt=""
                width={96}
                height={96}
                className="h-24 w-24 object-contain mix-blend-multiply"
              />
              <span className="font-heading text-lg font-bold">
                {brand.name}
              </span>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--white)]/80">
              {body}
            </p>

            <div className="mt-7">
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

          <nav aria-label="Products">
            <h2 className={heading}>Products</h2>
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
          </nav>

          <nav aria-label="Company">
            <h2 className={heading}>Company</h2>
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
          </nav>

          <nav aria-label="Policies">
            <h2 className={heading}>Policies</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--white)]/70">
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-[var(--ginger-terracotta)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-[var(--white)]/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs text-[var(--white)]/60">
            &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {POLICY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs text-[var(--white)]/60 transition-colors hover:text-[var(--white)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--white)]/60">{tagline}</p>
        </div>
      </div>
    </footer>
  );
}