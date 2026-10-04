"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = cart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-[var(--warm-cream)]/95 backdrop-blur-sm border-b border-gray-200/40 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between">
        <Link href="/" className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-[var(--jaggery-brown)] tracking-tight">
          Nature's Choice Jaggery
        </Link>
        
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          <Link
            href="/"
            className="text-[var(--dark-text)] hover:text-[var(--ginger-terracotta)] transition-colors text-sm font-medium tracking-wide uppercase"
          >
            HOME
          </Link>
          <Link
            href="/about"
            className="text-[var(--dark-text)] hover:text-[var(--ginger-terracotta)] transition-colors text-sm font-medium tracking-wide uppercase"
          >
            ABOUT
          </Link>
          <Link
            href="/products"
            className="text-[var(--dark-text)] hover:text-[var(--ginger-terracotta)] transition-colors text-sm font-medium tracking-wide uppercase"
          >
            PRODUCTS
          </Link>
          <Link
            href="/contact"
            className="text-[var(--dark-text)] hover:text-[var(--ginger-terracotta)] transition-colors text-sm font-medium tracking-wide uppercase"
          >
            CONTACT
          </Link>
          <Link href="/cart" className="relative inline-flex items-center text-[var(--dark-text)] hover:text-[var(--ginger-terracotta)] transition-colors">
            <svg
              className="h-6 w-6 text-[var(--jaggery-brown)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h10"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--ginger-terracotta)] text-[var(--white)] text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-3">
          <Link href="/cart" className="relative">
            <svg
              className="h-6 w-6 text-[var(--jaggery-brown)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h10"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--ginger-terracotta)] text-[var(--white)] text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[var(--jaggery-brown)] hover:bg-gray-100/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--jaggery-brown)]"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            {!isOpen ? (
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden border-t border-gray-200/40 bg-[var(--warm-cream)]/95 backdrop-blur-sm shadow-sm">
          <div className="px-4 py-3 space-y-1">
            <Link href="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-[var(--dark-text)] hover:text-[var(--ginger-terracotta)] uppercase tracking-wide">HOME</Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-[var(--dark-text)] hover:text-[var(--ginger-terracotta)] uppercase tracking-wide">ABOUT</Link>
            <Link href="/products" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-[var(--dark-text)] hover:text-[var(--ginger-terracotta)] uppercase tracking-wide">PRODUCTS</Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-[var(--dark-text)] hover:text-[var(--ginger-terracotta)] uppercase tracking-wide">CONTACT</Link>
            <Link href="/cart" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-[var(--dark-text)] hover:text-[var(--ginger-terracotta)] uppercase tracking-wide">CART</Link>
          </div>
        </div>
      )}
    </nav>
  );
}


