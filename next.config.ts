import path from "node:path";
import type { NextConfig } from "next";

/**
 * Self-hosting on GoDaddy (shared Node.js).
 *
 * With `output: "standalone"` `next build` emits a self-contained server under
 * `.next/standalone` that boots with `node server.js` and needs neither
 * `node_modules` nor a rebuild on the host. Without it the host compiles pages
 * on demand with Turbopack and has to write into `.next`, which fails with
 * "Permission denied" / "endpoint_write_to_disk failed" on shared filesystems.
 *
 * It is opt-in via NEXT_OUTPUT so the existing Vercel deployment keeps its
 * normal output — Vercel does its own tracing and should not be given a
 * standalone folder. Build for GoDaddy with:
 *     NEXT_OUTPUT=standalone npm run build
 *
 * `output: "export"` is deliberately NOT used: 25 route handlers (Razorpay,
 * Prisma/MongoDB, admin sessions) plus the dynamic storefront pages require a
 * real Node server, and a static export would drop cart, checkout, payments,
 * the admin panel and every API route.
 */
const output =
  process.env.NEXT_OUTPUT === "standalone"
    ? ("standalone" as const)
    : undefined;

const nextConfig: NextConfig = {
  output,
  turbopack: {
    root: path.resolve("."),
  },
  images: {
    // Every image this site serves lives under /images/ and carries no query
    // string, so that is the default rule.
    localPatterns: [
      { pathname: "/images/**", search: "" },
      // The logo is the single exception: ?v=2 forces the optimizer to re-read it
      // after its baked-in white background was removed. Matching the exact search
      // value rather than omitting it keeps other query strings on this path
      // blocked, which is what stops path enumeration.
      { pathname: "/images/logo.png", search: "?v=2" },
    ],
    // Admin-uploaded product and banner photos live on Cloudinary. Without this
    // rule next/image refuses those srcs (E231) and the page that renders them
    // fails, so every store photo the admin uploads must be servable here.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
