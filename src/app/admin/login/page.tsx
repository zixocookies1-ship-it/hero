import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import { verifyAdminSession, ADMIN_COOKIE, adminIsConfigured } from "@/lib/admin-auth";
import AdminLoginForm from "@/components/admin-login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const store = await cookies();
  const session = verifyAdminSession(store.get(ADMIN_COOKIE)?.value);
  if (session.ok) redirect("/admin");

  if (!adminIsConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--warm-cream)] px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">
            Admin access is not configured
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--dark-text)]/70">
            This deployment is missing the environment variables needed to sign in.
            Set <code className="font-mono text-xs">ADMIN_EMAIL</code>,{" "}
            <code className="font-mono text-xs">ADMIN_PASSWORD</code> and{" "}
            <code className="font-mono text-xs">ORDER_SIGNING_SECRET</code>, then
            redeploy. See README_SETUP.md.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--warm-cream)] px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <Image
          src="/images/logo.png?v=2"
          alt="Nature's Choice Jaggery"
          width={253}
          height={203}
          priority
          className="mx-auto mb-6 h-20 w-auto"
        />
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold text-[var(--jaggery-brown)]">
            Nature&apos;s Choice Admin
          </h1>
          <p className="mt-2 text-[var(--dark-text)]/70">Sign in to access admin panel</p>
        </div>

        <AdminLoginForm />
      </div>
    </main>
  );
}