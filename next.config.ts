import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.110.42', 'localhost', '127.0.0.1'],
  async redirects() {
    return [
      {
        source: '/product',
        destination: '/products',
        permanent: true,
      },
      {
        source: '/product/:slug*',
        destination: '/products/:slug*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
