import type { MongoFailure } from "@/lib/mongo-diagnostics";

/**
 * Error panel shared by the admin screens that query MongoDB.
 *
 * A failed query must never render as an empty table: an unreachable database
 * and a genuinely empty collection look identical on screen otherwise, and an
 * admin reading zeros would conclude no orders exist when the truth is that the
 * question was never answered.
 */
export function AdminDbFailure({
  failure,
  title,
}: {
  failure: MongoFailure;
  title: string;
}) {
  return (
    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6">
      <p className="font-semibold text-red-800">{title}</p>
      <p className="mt-2 text-sm text-red-700">{failure.summary}</p>
      <dl className="mt-3 space-y-1 text-xs text-red-700">
        <div className="flex gap-2">
          <dt className="font-semibold">Reason</dt>
          <dd className="font-mono">{failure.kind}</dd>
        </div>
        {failure.errorName ? (
          <div className="flex gap-2">
            <dt className="font-semibold">Error</dt>
            <dd className="font-mono">{failure.errorName}</dd>
          </div>
        ) : null}
        {failure.errorCode ? (
          <div className="flex gap-2">
            <dt className="font-semibold">Code</dt>
            <dd className="font-mono">{failure.errorCode}</dd>
          </div>
        ) : null}
      </dl>
      {failure.message ? (
        <pre className="mt-3 overflow-x-auto rounded border border-red-200 bg-white/70 p-3 font-mono text-xs whitespace-pre-wrap text-red-900">
          {failure.message}
        </pre>
      ) : null}
      <p className="mt-3 text-sm text-red-700">
        Full diagnostics (host, database name, ping result, collections) are available at{" "}
        <code className="font-mono">/api/admin/db-health</code>. They never include the
        connection string or credentials.
      </p>
    </div>
  );
}
