/** @type {import('next').NextConfig} */
const baseSecurityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const adminSecurityHeaders = [
  ...baseSecurityHeaders,
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const apiSecurityHeaders = [
  ...baseSecurityHeaders,
  {
    key: 'Content-Security-Policy',
    value: "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  },
];

const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: adminSecurityHeaders,
      },
      {
        source: '/api/:path*',
        headers: apiSecurityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/cod2',
        destination: '/cod2/index.html',
      },
      {
        source: '/cod2/',
        destination: '/cod2/index.html',
      },
      {
        source: '/pulsesync',
        destination: '/pulsesync/index.html',
      },
      {
        source: '/pulsesync/',
        destination: '/pulsesync/index.html',
      },
    ];
  },
};

export default nextConfig;
