import { defineConfig } from 'vitest/config';

/**
 * 完全隔离的 Vitest 配置
 * 避免搜索父目录的配置文件
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    // 完全禁用所有 CSS 相关功能
    css: false
  },
  // 明确设置根目录为当前目录
  root: process.cwd(),
  // 禁用所有插件和配置搜索
  plugins: [],
  // 禁用所有 CSS 处理
  css: {
    postcss: false,
    modules: false,
    preprocessorOptions: {}
  },
  // 禁用配置文件搜索
  configFile: false,
  // 明确禁用所有 PostCSS 相关功能
  optimizeDeps: {
    exclude: ['postcss', 'css', 'sass', 'less']
  }
});