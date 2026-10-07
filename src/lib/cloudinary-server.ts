import { v2 as cloudinary } from "cloudinary";
import { hasEnv, requireEnv } from "@/lib/env";

/**
 * Cloudinary — the only image host this store uses. Nothing but an image file
 * ever crosses this boundary, and all calls run server-side behind an admin
 * session, so the API secret never reaches the browser.
 *
 * Env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
 * Everything throws when those are missing rather than guessing, and callers
 * are expected to check `cloudinaryConfigured()` first and answer 503 when it
 * is false, so the admin screen can say exactly why an upload failed.
 */

export const cloudinaryConfigured = (): boolean =>
  hasEnv("CLOUDINARY_CLOUD_NAME") &&
  hasEnv("CLOUDINARY_API_KEY") &&
  hasEnv("CLOUDINARY_API_SECRET");

const cloudName = () => requireEnv("CLOUDINARY_CLOUD_NAME");

function instance(): typeof cloudinary {
  cloudinary.config({
    cloud_name: cloudName(),
    api_key: requireEnv("CLOUDINARY_API_KEY"),
    api_secret: requireEnv("CLOUDINARY_API_SECRET"),
    secure: true,
  });
  return cloudinary;
}

/**
 * Normalises a Cloudinary folder into an addressable path under the root
 * folder. Leading and trailing slashes go, and every segment is scanned for
 * safe characters, which Cloudinary accepts as letters, digits, hyphen,
 * underscore and spaces. `.`/`..` parent segments are dropped wholesale so a
 * folder name can never walk up the asset tree.
 */
export const sanitiseCloudinaryFolder = (folder: string): string =>
  folder
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter((segment) => segment !== "" && segment !== "." && segment !== "..")
    .map((segment) => segment.replace(/[^a-z0-9-_ ]/gi, ""))
    .filter(Boolean)
    .join("/");

const sanitisePublicId = (value: string): string | undefined => {
  // Public ids from this store are a folder path plus a hex id, e.g.
  // "products/desi-chocolatey-jaggery/abc123". Slashes are part of the address,
  // so they survive; everything else is scrubbed.
  const cleaned = value.replace(/[^a-zA-Z0-9_/-]/g, "").slice(0, 160);
  return cleaned || undefined;
};

export type UploadedImage = {
  url: string;
  publicId: string;
};

/**
 * Uploads one image to Cloudinary. `folder` lands under the root folder
 * declared in the call, e.g. "products/desi-chocolatey-jaggery" or "banners".
 * Returns the HTTPS CDN URL plus the public id, so a caller could later delete
 * the exact asset. Without a `publicId` Cloudinary generates a random id and the
 * two uploads never collide; with one, the later upload overwrites (which is how
 * re-uploading a product photo keeps the same url).
 */
export async function uploadImage(options: {
  buffer: Buffer;
  folder?: string;
  publicId?: string;
  contentType?: string;
}): Promise<UploadedImage> {
  // The SDK types the source as a string, so the bytes travel as a data URI.
  // The upload itself still happens between this server and Cloudinary — the
  // browser never sends the pixels anywhere but here.
  const dataUri = `data:${options.contentType ?? "image/jpeg"};base64,${options.buffer.toString("base64")}`;
  const result = await instance().uploader.upload(dataUri, {
    folder: options.folder ? sanitiseCloudinaryFolder(options.folder) : undefined,
    public_id: sanitisePublicId(options.publicId ?? ""),
    resource_type: "image",
    overwrite: Boolean(options.publicId?.trim()),
    type: "upload",
  });

  if (!result.secure_url || !result.public_id) {
    throw new Error("Cloudinary did not return a URL for the uploaded image.");
  }

  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Deletes one image asset from Cloudinary by its public id. Returns true when
 * the asset existed and was removed, false when it was already gone. Deleting a
 * pixel never touches the database row that used to reference it — callers
 * decide whether the reference should also go.
 */
export async function destroyImage(publicId: string): Promise<boolean> {
  const result = await instance().uploader.destroy(sanitisePublicId(publicId) ?? "");
  return result.result === "ok" || result.result === "not found";
}