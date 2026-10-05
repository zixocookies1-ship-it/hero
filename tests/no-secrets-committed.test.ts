/**
 * Guards against committing real credentials.
 *
 * The expected secret values are read from the git-ignored .env.local at runtime
 * rather than hardcoded here, so this test can never itself become the leak it
 * looks for. If .env.local is absent (CI, a fresh clone) the value checks are
 * skipped, but the structural checks still run.
 *
 * Run with: npx tsx --test tests/no-secrets-committed.test.ts
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

/** Keys whose values must never appear in a committed file. Public values such
 *  as NEXT_PUBLIC_* and RAZORPAY_KEY_ID are deliberately excluded. Every key
 *  listed here must also be present in .env.example. */
const SECRET_KEYS = [
  "ADMIN_PASSWORD",
  "ORDER_SIGNING_SECRET",
  "AUTH_SECRET",
  "RAZORPAY_KEY_SECRET",
  "DELHIVERY_API_KEY",
  "DELHIVERY_CLIENT_ID",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_API_KEY",
  "META_CAPI_ACCESS_TOKEN",
  // The datasource is MongoDB, so MONGODB_URI is the connection string that must
  // never be committed. DATABASE_URL is gone from the app entirely.
  "MONGODB_URI",
];

const root = process.cwd();
const localEnvPath = path.join(root, ".env.local");
const hasLocalEnv = fs.existsSync(localEnvPath);

const readLocalEnv = (): Map<string, string> => {
  const values = new Map<string, string>();
  if (!hasLocalEnv) return values;

  for (const line of fs.readFileSync(localEnvPath, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match) continue;
    const value = match[2].trim();
    if (value) values.set(match[1], value);
  }
  return values;
};

/** Tracked files plus untracked-but-visible ones, i.e. everything git could
 *  actually commit. Asking git avoids walking .next and node_modules, whose
 *  combined output overflows execFileSync's buffer. */
const candidateFiles = (): string[] => {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }
  );

  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((file) => path.join(root, file.split("/").join(path.sep)));
};

test(".env files stay git-ignored", () => {
  const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");

  assert.ok(
    /\.env\*/.test(gitignore),
    ".gitignore must ignore .env* so local credentials cannot be staged"
  );
  assert.ok(
    /!\.env\.example/.test(gitignore),
    ".env.example must stay tracked, but only as a blank template"
  );
});

test("no secret from .env.local appears in any visible file", () => {
  if (!hasLocalEnv) return; // nothing to compare against

  const secrets = [...readLocalEnv()].filter(([key]) => SECRET_KEYS.includes(key));
  assert.ok(secrets.length > 0, "expected at least one secret in .env.local");

  const files = candidateFiles();
  const localRelative = ".env.local";
  const offenders: string[] = [];

  for (const file of files) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    if (relative === localRelative) continue;

    const contents = fs.readFileSync(file, "utf8");
    for (const [key, value] of secrets) {
      if (contents.includes(value)) offenders.push(`${key} in ${relative}`);
    }
  }

  assert.deepEqual(offenders, [], "these secrets must not be committed");
});

test("git history contains no current secret", () => {
  if (!hasLocalEnv) return;

  const secrets = [...readLocalEnv()].filter(([key]) => SECRET_KEYS.includes(key));

  for (const [key, value] of secrets) {
    const hits = execFileSync("git", ["log", "--all", "-S", value, "--oneline"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    }).trim();

    assert.equal(
      hits,
      "",
      `${key} appears in git history. Rotate it and rewrite history: ${hits}`
    );
  }
});

test(".env.example stays a blank template", () => {
  const example = fs.readFileSync(path.join(root, ".env.example"), "utf8");

  // Non-secret defaults such as SHIPPING_FEE_INR=49 are allowed to carry a
  // value; credentials must always ship blank.
  const MUST_BE_BLANK = [...SECRET_KEYS, "ADMIN_EMAIL", "RAZORPAY_KEY_ID"];

  for (const name of MUST_BE_BLANK) {
    assert.ok(example.includes(name), `.env.example should mention ${name}`);
  }

  for (const name of MUST_BE_BLANK) {
    const line = example
      .split(/\r?\n/)
      .find((candidate) => new RegExp(`^\\s*(?:#\\s*)?${name}=`).test(candidate));

    assert.ok(line, `.env.example should contain a line for ${name}`);
    const value = line.replace(/^\s*(?:#\s*)?/, "").split("=").slice(1).join("=").trim();
    assert.equal(value, "", `.env.example must leave ${name} blank, found "${value}"`);
  }
});

test("live Razorpay keys are not committed", () => {
  // A committed live key secret is the worst thing this test exists to prevent.
  const files = candidateFiles();

  for (const file of files) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    if (relative === ".env.local") continue;

    const contents = fs.readFileSync(file, "utf8");
    assert.ok(
      !/rzp_live_[A-Za-z0-9]+/.test(contents),
      `live Razorpay key id committed in ${relative}`
    );
    assert.ok(
      !/rzp_test_[A-Za-z0-9]{10,}/.test(contents),
      `Razorpay test key committed in ${relative}`
    );
  }
});

/** git grep exits 1 when there are no matches, which execFileSync treats as an
 *  error. Returns the matched file list, or "" when nothing matched. */
const gitGrepFiles = (pattern: string, paths: string[]): string[] => {
  const result = spawnSync("git", ["grep", "-l", pattern, "--", ...paths], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });

  if (result.error) throw result.error;
  return (result.stdout ?? "").split(/\r?\n/).filter(Boolean);
};

test("no duplicated Razorpay key id variable exists", () => {
  // The key id reaches the browser in the create-order response. A
  // NEXT_PUBLIC_RAZORPAY_KEY_ID copy would be a second source of truth that can
  // drift from RAZORPAY_KEY_ID and break checkout at payment time.
  for (const name of ["NEXT_PUBLIC_RAZORPAY_KEY_ID", "RAZORPAY_PUBLIC_KEY_ID"]) {
    assert.deepEqual(
      gitGrepFiles(name, ["src", "prisma"]),
      [],
      `${name} must not be referenced in application code`
    );
  }
});