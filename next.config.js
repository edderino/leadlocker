/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {},
    appDir: true,
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

module.exports = nextConfig;

