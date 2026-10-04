export default function Contact() {
  return (
    <main className="pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-6">
              Get In Touch
            </p>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-[var(--dark-text)]">
              Let's Connect
            </h1>
            <p className="text-[var(--dark-text)]/80 text-base leading-relaxed mb-8">
              Have questions about our jaggery? Want to partner with us? Or just say hello? 
              We'd love to hear from you.
            </p>
            <div className="space-y-4 text-[var(--dark-text)]/80">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-[var(--ginger-terracotta)] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
                </svg>
                <span className="ml-4"> support@natureschoicejaggery.com</span>
              </div>
              <div className="flex items-start">
                <svg className="w-6 h-6 text-[var(--ginger-terracotta)] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
                </svg>
                <span className="ml-4">+91 98765 43210</span>
              </div>
              <div className="flex items-start">
                <svg className="w-6 h-6 text-[var(--ginger-terracotta)] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
                </svg>
                <span className="ml-4">123 Sugarcane Avenue, Mumbai - 400001, Maharashtra, India</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <iframe
              className="w-full h-[400px] rounded-2xl object-cover"
              src="https://www.google.com/maps/embed?pb=!4v1685793287219!6m8!1m7!1s0x3be0172e1e7e9b3d:0x1a5a9f4e6d5f4a3b!2m2!1d72.8776!2m2!1d19.076!3d19.076!4m5!3m2!1s0x3be0172e1e7e9b3d:0x1a5a9f4e6d5f4a3b!2m2!1d72.8776!2m2!1d19.076"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

