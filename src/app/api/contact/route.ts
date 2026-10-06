import { NextResponse } from "next/server";

type Payload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  subject?: unknown;
  message?: unknown;
  website?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

const normalise = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 }
    );
  }

  // Honeypot field: real users never see it, so treat any value as spam.
  if (normalise(body.website)) {
    return NextResponse.json({ ok: true });
  }

  const name = normalise(body.name);
  const email = normalise(body.email);
  const phone = normalise(body.phone);
  const subject = normalise(body.subject);
  const message = normalise(body.message);

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (!EMAIL_PATTERN.test(email)) errors.email = "Please enter a valid email address.";
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = "Please enter a valid phone number.";
  if (subject.length < 2) errors.subject = "Please add a subject.";
  if (message.length < 10) errors.message = "Please add a message of at least 10 characters.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { ok: false, message: "Please check the highlighted fields.", errors },
      { status: 422 }
    );
  }

  // The contact form hands off to WhatsApp (the store's only inbox), so this
  // legacy endpoint deliberately relays nothing anywhere. It validates and then
  // points back at WhatsApp rather than calling any external webhook.
  return NextResponse.json(
    {
      ok: false,
      message: "Message us on WhatsApp.",
      whatsapp: true,
    },
    { status: 503 }
  );
}