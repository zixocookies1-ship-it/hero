import Link from "next/link";

export default function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-sm border-b border-border-style"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
<Link href="/" className="font-serif text-2xl font-bold text-[var(--jaggery-brown)] tracking-tight">
          Nature's Choice
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-[var(--dark-text)] hover:text-[var(--ginger-terracotta)] transition-colors text-sm font-medium"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-[var(--dark-text)] hover:text-[var(--ginger-terracotta)] transition-colors text-sm font-medium"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-[var(--dark-text)] hover:text-[var(--ginger-terracotta)] transition-colors text-sm font-medium"
          >
            Contact
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <span
              className="absolute -top-1 -right-1 bg-[var(--ginger-terracotta)] text-[var(--white)] text-xs rounded-full w-5 h-5 flex items-center justify-center"
            >
              0
            </span>
          </Link>
          <button
            className="bg-[var(--ginger-terracotta)] text-[var(--white)] px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Menu
          </button>
        </div>
      </div>
    </nav>
  );
}


