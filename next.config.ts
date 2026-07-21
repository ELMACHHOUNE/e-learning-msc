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
  experimental: {
    proxyClientMaxBodySize: 50 * 1024 * 1024,
    serverComponentsExternalPackages: ['mongoose'],
  },
};

export default nextConfig;
