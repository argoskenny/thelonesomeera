/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['127.0.0.1'],
  async rewrites() {
    return [
      {
        source: '/showcase/cod2',
        destination: '/showcase/cod2/index.html',
      },
      {
        source: '/showcase/cod2/',
        destination: '/showcase/cod2/index.html',
      },
      {
        source: '/showcase/pulsesync',
        destination: '/showcase/pulsesync/index.html',
      },
      {
        source: '/showcase/pulsesync/',
        destination: '/showcase/pulsesync/index.html',
      },
      {
        source: '/showcase/room',
        destination: '/showcase/room/index.html',
      },
      {
        source: '/showcase/room/',
        destination: '/showcase/room/index.html',
      },
      {
        source: '/showcase/mma',
        destination: '/showcase/mma/index.html',
      },
      {
        source: '/showcase/mma/',
        destination: '/showcase/mma/index.html',
      },
      {
        source: '/showcase/colorful_kart',
        destination: '/showcase/colorful_kart/index.html',
      },
      {
        source: '/showcase/colorful_kart/',
        destination: '/showcase/colorful_kart/index.html',
      },
      {
        source: '/showcase/bpd',
        destination: '/showcase/bpd/index.html',
      },
      {
        source: '/showcase/bpd/',
        destination: '/showcase/bpd/index.html',
      },
      {
        source: '/showcase/mini_fantasy',
        destination: '/showcase/mini_fantasy/index.html',
      },
      {
        source: '/showcase/mini_fantasy/',
        destination: '/showcase/mini_fantasy/index.html',
      },
    ];
  },
};

export default nextConfig;
