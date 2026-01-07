/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      {
        source: '/indexing',
        destination: '/resources/solving-hallucination-in-regulatory-ai',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
