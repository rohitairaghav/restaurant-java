/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['supabase.co'],
  },
  transpilePackages: ['@restaurant-inventory/shared'],
}

module.exports = nextConfig