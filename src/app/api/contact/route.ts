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

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Enquiries are not configured yet. Please email us directly.",
      },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "natureschoicejaggery.com",
        name,
        email,
        phone,
        subject,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with ${response.status}`);
    }

    return NextResponse.json({
      ok: true,
      message: "Thanks. We have received your message and will get back to you.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "We could not send your message right now. Please email us directly.",
      },
      { status: 502 }
    );
  }
}