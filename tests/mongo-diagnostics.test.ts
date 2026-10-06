/**
 * Tests for the safe MongoDB diagnostics used by the admin panel.
 *
 * These are deliberately offline: they exercise the classification and
 * redaction logic without touching a database, so they run in CI. The real round
 * trip is covered by the opt-in live test in orders-attach.test.ts.
 *
 * Run with: npx tsx --test tests/mongo-diagnostics.test.ts
 */
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  classifyMongoError,
  databaseEnvPresence,
  describeMongoUri,
  redactConnectionString,
} from "../src/lib/mongo-diagnostics";

const original = process.env.MONGODB_URI;
const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (original === undefined) delete process.env.MONGODB_URI;
  else process.env.MONGODB_URI = original;

  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
});

const SECRET = "hunter2";

test("redacts the username and password out of a mongodb+srv URL", () => {
  const redacted = redactConnectionString(
    `mongodb+srv://hero:${SECRET}@cluster0.example.mongodb.net/natures_choice?appName=Cluster0`
  );

  assert.ok(!redacted.includes(SECRET), "password must not survive redaction");
  assert.ok(!redacted.includes("hero:"), "username must not survive redaction");
  assert.ok(redacted.includes("mongodb+srv://***:***@cluster0.example.mongodb.net"));
  // The host and database name are kept: they are not credentials and they are
  // what identifies which cluster is misconfigured.
  assert.ok(redacted.includes("/natures_choice"));
});

test("redacts credentials even when embedded in a longer error message", () => {
  const redacted = redactConnectionString(
    `Invalid datasource: mongodb+srv://admin:${SECRET}@db.example.net/shop ` +
      `(password=${SECRET}&secret=abc123)`
  );

  assert.ok(!redacted.includes(SECRET), "password must not survive in a sentence");
  assert.ok(!redacted.includes("abc123"), "other secrets must not survive either");
});

test("reports an absent MONGODB_URI without throwing", () => {
  delete process.env.MONGODB_URI;
  const shape = describeMongoUri();

  assert.equal(shape.configured, false);
  assert.equal(shape.hasDatabaseName, false);
  assert.equal(shape.host, null);
  assert.equal(shape.databaseName, null);
});

test("flags a URI with no database name, which Prisma rejects", () => {
  // This is the exact shape that fails with "the datasource must have a database
  // name" - the URI ends at the host with only a query string after it.
  process.env.MONGODB_URI =
    `mongodb+srv://hero:${SECRET}@cluster0.example.mongodb.net/?appName=Cluster0`;

  const shape = describeMongoUri();

  assert.equal(shape.configured, true);
  assert.equal(shape.scheme, "mongodb+srv");
  assert.equal(shape.hasDatabaseName, false, "no database name in the path");
  assert.equal(shape.host, "cluster0.example.mongodb.net");
});

test("reads the database name out of a complete URI", () => {
  process.env.MONGODB_URI =
    `mongodb+srv://hero:${SECRET}@cluster0.example.mongodb.net/natures_choice?appName=Cluster0`;

  const shape = describeMongoUri();

  assert.equal(shape.hasDatabaseName, true);
  assert.equal(shape.databaseName, "natures_choice");
  assert.equal(shape.host, "cluster0.example.mongodb.net");
});

test("classifies a missing database name as a URI problem, not a missing variable", () => {
  const failure = classifyMongoError(
    new Error(
      "Invalid `prisma.order.count()` invocation: datasource `db` for mongodb must have a " +
        "database name in the URL (P1013)"
    )
  );

  assert.equal(failure.kind, "uri-missing-database-name");
  assert.match(failure.summary, /database name/i);
});

test("classifies the production failure where MONGODB_URI is absent from the runtime", () => {
  // Regression test for the live incident: this is the exact error the deployed
  // admin returned. Prisma failed while evaluating the datasource, so it never
  // reached the network, and the panel had to be able to say that precisely
  // rather than falling through to "unknown".
  const failure = classifyMongoError(
    Object.assign(
      new Error(
        "Invalid `prisma.order.count()` invocation:\n\n" +
          "error: Environment variable not found: MONGODB_URI.\n" +
          "  -->  schema.prisma:14\n" +
          "13 |   provider = \"mongodb\"\n" +
          "14 |   url      = env(\"MONGODB_URI\")\n\n" +
          "Validation Error Count: 1"
      ),
      { name: "PrismaClientInitializationError" }
    )
  );

  assert.equal(failure.kind, "uri-missing");
  assert.equal(failure.errorName, "PrismaClientInitializationError");
  assert.match(failure.summary, /Production environment/i);
  assert.match(failure.summary, /redeploy/i);
});

