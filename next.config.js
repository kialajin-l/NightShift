const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverComponentsExternalPackages: [
      'better-sqlite3',
      '@anthropic-ai/claude-agent-sdk',
      '@anthropic-ai/sdk',
      'discord.js',
      'socket.io',
    ],
    outputFileTracingExcludes: {
      '**/*': [
        'next.config.js',
        'next.config.ts',
        'README.md',
        'CHANGELOG.md',
        'LICENSE',
        '.codepilot/**',
        '.trae/**',
        'apps/**',
        'docs/**',
        'release/**',
        'dist-electron*/**',
        'scripts/**',
        'test-results/**',
        'playwright-report/**',
        '**/*.md',
        '**/*.mdx',
        '**/*.png',
        '**/*.jpg',
        '**/*.jpeg',
        '**/*.gif',
        '**/*.ico',
        '**/*.py',
        '**/*.bak',
      ],
    },
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      '@lobehub/ui': false,
      'antd': false,
      'antd-style': false,
    };
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@phosphor-icons\/react\/([A-Z][A-Za-z0-9]*)$/,
        (resource) => {
          const iconName = resource.request.slice('@phosphor-icons/react/'.length);
          const target = isServer ? 'ssr' : 'csr';
          resource.request = path.join(
            process.cwd(),
            'node_modules',
            '@phosphor-icons',
            'react',
            'dist',
            target,
            `${iconName}.es.js`
          );
        }
      )
    );
    return config;
  },
};
module.exports = nextConfig;
