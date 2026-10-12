import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/checkout",
          "/cart",
          "/order-success",
          "/api",
        ],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}