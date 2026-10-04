import Image from 'next/image';

export default function ThreeFlavours() {
  return (
    <section className='py-16 bg-[var(--white)]'>
      <div className='max-w-7xl mx-auto px-6'>
        <div className='text-center mb-16'>
          <p className='text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-4'>
            Three Authentic Flavours
          </p>
          <h2 className='text-4xl md:text-5xl font-serif font-bold text-[var(--dark-text)]'>
            Discover Your favourite
          </h2>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <div className='group hover:translate-y-[-10px] transition-transform duration-300 border border-border-style rounded-2xl overflow-hidden bg-[var(--warm-cream)]'>
            <Image
              src='/desi-chocolatey-jaggery-01.jpeg'
              alt='Desi chocolatey jaggery'
              width={400}
              height={300}
              className='w-full h-48 object-cover'
            />
            <div className='p-6'>
              <p className='text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-3'>
                Desi Chocolatey
              </p>
              <h3 className='text-xl font-serif text-[var(--dark-text)] group-hover:text-[var(--ginger-terracotta)] transition-colors'>
                Classic Deep Brown
              </h3>
              <p className='text-[var(--dark-text)]/70 text-base mt-2'>
                Rich, traditional flavour with notes of caramel and molasses.
              </p>
            </div>
          </div>
          <div className='group hover:translate-y-[-10px] transition-transform duration-300 border border-border-style rounded-2xl overflow-hidden bg-[var(--warm-cream)]'>
            <Image
              src='/desi-elaichi-chocolatey-jaggery-01.jpeg'
              alt='Desi elaichi jaggery'
              width={400}
              height={300}
              className='w-full h-48 object-cover'
            />
            <div className='p-6'>
              <p className='text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-3'>
                Desi Elaichi
              </p>
              <h3 className='text-xl font-serif text-[var(--dark-text)] group-hover:text-[var(--ginger-terracotta)] transition-colors'>
                Cardamom Infused
              </h3>
              <p className='text-[var(--dark-text)]/70 text-base mt-2'>
                Aromatic cardamom blended with pure jaggery for a refreshing twist.
              </p>
            </div>
          </div>
          <div className='group hover:translate-y-[-10px] transition-transform duration-300 border border-border-style rounded-2xl overflow-hidden bg-[var(--warm-cream)]'>
            <Image
              src='/desi-til-chocolatey-jaggery-01.jpeg'
              alt='Desi til jaggery'
              width={400}
              height={300}
              className='w-full h-48 object-cover'
            />
            <div className='p-6'>
              <p className='text-[var(--ginger-terracotta)] text-sm font-medium tracking-widest uppercase mb-3'>
                Desi Til
              </p>
              <h3 className='text-xl font-serif text-[var(--dark-text)] group-hover:text-[var(--ginger-terracotta)] transition-colors'>
                Nutty Sesame
              </h3>
              <p className='text-[var(--dark-text)]/70 text-base mt-2'>
                Enriched with premium sesame seeds for a nutty, wholesome taste.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
