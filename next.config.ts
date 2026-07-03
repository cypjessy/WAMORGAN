import type { NextConfig } from "next";

const isMobileBuild = process.env.BUILD_FOR_MOBILE === 'true';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  ...(isMobileBuild ? {
    output: 'export' as const,
    trailingSlash: true,
  } : {}),
};

export default nextConfig;
