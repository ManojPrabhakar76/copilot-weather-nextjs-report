import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/copilot-weather-nextjs-report',
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
};

export default nextConfig;