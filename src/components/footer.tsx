export default function Footer() {
  return (
    <footer className="py-16 bg-[var(--jaggery-brown)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-heading font-bold text-[var(--white)] mb-6">
              Nature's Choice Jaggery
            </h3>
            <p className="text-[var(--white)]/80 text-base leading-relaxed">
              Premium, naturally processed jaggery from the finest Indian sugarcane farms. 
              A modern twist on tradition, crafted for everyday enjoyment.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-serif font-bold text-[var(--white)] mb-5">
              Products
            </h4>
            <ul className="space-y-3 text-[var(--white)]/70 text-sm">
              <li className="hover:text-[var(--ginger-terracotta)] transition-colors">
                Desi Chocolatey Jaggery
              </li>
              <li className="hover:text-[var(--ginger-terracotta)] transition-colors">
                Desi Elaichi Jaggery
              </li>
              <li className="hover:text-[var(--ginger-terracotta)] transition-colors">
                Desi Til Jaggery
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-heading font-bold text-[var(--white)] mb-5 tracking-wide uppercase">
              Company
            </h4>
            <ul className="space-y-3 text-[var(--white)]/70 text-sm">
              <li className="hover:text-[var(--ginger-terracotta)] transition-colors">
                <a href="/">HOME</a>
              </li>
              <li className="hover:text-[var(--ginger-terracotta)] transition-colors">
                <a href="/about">ABOUT</a>
              </li>
              <li className="hover:text-[var(--ginger-terracotta)] transition-colors">
                <a href="/contact">CONTACT</a>
              </li>
              <li className="hover:text-[var(--ginger-terracotta)] transition-colors">
                <a href="/cart">CART</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-serif font-bold text-[var(--white)] mb-5">
              Connect
            </h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-[var(--white)]/70 hover:text-[var(--ginger-terracotta)] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-7h-2v-4h2v4zm0 5h-2v-6h2v6zM2 4h10v2H2V4zm0 6h6v2H2V10zm0 6h12v2H2v-2z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-[var(--white)]/70 hover:text-[var(--ginger-terracotta)] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.67 3.33A9 9 0 1 1 6.33 16.67 9 9 0 0 1 16.67 3.33zM12 8v4h4v2h-4v4c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2H8v4H6v-4H4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4v2h2v4h2v-4h4c.55 0 1 .45 1 1v2h2v-4zm3.17-1.5L15 5.35l1.42 1.42L18.17 8.5l1.42 1.42L15 11.65l-1.42 1.42L11.83 8.5l1.42-1.42L8.5 5.35L7 6.77l1.42 1.42L11.83 10.05z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-[var(--white)]/70 hover:text-[var(--ginger-terracotta)] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 7c0 4.44 4.46 8 10 8s10-3.56 10-8a4.48 4.48 0 0 0-1.86-7.87 10.95 10.95 0 0 1 1.53-3.14zM8.35 16.23a5.98 5.98 0 0 1-.77-1.74 4.3 4.3 0 0 0-4.19-2.03A5.96 5.96 0 0 1 2 12.26a5.98 5.98 0 0 1 1.61-5.05 3.51 3.51 0 0 0 1.06-.65c.39-.26.65-.5.65-.77 0-.27-.02-.55-.03-.83a4.48 4.48 0 0 0-1.05-2.05 4.54 4.54 0 0 0-2.06-1.06c-.27-.39-.5-.65-.77-.77a5.98 5.98 0 0 1-1.74-.77 5.96 5.96 0 0 1-5.05 1.61c-.65.99-.65 2.18 0 3.17a4.5 4.5 0 0 0 2.06 1.06 4.48 4.48 0 0 1 1.05 2.05c.27.39.5.65.77.77a5.98 5.98 0 0 1-1.61 5.05zM12 4.17a1.83 1.83 0 1 1 0 3.66 1.83 1.83 0 0 1 0-3.66zm6.78 1.83l-1.07 2.25a1.84 1.84 0 0 1-1.82.56h-1.52l-1.07-2.25a1.84 1.84 0 0 1 1.82-.56h1.52v2.5h-2.06v-2.5h1.66zm-11.56 0L9.22 6.03a1.84 1.84 0 0 1-1.82.56H5.5l-1.07 2.25a1.84 1.84 0 0 1-1.82.56H2.06v2.5h2.06v-2.5h-1.66z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-border-style border-white/10">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-[var(--white)]/70 text-sm">
            <p className="font-serif">
              © 2024 Nature's Choice Jaggery. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[var(--ginger-terracotta)] transition-colors">Terms</a>
              <a href="#" className="hover:text-[var(--ginger-terracotta)] transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}