import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import { asOptionalText, jsonBody } from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Updates one section of storefront copy. The storefront renders sections fresh
 * on every request, so a saved edit is live on the next page load.
 *
 * `items` and `links` are accepted as arrays only; their element shapes differ
 * per section (bullets, steps, FAQs, reviews), which is exactly why the column
 * is Json. Unknown keys in the body are ignored so the editor can never drag an
 * unrelated field in by accident.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const email = await requireAdminApi();
  if (!email) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const { key } = await params;

  const parsed = await jsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const data: Record<string, unknown> = {};

  const scalar = ["label", "eyebrow", "title", "titleAccent", "body", "body2", "image"] as const;
  for (const field of scalar) {
    if (body[field] === undefined) continue;
    const value = asOptionalText(body[field], field);
    if (!value.ok) return NextResponse.json({ error: value.message }, { status: 400 });
    data[field] = value.value ?? "";
  }

  if (body.items !== undefined) {
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: "items must be a list." }, { status: 400 });
    }
    data.items = body.items;
  }

  if (body.links !== undefined) {
    if (!Array.isArray(body.links)) {
      return NextResponse.json({ error: "links must be a list." }, { status: 400 });
    }
    data.links = body.links;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const existing = await prisma.section.findFirst({
      where: { key },
      select: { id: true },
    });

    if (existing) {
      const section = await prisma.section.update({
        where: { id: existing.id },
        data: data as Prisma.SectionUpdateInput,
        select: { id: true, key: true, updatedAt: true },
      });
      return NextResponse.json({ section });
    }

    const section = await prisma.section.create({
      data: {
        key,
        label: (data.label as string) ?? key,
        eyebrow: (data.eyebrow as string) ?? "",
        title: (data.title as string) ?? "",
        titleAccent: (data.titleAccent as string) ?? "",
        body: (data.body as string) ?? "",
        body2: (data.body2 as string) ?? "",
        image: (data.image as string) ?? "",
        items: (data.items ?? []) as Prisma.InputJsonValue,
        links: (data.links ?? []) as Prisma.InputJsonValue,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: { id: true, key: true, updatedAt: true },
    });
    return NextResponse.json({ section });
  } catch (error) {
    console.error("[mongo] admin update section failed", error);
    return NextResponse.json({ error: "The section could not be saved." }, { status: 500 });
  }
}