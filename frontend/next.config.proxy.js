/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', '13.204.131.75', 'api.agrihublife.ai', 'beta.agrihublife.ai'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // API Proxy to avoid CORS and mixed content issues
  async rewrites() {
    // Only use proxy in production when NEXT_PUBLIC_USE_PROXY is true
    if (process.env.NEXT_PUBLIC_USE_PROXY === 'true') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://13.204.131.75:8000/:path*', // Proxy to backend
        },
        {
          source: '/ws/:path*',
          destination: 'ws://13.204.131.75:8000/:path*', // Proxy WebSocket
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
