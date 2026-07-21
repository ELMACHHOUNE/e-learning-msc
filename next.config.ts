import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverExternalPackages: ['mongoose'],
  experimental: {
    proxyClientMaxBodySize: 50 * 1024 * 1024,
  },
};

export default nextConfig;
