import { NextResponse } from "next/server";

/**
 * Shared bits for the admin write endpoints. Only an authenticated session may
 * write, and every money value arrives in whole rupees and is stored in paise
 * exactly like the rest of the catalogue.
 */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** True only for whole-object JSON input that is not null. */
export const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/** Reads a JSON request body. Returns {error} when it is not JSON. */
export async function jsonBody(request: Request): Promise<
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; response: NextResponse }
> {
  try {
    const body = await request.json();
    if (!isObject(body)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Expected a JSON object body." },
          { status: 400 }
        ),
      };
    }
    return { ok: true, body };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 }
      ),
    };
  }
}

export type FieldResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

/** Parses a whole-rupee amount into paise. `name` is only for the error text. */
export function rupeesToPaise(
  value: unknown,
  name: string,
  opts: { min?: number; max?: number } = {}
): FieldResult<number> {
  if (value === null || value === undefined || value === "") {
    return { ok: false, message: `${name} is required.` };
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return { ok: false, message: `${name} must be a whole number of rupees.` };
  }
  const min = opts.min ?? 0;
  const max = opts.max ?? Number.MAX_SAFE_INTEGER;
  if (parsed < min || parsed > max) {
    return {
      ok: false,
      message: `${name} must be between ${min} and ${max}.`,
    };
  }
  return { ok: true, value: parsed * 100 };
}

export function asInteger(
  value: unknown,
  name: string,
  opts: { min?: number; max?: number; required?: boolean } = {}
): FieldResult<number> {
  if (value === null || value === undefined || value === "") {
    if (opts.required === false) return { ok: true, value: 0 };
    return { ok: false, message: `${name} is required.` };
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return { ok: false, message: `${name} must be a whole number.` };
  }
  const min = opts.min ?? 0;
  const max = opts.max ?? Number.MAX_SAFE_INTEGER;
  if (parsed < min || parsed > max) {
    return { ok: false, message: `${name} must be between ${min} and ${max}.` };
  }
  return { ok: true, value: parsed };
}

export function asOptionalInteger(
  value: unknown,
  name: string,
  opts: { min?: number; max?: number } = {}
): FieldResult<number | null> {
  if (value === null || value === undefined || value === "") return { ok: true, value: null };
  return asInteger(value, name, opts);
}

/** Only lets a non-empty trimmed string through, or null when allowed. */
export function asOptionalText(value: unknown, name: string): FieldResult<string | null> {
  if (value === null || value === undefined) return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, message: `${name} must be text.` };
  return { ok: true, value: value.trim() };
}

export function asRequiredText(value: unknown, name: string): FieldResult<string> {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, message: `${name} is required.` };
  }
  return { ok: true, value: value.trim() };
}

export function asBoolean(value: unknown, name: string): FieldResult<boolean> {
  if (typeof value !== "boolean") {
    return { ok: false, message: `${name} must be true or false.` };
  }
  return { ok: true, value };
}

/** Maps a Prisma unique-violation onto a 409 response. */
export function uniqueViolation(error: unknown): boolean {
  const code =
    (error as { code?: string } | null)?.code ?? (error as { meta?: { code?: string } } | null)?.meta?.code;
  return code === "P2002" || code === "11000";
}