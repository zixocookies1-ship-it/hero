import Image from 'next/image';

export default function Reviews() {
  return (
    <section className="py-16 bg-[var(--jaggery-brown)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4">
            Customer Reviews
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[var(--white)]">
            Loved by Our Community
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-border-style rounded-2xl p-8 bg-white">
            <div className="flex mb-4">
              <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-2 5.586 3.093 3.237c.39.41.391.924.001 1.323l-2.328 1.552c-.39.41-1.019.41-1.411 0L3.073 15.35a1 1 0 0 1-1.41-.593l-1.324-1.767 3.094-3.237a1 1 0 0 1 0-1.324l3.305 1.655 1.608-3.237a1 1 0 0 1 .306-.306l1.766 1.324z" />
              </svg>
              <span className="mx-2">4.9</span>
            </div>
            <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-4">
              "Finally, a jaggery that tastes authentic without any aftertaste. The quality is exceptional!"
            </p>
            <div className="flex justify-between">
              <div className="flex items-center">
                <Image
                  src="/desi-chocolatey-jaggery-01.jpeg"
                  alt="Customer 1"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />
                <div>
                  <p className="font-medium">Priya M.</p>
                  <p className="text-xs text-[var(--dark-text)]/60">Verified Buyer</p>
                </div>
              </div>
              <p className="text-xs text-[var(--dark-text)]/60">2 weeks ago</p>
            </div>
          </div>

          <div className="border border-border-style rounded-2xl p-8 bg-white">
            <div className="flex mb-4">
              <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-2 5.586 3.093 3.237c.39.41.391.924.001 1.323l-2.328 1.552c-.39.41-1.019.41-1.411 0L3.073 15.35a1 1 0 0 1-1.41-.593l-1.324-1.767 3.094-3.237a1 1 0 0 1 0-1.324l3.305 1.655 1.608-3.237a1 1 0 0 1 .306-.306l1.766 1.324z" />
              </svg>
              <span className="mx-2">4.9</span>
            </div>
            <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-4">
              "The elaichi variant is amazing - perfect blend of cardamom and sweetness. My morning chai never tasted better!"
            </p>
            <div className="flex justify-between">
              <div className="flex items-center">
                <Image
                  src="/desi-elaichi-chocolatey-jaggery-01.jpeg"
                  alt="Customer 2"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />
                <div>
                  <p className="font-medium">Ankita S.</p>
                  <p className="text-xs text-[var(--dark-text)]/60">Verified Buyer</p>
                </div>
              </div>
              <p className="text-xs text-[var(--dark-text)]/60">1 month ago</p>
            </div>
          </div>

          <div className="border border-border-style rounded-2xl p-8 bg-white">
            <div className="flex mb-4">
              <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-2 5.586 3.093 3.237c.39.41.391.924.001 1.323l-2.328 1.552c-.39.41-1.019.41-1.411 0L3.073 15.35a1 1 0 0 1-1.41-.593l-1.324-1.767 3.094-3.237a1 1 0 0 1 0-1.324l3.305 1.655 1.608-3.237a1 1 0 0 1 .306-.306l1.766 1.324z" />
              </svg>
              <span className="mx-2">4.9</span>
            </div>
            <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-4">
              "The til jaggery with sesame is my favorite - nutritious and delicious. Perfect for winter!"
            </p>
            <div className="flex justify-between">
              <div className="flex items-center">
                <Image
                  src="/desi-til-chocolatey-jaggery-01.jpeg"
                  alt="Customer 3"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />
                <div>
                  <p className="font-medium">Rahul K.</p>
                  <p className="text-xs text-[var(--dark-text)]/60">Verified Buyer</p>
                </div>
              </div>
              <p className="text-xs text-[var(--dark-text)]/60">3 weeks ago</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
