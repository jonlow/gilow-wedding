import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 15552000, // 6 months in seconds
  },
};

export default nextConfig;
