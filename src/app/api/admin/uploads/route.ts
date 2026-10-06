import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { cloudinaryConfigured, uploadImage } from "@/lib/cloudinary-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Max upload size: Cloudinary image budgets and a sane HTTP body cap. */
const MAX_BYTES = 8 * 1024 * 1024;

/** Only the folders the store actually edits. Slugs are validated elsewhere. */
const ALLOWED_FOLDER_PATTERN = /^(products(?:-[a-z0-9-]+|\/\S*)?|banners)$/;

function allowedFolder(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const folder = value.trim().replace(/^\/+|\/+$/g, "");
  if (!folder || !ALLOWED_FOLDER_PATTERN.test(folder)) return null;
  if (folder.includes("..")) return null;
  return folder;
}

export async function POST(request: Request) {
  const email = await requireAdminApi();
  if (!email) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  if (!cloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form body." }, { status: 400 });
  }

  const folder = allowedFolder(form.get("folder"));
  if (!folder) {
    return NextResponse.json(
      { error: 'The folder must be "products" or "banners".' },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    return NextResponse.json({ error: "An image file is required." }, { status: 400 });
  }

  const blob = file as Blob & { name?: string };
  if (!blob.type.startsWith("image/")) {
    return NextResponse.json({ error: "The file must be an image." }, { status: 400 });
  }
  if (blob.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "The image is larger than 8 MB. Upload a smaller file." },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  const publicId = (blob.name ?? "").replace(/\.(jpe?g|png|webp)$/i, "");

  try {
    const uploaded = await uploadImage({ buffer, folder, publicId });
    return NextResponse.json(uploaded);
  } catch (error) {
    console.error("[cloudinary] upload failed", error);
    return NextResponse.json(
      { error: "The image could not be uploaded. Please try again." },
      { status: 502 }
    );
  }
}