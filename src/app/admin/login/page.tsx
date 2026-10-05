import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_COOKIE } from "@/lib/admin-auth";
import AdminLoginForm from "@/components/admin-login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const store = await cookies();
  const session = verifyAdminSession(store.get(ADMIN_COOKIE)?.value);
  if (session.ok) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--warm-cream)] px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
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