import type { MetadataRoute } from "next";
import { loadCatalogue } from "@/lib/cms";
import { siteUrl } from "@/lib/env";
import { POLICIES } from "@/lib/policies";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = siteUrl();
  const products = await loadCatalogue();

  return [
    { url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    {
      url: `${url}/products`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...products.map((product) => ({
      url: `${url}/products/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${url}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${url}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    ...POLICIES.map((policy) => ({
      url: `${url}/policies/${policy.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}