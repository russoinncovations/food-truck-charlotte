import type { MetadataRoute } from "next";
import { trucks } from "@/data/trucks";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/find-food-trucks",
    "/events",
    "/book-a-truck",
    "/for-trucks",
    "/for-venues",
    "/community",
  ];

  const staticEntries = staticRoutes.map((route) => ({
    url: `${site.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const truckEntries = trucks.map((truck) => ({
    url: `${site.url}/trucks/${truck.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...truckEntries];
}
