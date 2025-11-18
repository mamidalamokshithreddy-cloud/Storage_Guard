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
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  eslint: {
    // Allow production builds to complete even if there are ESLint warnings
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Allow production builds to complete even if there are type errors
    ignoreBuildErrors: false,
  },
  // Webpack configuration to handle large chunks
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
  // Proxy API requests to avoid CORS and mixed content issues in production
  async rewrites() {
    // Only enable proxy when deployed (when API calls need to go through same domain)
    const useProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === 'true';
    
    if (useProxy) {
      const backendUrl = process.env.BACKEND_API_URL || 'http://13.204.131.75:8000';
      
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/:path*`,
        },
      ];
    }
    
    return [];
  },
}

module.exports = nextConfig