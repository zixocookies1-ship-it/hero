/**
 * Server-only environment access. Importing this from a client component throws
 * at runtime, which is the point: it stops a secret from reaching the browser.
 */

export class MissingEnvError extends Error {
  constructor(readonly names: string[]) {
    super(
      `Missing required server environment variable(s): ${names.join(", ")}. ` +
        `See .env.example.`
    );
    this.name = "MissingEnvError";
  }
}

const read = (name: string): string | undefined => {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

export function requireEnv(name: string): string {
  const value = read(name);
  if (!value) throw new MissingEnvError([name]);
  return value;
}

export function optionalEnv(name: string): string | undefined {
  return read(name);
}

export const hasEnv = (name: string): boolean => read(name) !== undefined;

/** True when enough is configured to actually take a payment. */
export const razorpayConfigured = (): boolean =>
  hasEnv("RAZORPAY_KEY_ID") && hasEnv("RAZORPAY_KEY_SECRET");

export const databaseConfigured = (): boolean => hasEnv("DATABASE_URL");

/** True when a signing key is available. Admin sessions and receipt links both
 *  need one; without it `signingSecret()` throws rather than falling open. */
export const signingConfigured = (): boolean =>
  hasEnv("ORDER_SIGNING_SECRET") || hasEnv("AUTH_SECRET") || hasEnv("RAZORPAY_KEY_SECRET");

/**
 * Secret used to sign admin sessions and order receipt links. Falls back to the
 * Razorpay secret so a missing value cannot silently weaken signing, but a
 * dedicated secret is strongly preferred.
 */
export function signingSecret(): string {
  return (
    optionalEnv("ORDER_SIGNING_SECRET") ??
    optionalEnv("AUTH_SECRET") ??
    requireEnv("RAZORPAY_KEY_SECRET")
  );
}