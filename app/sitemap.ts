import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://boppi.vercel.app", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://boppi.vercel.app/create", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: "https://boppi.vercel.app/spot", lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
  ];
}
