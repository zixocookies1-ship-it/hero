"use client";

import { useState } from "react";
import { contactEnquiryMessage, whatsappLink } from "@/lib/brand";

type FieldName = "name" | "email" | "phone" | "subject" | "message";

type FieldErrors = Partial<Record<FieldName, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

const initialForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  website: "",
};

const validate = (form: typeof initialForm): FieldErrors => {
  const errors: FieldErrors = {};
  if (form.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) {
    errors.phone = "Please enter a valid phone number.";
  }
  if (form.subject.trim().length < 2) errors.subject = "Please add a subject.";
  if (form.message.trim().length < 10) {
    errors.message = "Please add a message of at least 10 characters.";
  }
  return errors;
};

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);

  const update = (field: keyof typeof initialForm) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    // Only the visible fields have errors; the honeypot has none to clear.
    if (field === "website") return;
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  // Validated here rather than server-side because the enquiry now leaves through
  // the customer's own WhatsApp link; nothing is posted to our API.
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Honeypot: hidden from real users, so a filled field means a bot.
    if (form.website.trim()) return;

    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setSent(false);
      return;
    }

    const message = contactEnquiryMessage({
      name: form.name,
      email: form.email,
      phone: form.phone,
      subject: form.subject,
      message: form.message,
    });

    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
    setSent(true);
  };

  const fieldClass = (field: FieldName) =>
    `w-full rounded-xl border bg-[var(--white)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--ginger-terracotta)] ${
      errors[field] ? "border-red-400" : "border-black/10"
    }`;

  const errorFor = (field: FieldName) =>
    errors[field] ? (
      <p id={`${field}-error`} role="alert" className="mt-1 text-xs text-red-600">
        {errors[field]}
      </p>
    ) : null;

  const labelClass = "mb-1.5 block text-sm font-medium text-[var(--dark-text)]";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-black/5 bg-[var(--white)] p-6 shadow-sm sm:p-8"
    >
      <h2 className="font-serif text-xl font-bold text-[var(--dark-text)]">
        Send us a message
      </h2>
      <p className="mt-2 text-sm text-[var(--dark-text)]/60">
        Send a message and continue in WhatsApp. We usually reply within one
        business day.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={form.name}
            onChange={update("name")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={fieldClass("name")}
          />
          {errorFor("name")}
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update("email")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={fieldClass("email")}
          />
          {errorFor("email")}
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone <span className="text-[var(--dark-text)]/40">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={update("phone")}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={fieldClass("phone")}
          />
          {errorFor("phone")}
        </div>

        <div>
          <label htmlFor="subject" className={labelClass}>
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            value={form.subject}
            onChange={update("subject")}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? "subject-error" : undefined}
            className={fieldClass("subject")}
          />
          {errorFor("subject")}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="message" className={labelClass}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          value={form.message}
          onChange={update("message")}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={fieldClass("message")}
        />
        {errorFor("message")}
      </div>

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={update("website")}
        />
      </div>

      {Object.keys(errors).length > 0 && (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Please check the highlighted fields.
        </p>
      )}

      {sent && (
        <p className="mt-5 rounded-xl bg-[var(--natural-green)]/10 px-4 py-3 text-sm text-[var(--natural-green)]">
          WhatsApp should have opened with your message ready to send. If it did
          not open, email us at{" "}
          <a
            href="mailto:support@natureschoicejaggery.com"
            className="underline underline-offset-4"
          >
            support@natureschoicejaggery.com
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        className="mt-6 w-full rounded-full bg-[var(--jaggery-brown)] px-6 py-3.5 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)]"
      >
        SEND ON WHATSAPP
      </button>
    </form>
  );
}