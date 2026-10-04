export default function Recipes() {
  return (
    <section className="py-16 bg-[var(--white)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
            Recipes / Ways to Enjoy
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[var(--dark-text)]">
            Delicious Possibilities
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-border-style rounded-2xl p-8 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[var(--jaggery-brown)] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[var(--white)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-2 5.586 3.093 3.237c.39.41.391.924.001 1.323l-2.328 1.552c-.39.41-1.019.41-1.411 0L3.073 15.35a1 1 0 0 1-1.41-.593l-1.324-1.767 3.094-3.237a1 1 0 0 1 0-1.324l3.305 1.655 1.608-3.237a1 1 0 0 1 .306-.306l1.766 1.324z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium">Traditional Tea Sweetener</p>
                <p className="text-xs text-[var(--dark-text)]/60">Add a spoon to your chai</p>
              </div>
            </div>
            <h3 className="text-xl font-serif text-[var(--dark-text)] mt-3">Chai Sweetener</h3>
            <p className="text-[var(--dark-text)]/70 text-base mt-2">Replace sugar with jaggery in your daily chai for a richer, more complex flavour.</p>
          </div>

          <div className="border border-border-style rounded-2xl p-8 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-[50%] bg-[var(--ginger-terracotta)] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[var(--white)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-4 14.06L10 16l4.05-3.56L10 14.06l-1.95-3.65L6 14.06l4.05 3.56z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium">Dessert Garnish</p>
                <p className="text-xs text-[var(--dark-text)]/60">Crust over sweets</p>
              </div>
            </div>
            <h3 className="text-xl font-serif text-[var(--dark-text)] mt-3">Dessert Garnish</h3>
            <p className="text-[var(--dark-text)]/70 text-base mt-2">Crush over ice cream, kheer, or fruit for a caramel-like finish.</p>
          </div>

          <div className="border border-border-style rounded-2xl p-8 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-square bg-[var(--natural-green)] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[var(--white)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10S17.52 2 12 2zm1 15h-2v-2h2v2zM12 6v6l5 5v-6c0-1.1-.9-2-2-2h-2v2h2c.55 0 1 .45 1 1v3h2V7h-2c-1.1 0-2 .9-2 2v3h2v-2.5zm-7.28 1.95l-1.77 2.18L5.34 17.65l1.77-2.18l2.26.7c.34.1.5.3.5.5v2h4v-2c0-.2-.1-.4-.5-.5l-2.26-.71.89-2.68L12 9.71l-1.06-3.33L7.84 5.08l-.89 2.68c-.34-.1-.5-.3-.5-.5v-2h4z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium">Smoothies & Bowls</p>
                <p className="text-xs text-[var(--dark-text)]/60">Blend into breakfast</p>
              </div>
            </div>
            <h3 className="text-xl font-serif text-[var(--dark-text)] mt-3">Smoothies & Bowls</h3>
            <p className="text-[var(--dark-text)]/70 text-base mt-2">Blend into smoothies, acai bowls, or oatmeal for natural sweetness.</p>
          </div>
        </div>
      </div>
    </section>
  );
}