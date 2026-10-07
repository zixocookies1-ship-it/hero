"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/cart-context";
import AnnouncementBar from "@/components/announcement-bar";

const links = [
  { href: "/", label: "HOME" },
  { href: "/about", label: "ABOUT" },
  { href: "/products", label: "PRODUCTS" },
  { href: "/contact", label: "CONTACT" },
];

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
          strokeWidth={1.8}
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
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

export default function Navbar({
  announcements = [],
}: {
  announcements?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <AnnouncementBar messages={announcements} />
      <nav className="border-b border-black/5 bg-[var(--warm-cream)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Nature's Choice Jaggery home">
          <Image
              src="/images/logo.png?v=2"
            alt=""
            width={96}
            height={96}
              className="h-20 w-20 object-contain mix-blend-multiply sm:h-24 sm:w-24"
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
          <Link href="/cart" className="transition-colors hover:opacity-70">
            <CartIcon count={itemCount} />
          </Link>
        </div>

        <div className="flex items-center gap-3 md:hidden">
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
    </header>
  );
}