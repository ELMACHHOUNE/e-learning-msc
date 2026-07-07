import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/loader"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "DuckDuckBot",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "Slurp",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "Yahoo! Slurp",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "Bravebot",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "EcosiaBot",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "Qwantify",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://e-learning-msc.vercel.app/sitemap.xml",
  };
}
