"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={busy}
      className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
    >
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}