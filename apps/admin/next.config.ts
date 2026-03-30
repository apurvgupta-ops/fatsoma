import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shared hosting / low ulimits: fewer worker processes during `next build`
  experimental: {
    cpus: 1,
    workerThreads: false,
    webpackBuildWorker: false,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 100,
  },
  transpilePackages: ["@fatsoma/api-client", "@fatsoma/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
