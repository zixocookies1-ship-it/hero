/**
 * Guards the admin login path. The important case: setting ADMIN_EMAIL and
 * ADMIN_PASSWORD without a signing key must not crash /admin/login - it used to,
 * because signingSecret() throws. These tests cover both configured and
 * unconfigured deployments.
 *
 * Run with: npx tsx --test tests/admin-auth.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, afterEach, test } from "node:test";

const ORIGINAL_ENV = { ...process.env };

const setEnv = (values: Record<string, string | undefined>) => {
  for (const key of [
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "ORDER_SIGNING_SECRET",
    "AUTH_SECRET",
    "RAZORPAY_KEY_SECRET",
  ]) {
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) process.env[key] = value;
  }
};

/** Imports the module fresh so it picks up the current process.env. */
const loadAuth = async () => {
  const bust = `${Date.now()}-${Math.random()}`;
  return import(`../src/lib/admin-auth.ts?bust=${bust}`);
};

const SECRET = "000000000000000000000000000000000000000000000000000000000000000f";

afterEach(() => setEnv({}));
after(() => {
  process.env = { ...ORIGINAL_ENV };
});

test("rejects a wrong password", async () => {
  setEnv({
    ADMIN_EMAIL: "admin@example.com",
    ADMIN_PASSWORD: "correct-horse-battery",
    ORDER_SIGNING_SECRET: SECRET,
  });
  const { checkAdminCredentials } = await loadAuth();

  assert.equal(
    checkAdminCredentials("admin@example.com", "correct-horse-battery"),
    true,
    "exact credentials should be accepted"
  );
  assert.equal(
    checkAdminCredentials("admin@example.com", "CORRECT-HORSE-BATTERY"),
    false,
    "password is case sensitive"
  );
  assert.equal(
    checkAdminCredentials("admin@example.com", "correct-horse-battery"),
    true,
    "email should be case insensitive"
  );
  assert.equal(
    checkAdminCredentials("someone@example.com", "correct-horse-battery"),
    false,
    "wrong email must fail"
  );
});

test("the email is trimmed before comparison", async () => {
  setEnv({
    ADMIN_EMAIL: "admin@example.com",
    ADMIN_PASSWORD: "correct-horse-battery",
    ORDER_SIGNING_SECRET: SECRET,
  });
  const { checkAdminCredentials } = await loadAuth();

  assert.equal(
    checkAdminCredentials("  admin@example.com  ", "correct-horse-battery"),
    true
  );
});

test("password is not trimmed, so a trailing space fails", async () => {
  setEnv({
    ADMIN_EMAIL: "admin@example.com",
    ADMIN_PASSWORD: "correct-horse-battery",
    ORDER_SIGNING_SECRET: SECRET,
  });
  const { checkAdminCredentials } = await loadAuth();

  assert.equal(
    checkAdminCredentials("admin@example.com", "correct-horse-battery "),
    false
  );
});

test("admin login is unusable without credentials", async () => {
  setEnv({ ORDER_SIGNING_SECRET: SECRET });
  const { adminIsConfigured, checkAdminCredentials } = await loadAuth();

  assert.equal(adminIsConfigured(), false);
  assert.equal(checkAdminCredentials("a@b.com", "anything"), false);
});

test("admin login is unusable without a signing key", async () => {
  // This is the regression: credentials alone used to throw a 500 on the login page.
  setEnv({ ADMIN_EMAIL: "admin@example.com", ADMIN_PASSWORD: "correct-horse-battery" });
  const { adminIsConfigured, verifyAdminSession, createAdminSession } = await loadAuth();

  assert.equal(adminIsConfigured(), false, "no signing key means no admin access");

  // Must not throw - it has to fail closed so the page can explain itself.
  assert.deepEqual(verifyAdminSession("anything"), { ok: false });
  assert.deepEqual(verifyAdminSession(undefined), { ok: false });
  assert.deepEqual(verifyAdminSession(""), { ok: false });

  // Issuing a session is a programming error when no key exists.
  assert.throws(() => createAdminSession("admin@example.com"));
});

test("a session survives a round trip and rejects tampering", async () => {
  setEnv({
    ADMIN_EMAIL: "admin@example.com",
    ADMIN_PASSWORD: "correct-horse-battery",
    ORDER_SIGNING_SECRET: SECRET,
  });
  const { createAdminSession, verifyAdminSession } = await loadAuth();

  const token = createAdminSession("admin@example.com");
  const verified = verifyAdminSession(token);

  assert.equal(verified.ok, true);
  assert.equal(verified.email, "admin@example.com");

  const [payload, signature] = token.split(".");
  assert.equal(verifyAdminSession(`${payload}.${signature.slice(0, -2)}xx`).ok, false);
  assert.equal(verifyAdminSession(`x.${signature}`).ok, false);
  assert.equal(verifyAdminSession("no-dot-at-all").ok, false);
});

test("an expired session is refused", async () => {
  setEnv({
    ADMIN_EMAIL: "admin@example.com",
    ADMIN_PASSWORD: "correct-horse-battery",
    ORDER_SIGNING_SECRET: SECRET,
  });
  const { createAdminSession, verifyAdminSession } = await loadAuth();

  // A negative TTL puts expiry in the past.
  const expired = createAdminSession("admin@example.com", -1000);

  assert.equal(verifyAdminSession(expired).ok, false);
});

test("a session issued under a different key is refused", async () => {
  setEnv({
    ADMIN_EMAIL: "admin@example.com",
    ADMIN_PASSWORD: "correct-horse-battery",
    ORDER_SIGNING_SECRET: SECRET,
  });
  const { createAdminSession } = await loadAuth();
  const token = createAdminSession("admin@example.com");

  // Rotating the secret must invalidate every existing session.
  process.env.ORDER_SIGNING_SECRET = "f".repeat(64);
  const { verifyAdminSession } = await loadAuth();

  assert.equal(verifyAdminSession(token).ok, false);
});

test("the local .env.example documents the required names", () => {
  const example = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf8");

  for (const name of ["ADMIN_EMAIL", "ADMIN_PASSWORD", "ORDER_SIGNING_SECRET"]) {
    assert.ok(example.includes(name), `.env.example should mention ${name}`);
  }

  // The example file must stay a template: names present, values blank.
  assert.ok(
    !/^\s*#?\s*ADMIN_PASSWORD=\S/m.test(example),
    "no real password may be committed to .env.example"
  );
  assert.ok(
    !/^\s*#?\s*ORDER_SIGNING_SECRET=\S/m.test(example),
    "no real signing secret may be committed to .env.example"
  );
});

// Credential leak detection lives in tests/no-secrets-committed.test.ts, which
// covers every secret in .env.local rather than just the admin password.