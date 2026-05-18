/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve these modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    
    // Handle Yjs and related packages
    config.resolve.alias = {
      ...config.resolve.alias,
      yjs: require.resolve('yjs'),
    };
    
    // Ignore warnings about critical dependencies
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };
    
    return config;
  },
  transpilePackages: [
    'yjs',
    'y-websocket',
    'y-protocols',
    'y-prosemirror',
    'lib0',
    '@tiptap/extension-collaboration',
    '@tiptap/extension-collaboration-cursor',
  ],
};

module.exports = nextConfig;
