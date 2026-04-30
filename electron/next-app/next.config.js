const path = require('path');

/** @type {import('next').NextConfig} */

// NightShift Electron 桌面应用配置
const nextConfig = {
  // 静态导出，支持Electron桌面应用
  // 禁用文件追踪（静态导出不需要，且会 OOM）
    trailingSlash: true,
  outputFileTracing: false,
          
  // 图片优化配置
  images: {
    unoptimized: true
  },
  
  // 资源路径配置
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : '',
  basePath: process.env.NODE_ENV === 'production' ? '' : '',
  
  // 禁用类型检查以加快启动速度
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 禁用 ESLint 检查
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 自定义webpack配置以支持Electron
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const { DefinePlugin } = require('webpack');
      config.plugins.push(
        new DefinePlugin({
          'process.env.ELECTRON': JSON.stringify(process.env.ELECTRON || false),
          'process.env.NEXT_PUBLIC_ELECTRON': JSON.stringify(process.env.ELECTRON || false)
        })
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false
      };
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      '@nightshift/core': false,
      '@nightshift/agents': false,
      '@nightshift/ruleforge': false,
      '@nightshift/ui': false,
      // Mock @lobehub/ui — 项目只用 SVG 图标(Mono)，不用 Avatar 组件
      '@lobehub/ui': require.resolve('./lib/mock-lobehub-ui.cjs'),
      // Mock antd-style — @lobehub/icons 的 IconAvatar 用了 useThemeMode
      'antd': require.resolve('./lib/mock-antd.cjs'),
      // Mock optional channel SDK dependencies
      'zlib-sync': require.resolve('./lib/mock-zlib-sync.cjs'),
      '@larksuiteoapi/node-sdk': require.resolve('./lib/mock-lark-sdk.cjs'),
      '@sentry/node': require.resolve('./lib/mock-sentry.cjs'),
    };
    return config;
  }
};

module.exports = nextConfig;