test("classifies a URI that is missing its mongodb scheme", () => {
  const failure = classifyMongoError(
    new Error("the URL must start with the protocol mongodb:// (P1011)")
  );

  assert.equal(failure.kind, "uri-malformed");
  assert.match(failure.summary, /mongodb:\/\//);
});

test("does not mistake an absent MONGODB_URI for a missing database name", () => {
  // Guards the rule order: the two look similar but need opposite advice.
  const failure = classifyMongoError(
    new Error("error: Environment variable not found: MONGODB_URI.")
  );

  assert.equal(failure.kind, "uri-missing");
});

test("reports which database variable names the runtime can see", () => {
  // The failure mode this exists for: a variable that is set but still under the
  // name the project used before it moved to MongoDB reads exactly like "never
  // configured" until you look at the name.
  delete process.env.MONGODB_URI;
  process.env.DATABASE_URL = `postgresql://user:${SECRET}@db.example.net/shop`;

  const presence = databaseEnvPresence();

  assert.equal(presence.MONGODB_URI, false);
  assert.equal(presence.DATABASE_URL, true);
  // Presence only: the value must never appear anywhere in the payload.
  assert.ok(
    !JSON.stringify(presence).includes(SECRET),
    "env presence must expose no values"
  );
});

test("classifies authentication failures", () => {
  const failure = classifyMongoError(
    Object.assign(new Error("Authentication failed."), { name: "MongoServerError" })
  );

  assert.equal(failure.kind, "authentication-failed");
  assert.match(failure.summary, /credentials/i);
});

test("classifies DNS and SRV resolution failures", () => {
  const failure = classifyMongoError(
    Object.assign(new Error("querySrv ENOTFOUND _mongodb._tcp.cluster0.example.net"), {
      code: "ENOTFOUND",
    })
  );

  assert.equal(failure.kind, "dns-srv-failed");
  assert.equal(failure.errorCode, "ENOTFOUND");
});

test("classifies TLS failures", () => {
  const failure = classifyMongoError(new Error("self-signed certificate in certificate chain"));

  assert.equal(failure.kind, "tls-failed");
});

test("classifies server selection timeouts", () => {
  const failure = classifyMongoError(
    Object.assign(new Error("Server selection timed out after 30000 ms"), {
      code: "P2024",
    })
  );

  assert.equal(failure.kind, "server-selection-timeout");
  assert.equal(failure.errorCode, "P2024");
});

test("classifies a build that shipped without a generated Prisma client", () => {
  const failure = classifyMongoError(
    new Error(
      "PrismaClient is unable to run in this browser environment, or the Prisma schema is " +
        "not generated."
    )
  );

  assert.equal(failure.kind, "client-not-generated");
  assert.match(failure.summary, /prisma generate/i);
});

test("never leaks the password out of a classified error", () => {
  const failure = classifyMongoError(
    new Error(
      `Invalid datasource "db": the URL mongodb+srv://hero:${SECRET}@cluster0.example.mongodb.net ` +
        `could not be parsed`
    )
  );

  assert.ok(!failure.message?.includes(SECRET), "message must be redacted");
  assert.ok(!failure.summary.includes(SECRET), "summary must be redacted");
});

test("keeps an unrecognised error visible instead of guessing", () => {
  const failure = classifyMongoError(new Error("something entirely unexpected happened"));

  assert.equal(failure.kind, "unknown");
  assert.equal(failure.message, "something entirely unexpected happened");
  assert.equal(failure.errorName, "Error");
});

test("handles a thrown non-Error value", () => {
  const failure = classifyMongoError("Server selection timed out");

  assert.equal(failure.kind, "server-selection-timeout");
});
