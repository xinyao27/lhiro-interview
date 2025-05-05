/** @type {import('next').NextConfig} */

const { codeInspectorPlugin } = require('code-inspector-plugin');


const nextConfig = {
  experimental: {
    serverActions: true,
  },
  webpack: (config, { dev, isServer }) => {
    config.plugins.push(codeInspectorPlugin({ bundler: 'webpack' }));
    return config;
  },
  eslint: {
    // ignoreDuringBuilds: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 