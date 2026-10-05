"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { whatsappLink } from "@/lib/brand";

const links = [
  { href: "/", label: "HOME" },
  { href: "/about", label: "ABOUT" },
  { href: "/products", label: "PRODUCTS" },
  { href: "/contact", label: "CONTACT" },
];

function WhatsAppIcon() {
  return (
    <svg
      className="h-6 w-6 text-[#25D366]"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.896 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.886-9.885 9.886m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function CartIcon({ count }: { count: number }) {
  return (
    <span className="relative inline-flex items-center">
      <svg
        className="h-6 w-6 text-[var(--jaggery-brown)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h10"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ginger-terracotta)] text-[10px] font-semibold text-[var(--white)] shadow-sm">
          {count}
        </span>
      )}
      <span className="sr-only">
        Cart{count > 0 ? `, ${count} item${count === 1 ? "" : "s"}` : ", empty"}
      </span>
    </span>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-[var(--warm-cream)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Nature's Choice Jaggery home">
          <Image
            src="/images/logo.png"
            alt=""
            width={56}
            height={56}
            className="h-12 w-12 object-contain sm:h-14 sm:w-14"
            priority
          />
        </Link>

        <div className="hidden items-center gap-6 lg:gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium uppercase tracking-wide text-[var(--dark-text)] transition-colors hover:text-[var(--ginger-terracotta)]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={whatsappLink("Hi, I have a question about your jaggery.")}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:opacity-70"
            aria-label="Chat with us on WhatsApp"
          >
            <WhatsAppIcon />
          </a>
          <Link href="/cart" className="transition-colors hover:opacity-70">
            <CartIcon count={itemCount} />
          </Link>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <a
            href={whatsappLink("Hi, I have a question about your jaggery.")}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:opacity-70"
            aria-label="Chat with us on WhatsApp"
          >
            <WhatsAppIcon />
          </a>
          <Link href="/cart" className="transition-colors hover:opacity-70">
            <CartIcon count={itemCount} />
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--dark-text)] transition-colors hover:bg-black/5"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <span className="sr-only">Toggle main menu</span>
            {isOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          id="mobile-menu"
          className="border-t border-black/5 bg-[var(--warm-cream)] md:hidden"
        >
          <nav className="space-y-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-base font-medium uppercase tracking-wide text-[var(--dark-text)] transition-colors hover:bg-black/5"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-medium uppercase tracking-wide text-[var(--dark-text)] transition-colors hover:bg-black/5"
            >
              Cart ({itemCount})
            </Link>
          </nav>
        </div>
      )}
    </nav>
  );
}