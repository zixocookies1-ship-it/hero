import Image from 'next/image';

export default function CartPage() {
  return (
    <main className="pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-[var(--warm-cream)] rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-serif font-bold text-[var(--dark-text)] mb-6">
            Your Cart
          </h2>
          <div className="space-y-4">
            {/* Cart Item */}
            <div className="flex items-center justify-between border-b border-border-style pb-4 last:border-0">
              <div className="flex items-center gap-4">
                <Image
                  src="/desi-chocolatey-jaggery-02.jpeg"
                  alt="Desi Chocolatey Jaggery"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded object-cover"
                />
                <div>
                  <p className="font-medium text-[var(--dark-text)]">Desi Chocolatey Jaggery</p>
                  <p className="text-sm text-[var(--dark-text)]/60">500g Ã— 1</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[var(--jaggery-brown)] font-medium">â‚¹199</p>
              </div>
            </div>

            {/* Cart Item 2 */}
            <div className="flex items-center justify-between border-b border-border-style pb-4 last:border-0">
              <div className="flex items-center gap-4">
                <Image
                  src="/desi-elaichi-chocolatey-jaggery-02.jpeg"
                  alt="Desi Elaichi Jaggery"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded object-cover"
                />
                <div>
                  <p className="font-medium text-[var(--dark-text)]">Desi Elaichi Jaggery</p>
                  <p className="text-sm text-[var(--dark-text)]/60">500g Ã— 1</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[var(--jaggery-brown)] font-medium">â‚¹219</p>
              </div>
            </div>

            {/* Cart Item 3 */}
            <div className="flex items-center justify-between border-b border-border-style pb-4 last:border-0">
              <div className="flex items-center gap-4">
                <Image
                  src="/desi-til-chocolatey-jaggery-02.jpeg"
                  alt="Desi Til Jaggery"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded object-cover"
                />
                <div>
                  <p className="font-medium text-[var(--dark-text)]">Desi Til Jaggery</p>
                  <p className="text-sm text-[var(--dark-text)]/60">500g Ã— 1</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[var(--jaggery-brown)] font-medium">â‚¹239</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border-style border-white/10">
            <div className="flex justify-between text-sm text-[var(--dark-text)]/80 mb-4">
              <span>Items</span>
              <span>3</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--dark-text)]/80">
              <span>Subtotal</span>
              <span>â‚¹657</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-[var(--dark-text)]">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between font-bold text-2xl text-[var(--jaggery-brown)]">
              <span>Total</span>
              <span>â‚¹657</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            className="w-full bg-[var(--jaggery-brown)] text-[var(--white)] px-8 py-4 rounded-full text-lg font-semibold transition-colors hover:bg-[var(--ginger-terracotta)]"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </main>
  );
}
