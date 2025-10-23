/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    WEB_PUSH_PUBLIC_KEY: process.env.WEB_PUSH_PUBLIC_KEY,
    WEB_PUSH_PRIVATE_KEY: process.env.WEB_PUSH_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  },
  experimental: {
    serverActions: {},
    appDir: true,
  },
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/client/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
};

export default nextConfig;

