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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
      { protocol: "https", hostname: "api.onthelistapp.co.uk", pathname: "/uploads/**" },
      { protocol: "http", hostname: "localhost", port: "3016", pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
