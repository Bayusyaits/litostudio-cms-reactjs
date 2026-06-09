/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@litostudio/types', '@litostudio/constants', '@litostudio/api-contracts', '@litostudio/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.litostudio.id' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google OAuth avatars
    ],
  },
}

export default nextConfig
