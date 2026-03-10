import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fatsoma/api-client", "@fatsoma/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
