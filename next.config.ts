import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/copilt-weather-report', // Replace with your repository name
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
};

export default nextConfig;