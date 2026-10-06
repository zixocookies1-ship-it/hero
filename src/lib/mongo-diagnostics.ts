/**
 * Safe MongoDB diagnostics.
 *
 * The admin panel used to print "Set MONGODB_URI and run npm run db:deploy" for
 * any failure at all, which is a guess, not a diagnosis: it fires for a missing
 * variable, a malformed one, bad credentials, a TLS or DNS problem, or a build
 * that shipped without a generated Prisma client. This module turns the real
 * error into something specific.
 *
 * Nothing here ever returns, logs or embeds the connection string, a username,
 * a password or any other credential. Only booleans, the host, the database
 * name, an error name/code and a redacted message are allowed out.
 */
import { databaseConfigured, optionalEnv } from "./env";

/** Broad buckets, so the admin UI can say what actually went wrong. */
export type MongoFailureKind =
  | "ok"
  | "uri-missing"
  | "uri-missing-database-name"
  | "uri-malformed"
  | "authentication-failed"
  | "dns-srv-failed"
  | "tls-failed"
  | "server-selection-timeout"
  | "client-not-generated"
  | "unknown";

export type MongoFailure = {
  kind: MongoFailureKind;
  /** One line an admin can act on. Never contains credentials. */
  summary: string;
  errorName: string | null;
  errorCode: string | null;
  /** Error text with any connection string and credentials redacted. */
  message: string | null;
};

/**
 * Redacts anything that could authenticate against the cluster.
 *
 * Prisma has been known to echo the datasource URL back in validation errors, so
 * the userinfo section of any mongo URL is replaced wholesale rather than trying
 * to guess where the password ends.
 */
export function redactConnectionString(input: string): string {
  return input
    .replace(/(mongodb(?:\+srv)?:\/\/)([^@\s/]+)@/gi, "$1***:***@")
    .replace(/\/\/[^@\s/]*:[^@\s]*@/g, "//***:***@")
    .replace(/((?:password|passwd|pwd|secret|key)\s*[=:]\s*)\S+/gi, "$1***");
}

/** Structural facts about the configured URI that are safe to display. */
export type MongoUriShape = {
  configured: boolean;
  scheme: string | null;
  host: string | null;
  databaseName: string | null;
  hasDatabaseName: boolean;
};

export function describeMongoUri(): MongoUriShape {
  const uri = optionalEnv("MONGODB_URI");

  if (!uri) {
    return {
      configured: false,
      scheme: null,
      host: null,
      databaseName: null,
      hasDatabaseName: false,
    };
  }

  // Parsed by hand rather than with `new URL`, which cannot handle `mongodb+srv`
  // and would throw on credentials we must not echo anyway.
  const schemeMatch = /^(mongodb(?:\+srv)?):\/\//i.exec(uri);
  const withoutScheme = schemeMatch ? uri.slice(schemeMatch[0].length) : uri;
  const authority = withoutScheme.split("/")[0] ?? "";
  const host = authority.includes("@") ? authority.slice(authority.lastIndexOf("@") + 1) : authority;

  const path = withoutScheme.includes("/") ? withoutScheme.slice(withoutScheme.indexOf("/") + 1) : "";
  const databaseName = path.split("?")[0]?.trim() || null;

  return {
    configured: true,
    scheme: schemeMatch ? schemeMatch[1].toLowerCase() : null,
    // Host is not a credential; it is what tells you which cluster is in play.
    host: host || null,
    databaseName,
    hasDatabaseName: Boolean(databaseName),
  };
}

const KIND_RULES: Array<{ kind: MongoFailureKind; test: RegExp; summary: string }> = [
  {
    kind: "client-not-generated",
    test: /PrismaClient is unable to run|Prisma schema is not generated|did not initialize yet|@prisma\/client.*not initialized|Cannot find module.*prisma/i,
    summary:
      "The Prisma client was not generated in this build, so no query can run. Make sure the " +
      "build command runs `prisma generate` before `next build`.",
  },
  {
    kind: "uri-missing-database-name",
    test: /database name|db name|P1013|must have a database|P1012|invalid.*connection string/i,
    summary:
      "MONGODB_URI has no database name in its path. It must look like " +
      "mongodb+srv://<user>:<password>@<host>/<database>?appName=... - a URI ending at " +
      "'/?appName=...' has nothing to connect to and Prisma rejects it.",
  },
  {
    kind: "authentication-failed",
    test: /auth(?:entication)? failed|AuthenticationFailed|P1000|P1002|P1003|invalid credentials|Authentication mechanism|command ping requires authentication|Unauthorized/i,
    summary:
      "MongoDB rejected the credentials. Check the username and password in MONGODB_URI, " +
      "and that the database user still exists with read/write access on this database.",
  },
  {
    kind: "dns-srv-failed",
    test: /ENOTFOUND|EAI_AGAIN|getaddrinfo|SrvRecord|SRV|querySrv|_mongodb._tcp/i,
    summary:
      "The DNS lookup for the mongodb+srv host failed. The hostname does not resolve, or " +
      "the SRV record cannot be read. Confirm the cluster hostname in MONGODB_URI is correct.",
  },
  {
    kind: "tls-failed",
    test: /TLS|certificate|CERT_|SSL|self.signed|selfsigned|SECURE/i,
    summary:
      "The TLS handshake failed. This is usually a certificate chain the runtime cannot " +
      "verify, rather than a credential problem.",
  },
  {
    kind: "server-selection-timeout",
    test: /server selection|ServerSelection|selection timeout|P2024|timed out|ETIMEDOUT|ECONNREFUSED|topology/i,
    summary:
      "The server could not be reached in time. Either nothing is listening on that host " +
      "or the network path is blocked.",
  },
];

