/**
 * Guards against reintroducing the daily-reset sequence counter.
 *
 * Order.sequence carries a global unique index. The counter that allocates it
 * must never reset by date: a per-day key would hand out sequence 1 again on the
 * first checkout of a new day and collide with the previous day's order (P2002
 * "Order_sequence_key"), producing "We could not start your order. Please try
 * again." The test below inspects the implementation so this cannot slip back in.
 *
 * Run with: npx tsx --test tests/orders-counter.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const ORDERS_SOURCE = path.join(process.cwd(), "src/lib/orders.ts");

test("the order sequence counter is global (never reset by date)", () => {
  const source = fs.readFileSync(ORDERS_SOURCE, "utf8");

  // The counter key must not include the current date.
  assert.ok(
    !/order-\$\{/.test(source),
    "the sequence counter must not be keyed by the current date; use a single global counter id"
  );

  // The counter key must not embed a daily-derived suffix.
  assert.ok(
    !/query:\s*\{\s*_id:\s*`order-/.test(source),
    "the Counter query _id must not be built from a per-day date string"
  );

  // The implementation should name a constant global counter id.
  assert.ok(
    /ORDER_SEQUENCE_COUNTER\s*=\s*["'`]order-sequence["'`]/.test(source),
    "the global sequence counter id should be named ORDER_SEQUENCE_COUNTER = \"order-sequence\""
  );

  // The global counter must be the one being incremented.
  assert.ok(
    source.includes('query: { _id: ORDER_SEQUENCE_COUNTER }'),
    "nextOrderSequence must query the global ORDER_SEQUENCE_COUNTER"
  );
});

test("nextOrderSequence seeds above the current maximum before incrementing", () => {
  const source = fs.readFileSync(ORDERS_SOURCE, "utf8");

  // Self-healing: before incrementing, we must raise the counter to the highest
  // sequence already issued (using $max against the aggregate of max(sequence)).
  assert.ok(
    /order\.aggregate\(\s*\{\s*_max:\s*\{\s*sequence:\s*true\s*\}\s*\}\s*\)/.test(source),
    "nextOrderSequence must seed the counter using the current maximum sequence"
  );

  assert.ok(
    /update:\s*\{\s*\$max:\s*\{\s*value:\s*highest\._max\.sequence\s*\?\?/i.test(source),
    "nextOrderSequence must use $max to lift the counter above existing sequences"
  );
});
