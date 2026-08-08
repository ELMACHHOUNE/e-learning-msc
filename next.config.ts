import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverExternalPackages: ['mongoose', '@aws-sdk/client-s3'],
  experimental: {
    proxyClientMaxBodySize: 50 * 1024 * 1024,
  },
};

export default nextConfig;