/** Maps any thrown value to a specific, credential-free explanation. */
export function classifyMongoError(error: unknown): MongoFailure {
  const raw = error instanceof Error ? error : new Error(String(error));
  const code = "code" in raw && typeof (raw as { code?: unknown }).code === "string"
    ? (raw as { code: string }).code
    : null;
  const message = redactConnectionString(raw.message || "");
  const haystack = `${raw.name} ${code ?? ""} ${message}`;

  const rule = KIND_RULES.find((candidate) => candidate.test.test(haystack));
  const kind = rule?.kind ?? "unknown";

  return {
    kind,
    summary:
      rule?.summary ??
      "MongoDB could not be queried and the error did not match a known cause. The redacted " +
        "message below is the raw server response.",
    errorName: raw.name || null,
    errorCode: code,
    message,
  };
}

export type MongoHealth = {
  ok: boolean;
  /** What the server tried, safe to print. */
  attempted: boolean;
  uri: MongoUriShape;
  failure: MongoFailure | null;
  /** Only set when the ping succeeded. */
  serverVersion: string | null;
  databaseNameInUse: string | null;
  /** Collection names seen on the server, to confirm the app reads the right db. */
  collections: string[] | null;
  orderCount: number | null;
  durationMs: number;
};

/**
 * Performs a real round trip to the server and reports what happened.
 *
 * `ping` proves the cluster is reachable and the credentials are accepted;
 * `listCollections` proves which database the driver actually landed on, which is
 * what catches a URI pointing at the wrong database.
 */
export async function checkMongoHealth(timeoutMs = 10_000): Promise<MongoHealth> {
  const started = Date.now();
  const uri = describeMongoUri();
  const base = { uri, failure: null as MongoFailure | null, attempted: false };

  if (!databaseConfigured()) {
    return {
      ...base,
      ok: false,
      attempted: false,
      serverVersion: null,
      databaseNameInUse: null,
      collections: null,
      orderCount: null,
      durationMs: 0,
      failure: {
        kind: "uri-missing",
        summary:
          "MONGODB_URI is not present in the server runtime, so no query can be attempted.",
        errorName: null,
        errorCode: null,
        message: null,
      },
    };
  }

  if (!uri.hasDatabaseName) {
    return {
      ...base,
      ok: false,
      attempted: false,
      serverVersion: null,
      databaseNameInUse: null,
      collections: null,
      orderCount: null,
      durationMs: 0,
      failure: classifyMongoError(
        new Error("P1013: the datasource must have a database name in the connection URL")
      ),
    };
  }

  // Imported dynamically so a build that shipped without a generated client
  // reports that fact instead of failing to load this module at all.
  let prisma: typeof import("./db").prisma;
  try {
    ({ prisma } = await import("./db"));
  } catch (error) {
    return {
      ...base,
      ok: false,
      attempted: false,
      serverVersion: null,
      databaseNameInUse: null,
      collections: null,
      orderCount: null,
      durationMs: Date.now() - started,
      failure: classifyMongoError(error),
    };
  }

  try {
    const work = (async () => {
      const ping = (await prisma.$runCommandRaw({ ping: 1 })) as {
        ok?: number | string;
      } & Record<string, unknown>;
      const buildInfo = (await prisma.$runCommandRaw({ buildInfo: 1 })) as {
        version?: string;
      };
      const listed = (await prisma.$runCommandRaw({ listCollections: 1 })) as {
        cursor?: { firstBatch?: Array<{ name?: string }> };
      };
      const collections = (listed.cursor?.firstBatch ?? [])
        .map((entry) => entry.name)
        .filter((name): name is string => typeof name === "string")
        .sort();
      const orderCount = await prisma.order.count();

      return {
        pingOk: ping?.ok === 1 || ping?.ok === "1",
        serverVersion: typeof buildInfo?.version === "string" ? buildInfo.version : null,
        collections,
        orderCount,
      };
    })();

    const result = await Promise.race([
      work,
      new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error("ServerSelection: server selection timed out")), timeoutMs)
      ),
    ]);

    return {
      ok: true,
      attempted: true,
      uri,
      failure: null,
      serverVersion: result.serverVersion,
      databaseNameInUse: uri.databaseName,
      collections: result.collections,
      orderCount: result.orderCount,
      durationMs: Date.now() - started,
    };
  } catch (error) {
    const failure = classifyMongoError(error);
    // Safe, credential-free breadcrumb so production logs show the attempt and
    // its outcome without revealing the connection string.
    console.error("[mongo] connection attempt failed", {
      uriConfigured: uri.configured,
      host: uri.host,
      databaseName: uri.databaseName,
      kind: failure.kind,
      errorName: failure.errorName,
      errorCode: failure.errorCode,
    });
    return {
      ...base,
      ok: false,
      attempted: true,
      serverVersion: null,
      databaseNameInUse: null,
      collections: null,
      orderCount: null,
      durationMs: Date.now() - started,
      failure,
    };
  }
}

/** Convenience wrapper for pages that only need the reason, not the full report. */
export async function explainMongoFailure(): Promise<{
  configured: boolean;
  failure: MongoFailure | null;
}> {
  if (!databaseConfigured()) {
    return {
      configured: false,
      failure: {
        kind: "uri-missing",
        summary: "MONGODB_URI is not present in the server runtime.",
        errorName: null,
        errorCode: null,
        message: null,
      },
    };
  }

  try {
    const { prisma } = await import("./db");
    await prisma.order.count();
    return { configured: true, failure: null };
  } catch (error) {
    return { configured: true, failure: classifyMongoError(error) };
  }
}
