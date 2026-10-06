import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  },
};

export default nextConfig;
