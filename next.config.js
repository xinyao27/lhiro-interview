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
}

module.exports = nextConfig 