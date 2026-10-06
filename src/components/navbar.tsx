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
      <nav className="border-b border-black/5 bg-[var(--warm-cream)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Nature's Choice Jaggery home">
          <Image
              src="/images/logo.png?v=2"
            alt=""
            width={96}
            height={96}
              className="h-20 w-20 object-contain drop-shadow-[0_1px_6px_rgba(90,50,31,0.22)] sm:h-24 sm:w-24"
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