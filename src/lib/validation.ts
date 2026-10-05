import { INDIAN_STATES, STATE_PLACEHOLDER } from "@/lib/states";

/** Exactly 10 digits, first digit 6-9. Anchored, so no spaces or stray characters. */
export const MOBILE_PATTERN = /^[6-9][0-9]{9}$/;

/** Exactly 6 digits, first digit 1-9. */
export const PIN_PATTERN = /^[1-9][0-9]{5}$/;

/**
 * Only everyday formatting is tolerated: digits, spaces, dashes, brackets and a
 * leading plus. Anything else (letters, symbols) is a hard reject rather than
 * being silently stripped, so "9876543210abc" never becomes 9876543210.
 */
const ALLOWED_MOBILE_CHARS = /^[0-9+\-\s()]+$/;
const ALLOWED_PIN_CHARS = /^[0-9\s-]+$/;

export type CheckoutDetails = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
};

export type CheckoutField = keyof CheckoutDetails;

export type FieldErrors = Partial<Record<CheckoutField, string>>;

const MAX = {
  fullName: 80,
  phone: 10,
  email: 120,
  address: 400,
  city: 60,
  state: 60,
  postalCode: 6,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Normalises a possibly messy input into a bare 10-digit string.
 * Strips spaces, dashes and a leading +91 / 0 country or trunk prefix so that
 * "+91 98765 43210" and "09876543210" are both accepted, while letters and
 * wrong-length values are still rejected.
 */
export const normaliseMobile = (input: string): string => {
  let digits = input.replace(/[^0-9]/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
};

export const normalisePin = (input: string): string => input.replace(/[^0-9]/g, "");

const clean = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/**
 * Validates the six mandatory checkout fields, plus email when one was entered.
 * Returns a field-keyed error map that is empty when the payload is valid.
 * The same function runs in the browser and on the server, so the browser can
 * never be the only thing enforcing these rules.
 */
export function validateCheckoutDetails(input: Partial<CheckoutDetails>): FieldErrors {
  const errors: FieldErrors = {};

  const fullName = clean(input.fullName);
  if (!fullName) errors.fullName = "Full name is required.";
  else if (fullName.length < 2) errors.fullName = "Full name is required.";
  else if (fullName.length > MAX.fullName) errors.fullName = "Full name is too long.";

  const phoneRaw = clean(input.phone);
  const phone = normaliseMobile(phoneRaw);
  if (!phoneRaw) errors.phone = "Mobile number is required.";
  else if (!ALLOWED_MOBILE_CHARS.test(phoneRaw) || !MOBILE_PATTERN.test(phone)) {
    errors.phone = "Please enter a valid 10-digit mobile number.";
  }

  const email = clean(input.email);
  if (email && !EMAIL_PATTERN.test(email)) errors.email = "Please enter a valid email address.";

  const address = clean(input.address);
  if (!address) errors.address = "Address is required.";
  else if (address.length < 10) errors.address = "Address is required.";
  else if (address.length > MAX.address) errors.address = "Address is too long.";

  const pinRaw = clean(input.postalCode);
  const postalCode = normalisePin(pinRaw);
  if (!pinRaw) errors.postalCode = "PIN code is required.";
  else if (!ALLOWED_PIN_CHARS.test(pinRaw) || !PIN_PATTERN.test(postalCode)) {
    errors.postalCode = "Please enter a valid 6-digit PIN code.";
  }

  const city = clean(input.city);
  if (!city) errors.city = "City is required.";
  else if (city.length > MAX.city) errors.city = "City name is too long.";

  const state = clean(input.state);
  if (!state || state === STATE_PLACEHOLDER) errors.state = "Please select your state.";
  else if (!(INDIAN_STATES as readonly string[]).includes(state)) errors.state = "Please select your state.";

  return errors;
}

/** Normalised, trimmed values ready to persist. */
export function normaliseCheckoutDetails(input: Partial<CheckoutDetails>): CheckoutDetails {
  const email = clean(input.email);
  return {
    fullName: clean(input.fullName),
    phone: normaliseMobile(clean(input.phone)),
    email: email ? email : "",
    address: clean(input.address),
    city: clean(input.city),
    state: clean(input.state),
    postalCode: normalisePin(clean(input.postalCode)),
  };
}

/** Returns the first field in DOM order that failed, so the UI can focus it. */
export const firstInvalidField = (errors: FieldErrors): CheckoutField | null => {
  const order: CheckoutField[] = [
    "fullName",
    "phone",
    "address",
    "postalCode",
    "city",
    "state",
    "email",
  ];
  return order.find((field) => errors[field]) ?? null;
};

export const hasErrors = (errors: FieldErrors): boolean => Object.keys(errors).length > 0;