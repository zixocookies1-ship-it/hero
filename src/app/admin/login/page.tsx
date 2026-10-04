export default function AdminLogin() {
  return (
    <main className='min-h-screen flex items-center justify-center bg-[var(--warm-cream)]'>
      <div className='w-full max-w-md bg-white rounded-2xl p-8 shadow-lg'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-serif font-bold text-[var(--jaggery-brown)]'>
            Nature's Choice Admin
          </h1>
          <p className='text-[var(--dark-text)]/70 mt-2'>Sign in to access admin panel</p>
        </div>
        <form className='space-y-6'>
          <div>
            <label className='block text-sm font-medium text-[var(--dark-text)] mb-2'>
              Email
            </label>
            <input
              type='email'
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--ginger-terracotta)] focus:border-transparent'
              placeholder='admin@natureschoice.com'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-[var(--dark-text)] mb-2'>
              Password
            </label>
            <input
              type='password'
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--ginger-terracotta)] focus:border-transparent'
              required
            />
          </div>
          <button
            type='submit'
            className='w-full bg-[var(--jaggery-brown)] text-white py-3 rounded-lg font-medium hover:bg-[var(--ginger-terracotta)] transition-colors'
          >
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}
