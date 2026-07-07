import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://e-learning-msc.vercel.app";

  const routes = [
    "",
    "/login",
    "/forgot-password",
    "/dashboard",
    "/courses",
    "/admin",
    "/students",
    "/teach/attendance",
    "/teach/one-to-one",
    "/teach/earnings",
    "/teach/online-sessions",
    "/labphase/lab-phase-list",
    "/labphase/student-projects",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : ("monthly" as const),
    priority: route === "" ? 1 : 0.8,
  }));
}
