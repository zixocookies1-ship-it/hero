import Image from 'next/image';
import Link from 'next/link';

export default function ProductsPage() {
  return (
    <main className="pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[var(--dark-text)] mb-4">
            All Products
          </h1>
          <p className="text-[var(--dark-text)]/70">
            Premium Indian Jaggery - 3 authentic flavours
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-shadow">
            <Image
              src="/images/product1/01.jpeg"
              alt="Desi Chocolatey Jaggery"
              width={400}
              height={300}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <p className="text-[var(--ginger-terracotta)] text-xs font-medium uppercase mb-2">Desi Chocolatey Gud</p>
              <h2 className="text-lg font-serif font-bold text-[var(--dark-text)] mb-2">Desi Chocolatey Jaggery</h2>
              <p className="text-[var(--dark-text)]/70 text-sm mb-4">500g • Pack of 1</p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl font-bold text-[var(--jaggery-brown)]">₹239</span>
                <span className="text-sm line-through text-gray-500">₹299</span>
                <span className="text-xs bg-[var(--ginger-terracotta)] text-white px-2 py-1 rounded">20% OFF</span>
              </div>
              <Link href="/products/desi-chocolatey-jaggery" className="block w-full text-center bg-[var(--jaggery-brown)] text-white py-2 rounded-lg hover:opacity-90 transition-opacity">
                View Product
              </Link>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-shadow">
            <Image
              src="/images/product 2/01.jpeg"
              alt="Desi Elaichi Chocolatey Jaggery"
              width={400}
              height={300}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <p className="text-[var(--ginger-terracotta)] text-xs font-medium uppercase mb-2">Desi Elaichi &amp; Sonth Chocolatey Gud</p>
              <h2 className="text-lg font-serif font-bold text-[var(--dark-text)] mb-2">Desi Elaichi Chocolatey Jaggery</h2>
              <p className="text-[var(--dark-text)]/70 text-sm mb-4">500g • Pack of 1</p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl font-bold text-[var(--jaggery-brown)]">₹239</span>
                <span className="text-sm line-through text-gray-500">₹299</span>
                <span className="text-xs bg-[var(--ginger-terracotta)] text-white px-2 py-1 rounded">20% OFF</span>
              </div>
              <Link href="/products/desi-elaichi-chocolatey-jaggery" className="block w-full text-center bg-[var(--jaggery-brown)] text-white py-2 rounded-lg hover:opacity-90 transition-opacity">
                View Product
              </Link>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-shadow">
            <Image
              src="/images/product 3/01 (1).jpeg"
              alt="Desi Til Chocolatey Jaggery"
              width={400}
              height={300}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <p className="text-[var(--ginger-terracotta)] text-xs font-medium uppercase mb-2">Desi Til Chocolatey Gud</p>
              <h2 className="text-lg font-serif font-bold text-[var(--dark-text)] mb-2">Desi Til Chocolatey Jaggery</h2>
              <p className="text-[var(--dark-text)]/70 text-sm mb-4">500g • Pack of 1</p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl font-bold text-[var(--jaggery-brown)]">₹239</span>
                <span className="text-sm line-through text-gray-500">₹299</span>
                <span className="text-xs bg-[var(--ginger-terracotta)] text-white px-2 py-1 rounded">20% OFF</span>
              </div>
              <Link href="/products/desi-til-chocolatey-jaggery" className="block w-full text-center bg-[var(--jaggery-brown)] text-white py-2 rounded-lg hover:opacity-90 transition-opacity">
                View Product
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
