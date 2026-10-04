export default function CheckoutPage() {
  return (
    <main className="pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-[var(--warm-cream)] rounded-2xl p-8">
          <h2 className="text-3xl font-serif font-bold text-[var(--dark-text)] mb-6">
            Checkout
          </h2>
          <p className="text-[var(--dark-text)]/80 text-base mb-8">
            Please fill in your details to complete the order.
          </p>
          <form className="space-y-6">
            <div>
              <p className="text-[var(--ginger-terracotta)] font-medium mb-2">Full Name</p>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-full bg-white border border-border-style focus:outline-none focus:ring-2 focus:ring-[var(--ginger-terracotta)]"
                required
              />
            </div>
            <div>
              <p className="text-[var(--ginger-terracotta)] font-medium mb-2">Email</p>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-full bg-white border border-border-style focus:outline-none focus:ring-2 focus:ring-[var(--ginger-terracotta)]"
                required
              />
            </div>
            <div>
              <p className="text-[var(--ginger-terracotta)] font-medium mb-2">Phone</p>
              <input
                type="tel"
                className="w-full px-4 py-3 rounded-full bg-white border border-border-style focus:outline-none focus:ring-2 focus:ring-[var(--ginger-terracotta)]"
                required
              />
            </div>
            <div>
              <p className="text-[var(--ginger-terracotta)] font-medium mb-2">Address</p>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-full bg-white border border-border-style focus:outline-none focus:ring-2 focus:ring-[var(--ginger-terracotta)]"
                required
              />
            </div>
            <div>
              <p className="text-[var(--ginger-terracotta)] font-medium mb-2">Pin Code</p>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-full bg-white border border-border-style focus:outline-none focus:ring-2 focus:ring-[var(--ginger-terracotta)]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[var(--jaggery-brown)] text-[var(--white)] px-8 py-4 rounded-full text-lg font-semibold transition-colors hover:bg-[var(--ginger-terracotta)]"
            >
              Place Order
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}