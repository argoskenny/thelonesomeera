/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/cod2',
        destination: '/cod2/index.html',
      },
    ];
  },
};

export default nextConfig;
