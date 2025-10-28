import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude openai and dd-trace from bundling for Datadog instrumentation
      config.externals.push("openai", "dd-trace", "@datadog/libdatadog");

      // Add fallback for graphql to prevent dd-trace errors
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        graphql: false,
      };
    }
    return config;
  },
};

export default nextConfig;
