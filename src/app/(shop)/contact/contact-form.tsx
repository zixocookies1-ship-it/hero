"use client";

import { useState } from "react";

type FieldName = "name" | "email" | "phone" | "subject" | "message";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; message: string; errors: Partial<Record<FieldName, string>> };

const initialForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  website: "",
};

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const update = (field: keyof typeof initialForm) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ state: "submitting" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setStatus({
          state: "error",
          message: data.message ?? "Something went wrong. Please try again.",
          errors: data.errors ?? {},
        });
        return;
      }

      setForm(initialForm);
      setStatus({ state: "success", message: data.message });
    } catch {
      setStatus({
        state: "error",
        message: "Network error. Please check your connection and try again.",
        errors: {},
      });
    }
  };

  const fieldClass = (field: FieldName) =>
    `w-full rounded-xl border bg-[var(--white)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--ginger-terracotta)] ${
      status.state === "error" && status.errors[field]
        ? "border-red-400"
        : "border-black/10"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-black/5 bg-[var(--white)] p-6 shadow-sm sm:p-8">
      <h2 className="font-serif text-xl font-bold text-[var(--dark-text)]">
        Send us a message
      </h2>
      <p className="mt-2 text-sm text-[var(--dark-text)]/60">
        We usually reply within one business day.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[var(--dark-text)]">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={update("name")}
            className={fieldClass("name")}
          />
          {status.state === "error" && status.errors.name && (
            <p className="mt-1 text-xs text-red-600">{status.errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--dark-text)]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
            className={fieldClass("email")}
          />
          {status.state === "error" && status.errors.email && (
            <p className="mt-1 text-xs text-red-600">{status.errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-[var(--dark-text)]">
            Phone <span className="text-[var(--dark-text)]/40">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={update("phone")}
            className={fieldClass("phone")}
          />
          {status.state === "error" && status.errors.phone && (
            <p className="mt-1 text-xs text-red-600">{status.errors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-[var(--dark-text)]">
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={form.subject}
            onChange={update("subject")}
            className={fieldClass("subject")}
          />
          {status.state === "error" && status.errors.subject && (
            <p className="mt-1 text-xs text-red-600">{status.errors.subject}</p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-[var(--dark-text)]">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={form.message}
          onChange={update("message")}
          className={fieldClass("message")}
        />
        {status.state === "error" && status.errors.message && (
          <p className="mt-1 text-xs text-red-600">{status.errors.message}</p>
        )}
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

      {status.state === "success" && (
        <p className="mt-5 rounded-xl bg-[var(--natural-green)]/10 px-4 py-3 text-sm text-[var(--natural-green)]">
          {status.message}
        </p>
      )}
      {status.state === "error" && (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={status.state === "submitting"}
        className="mt-6 w-full rounded-full bg-[var(--jaggery-brown)] px-6 py-3.5 text-sm font-semibold text-[var(--white)] transition-colors hover:bg-[var(--ginger-terracotta)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status.state === "submitting" ? "SENDING..." : "SEND MESSAGE"}
      </button>
    </form>
  );
}