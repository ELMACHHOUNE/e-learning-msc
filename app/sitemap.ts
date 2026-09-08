import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://e-teaching.tech";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/programs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/forgot-password`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  let programRoutes: MetadataRoute.Sitemap = [];
  try {
    await connectToDatabase();
    const courses = await Course.find({
      $or: [{ active: true }, { active: { $exists: false } }],
    })
      .select("_id updatedAt")
      .lean();
    programRoutes = courses.map((course) => ({
      url: `${baseUrl}/programs/${course._id.toString()}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    // leave programRoutes empty if the database is unavailable at build time
  }

  return [...staticRoutes, ...programRoutes];
}
