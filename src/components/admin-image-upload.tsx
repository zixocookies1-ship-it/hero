"use client";

import { useRef, useState } from "react";

/**
 * Uploads one image to Cloudinary through the admin upload API and hands the
 * returned CDN URL back to the caller. Shared by the product and banner
 * editors, so every photo on this site is served from Cloudinary rather than
 * from a provider-specific bucket.
 */
export default function AdminImageUpload({
  folder,
  value,
  onChange,
  label = "Upload image (Cloudinary)",
}: {
  folder: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file is not an image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("The image is larger than 8 MB. Choose a smaller file.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("folder", folder);
      body.append("file", file);
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Upload failed.");
      }
      onChange(payload.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void upload(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[var(--dark-text)] transition-colors hover:border-[var(--ginger-terracotta)] hover:text-[var(--ginger-terracotta)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Uploading…" : label}
      </button>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin panel thumbs
        <img
          src={value}
          alt=""
          className="h-12 w-12 rounded-md border border-black/10 object-cover"
        />
      ) : null}
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </div>
  );
}