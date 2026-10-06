import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import { checkMongoHealth } from "@/lib/mongo-diagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side MongoDB health check for the admin panel.
 *
 * Performs a real `ping`, then `buildInfo` and `listCollections`, so the response
 * proves the cluster is reachable, the credentials are accepted and the driver
 * landed on the expected database. Without it, an unreachable database and an
 * empty one look identical from the admin UI.
 *
 * Requires a valid admin session. The payload is deliberately credential-free:
 * booleans, the host, the database name, an error name/code and a redacted
 * message. The connection string, username and password are never returned.
 */
export async function GET() {
  const store = await cookies();
  const session = verifyAdminSession(store.get(ADMIN_COOKIE)?.value);

  if (!session.ok) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const health = await checkMongoHealth();

  // `uri` is reduced to the safe shape by describeMongoUri(); nothing else in
  // this response contains anything derived from the raw connection string.
  return NextResponse.json(
    {
      ok: health.ok,
      attempted: health.attempted,
      uri: health.uri,
      failure: health.failure,
      serverVersion: health.serverVersion,
      databaseNameInUse: health.databaseNameInUse,
      collections: health.collections,
      orderCount: health.orderCount,
      durationMs: health.durationMs,
      runtime: {
        node: process.version,
        env: process.env.NODE_ENV,
        // Vercel surfaces these; they tell you which build answered.
        vercel: Boolean(process.env.VERCEL),
        region: process.env.VERCEL_REGION ?? null,
      },
    },
    { status: health.ok ? 200 : 503 }
  );
}
