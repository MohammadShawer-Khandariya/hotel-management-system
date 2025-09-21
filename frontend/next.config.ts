import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    domains: [],
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  },
  
  // SWC minification is enabled by default in Next.js 13+
  
  // Disable experimental optimizations that can cause build issues
  experimental: {
    // Remove optimizeCss as it can cause critters issues
  },
  
  // Output configuration for deployment
  output: 'standalone',
  
  // Disable strict mode to avoid double rendering issues during development
  reactStrictMode: true,
  
  // Compiler options
  compiler: {
    // Remove unused imports
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
