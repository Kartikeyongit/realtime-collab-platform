/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER ? 'standalone' : undefined,
  images: {
    remotePatterns: [
      { hostname: 'avatars.githubusercontent.com' },
      { hostname: 'lh3.googleusercontent.com' },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
  transpilePackages: [
    'yjs',
    'y-websocket',
    'y-protocols',
    'y-prosemirror',
  ],
};

export default nextConfig;
