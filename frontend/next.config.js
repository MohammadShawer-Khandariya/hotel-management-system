/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't use standalone for Vercel - it handles this automatically
  images: {
    domains: [],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  // Enable SWC minification
  swcMinify: true,
  // Optimize for production
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig