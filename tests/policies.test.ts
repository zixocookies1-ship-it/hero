/**
 * Structural cover for the policy scaffolding. The copy is intentionally
 * placeholder-safe (see src/lib/policies.ts), so these tests pin the
 * guarantees the rest of the site relies on: every promised route exists,
 * slugs are unique, and the shipping page's live-charge tokens are present.
 *
 * Run with: npx tsx --test tests/policies.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { POLICY_LINKS, POLICIES, POLICY_SLUGS } from "../src/lib/policies";

const EXPECTED_SLUGS = [
  "shipping-policy",
  "delivery-policy",
  "privacy-policy",
  "return-policy",
  "cancellation-policy",
  "terms-and-conditions",
];

test("exposes exactly the six promised policy slugs", () => {
  assert.deepEqual([...POLICY_SLUGS].sort(), [...EXPECTED_SLUGS].sort());
});

test("policy slugs are unique", () => {
  assert.equal(new Set(POLICY_SLUGS).size, POLICY_SLUGS.length);
});

test("every policy has usable copy and at least one section", () => {
  for (const policy of POLICIES) {
    assert.ok(policy.title, `${policy.slug} needs a title`);
    assert.ok(policy.intro, `${policy.slug} needs an intro`);
    assert.ok(policy.navTitle, `${policy.slug} needs a nav title`);
    assert.ok(policy.sections.length > 0, `${policy.slug} needs sections`);
    for (const section of policy.sections) {
      assert.ok(section.heading, `${policy.slug} has an empty section heading`);
      assert.ok(section.body.length > 0, `${policy.slug} has an empty section`);
    }
  }
});

test("footer links point at the policy routes", () => {
  assert.equal(POLICY_LINKS.length, POLICIES.length);
  for (const link of POLICY_LINKS) {
    assert.ok(link.href.startsWith("/policies/"), link.href);
    const slug = link.href.replace("/policies/", "");
    assert.ok(POLICY_SLUGS.includes(slug), `unknown slug ${slug}`);
  }
});

test("shipping charges come from the live-config token, not hard-coded copy", () => {
  const shipping = POLICIES.find((policy) => policy.slug === "shipping-policy");
  assert.ok(shipping, "shipping policy missing");
  const combined = [
    shipping.intro,
    ...shipping.sections.flatMap((section) => section.body),
  ].join(" ");
  assert.match(combined, /\{\{deliveryFee\}\}/);
  assert.match(combined, /\{\{freeAbove\}\}/);
  assert.doesNotMatch(
    combined,
    /₹/,
    "must not hard-code a fee figure; the live-config token is used instead"
  );
});

test("route file exists for the slug page and the index page", () => {
  const repoRoot = process.cwd();
  assert.ok(
    fs.existsSync(
      path.join(repoRoot, "src", "app", "(shop)", "policies", "[slug]", "page.tsx")
    ),
    "policies/[slug]/page.tsx missing"
  );
  assert.ok(
    fs.existsSync(path.join(repoRoot, "src", "app", "(shop)", "policies", "page.tsx")),
    "policies/page.tsx missing"
  );
});