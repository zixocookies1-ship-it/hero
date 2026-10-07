"use client";

import { useRef, useState } from "react";

/**
 * Uploads one image to Cloudinary through the admin upload API and hands the
 * returned CDN URL back to the caller. Shared by the product and banner
 * editors, so every photo on this site is served from Cloudinary rather than
 * from a provider-specific bucket.
 *
 * Optional replace mode: pass `updateUrl` to overwrite an exact Cloudinary
 * asset in place (the URL keeps working, so gallery thumbnails and social
 * embeds never break), and `archivePublicId` plus `onPublicId` to also delete
 * the old asset when a replacement produced a new one.
 */
export default function AdminImageUpload({
  folder,
  value,
  onChange,
  label = "Upload image (Cloudinary)",
  updateUrl,
  archivePublicId,
  onPublicId,
}: {
  folder: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** Overwrite this exact Cloudinary asset instead of uploading a new one. */
  updateUrl?: string;
  /** Old asset to delete once a replacement succeeds (other than its own url). */
  archivePublicId?: string;
  /** Latest uploaded public id, so later deletes target the right asset. */
  onPublicId?: (publicId: string) => void;
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
      if (updateUrl) body.append("publicId", updateUrl);
      body.append("file", file);
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const payload = (await response.json().catch(() => ({}))) as {
        url?: string;
        publicId?: string;
        error?: string;
      };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Upload failed.");
      }
      onChange(payload.url);
      if (payload.publicId) onPublicId?.(payload.publicId);

      // Best effort: the new photo is already on the CDN and stored in the form,
      // so a delete that fails must not undo the upload. Only clear an asset we
      // are not currently using, and only when a replacement URL was requested.
      if (archivePublicId && payload.publicId && payload.publicId !== archivePublicId) {
        fetch(`/api/admin/uploads?publicId=${encodeURIComponent(archivePublicId)}`, {
          method: "DELETE",
        }).catch(() => undefined);
      }
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