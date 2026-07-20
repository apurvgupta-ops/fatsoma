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
  async redirects() {
    return [
      { source: "/dashboard", destination: "/organiser-dashboard", permanent: false },
      { source: "/events", destination: "/organiser-dashboard/events", permanent: false },
      { source: "/events/create", destination: "/organiser-dashboard/events/create", permanent: false },
      { source: "/organiser/add-tickets", destination: "/organiser-dashboard/add-tickets", permanent: false },
      { source: "/events/:id/edit", destination: "/organiser-dashboard/events/:id/edit", permanent: false },
      { source: "/payments", destination: "/organiser-dashboard/payments", permanent: false },
      { source: "/staff", destination: "/organiser-dashboard/staff", permanent: false },
    ];
  },
};

export default nextConfig;
