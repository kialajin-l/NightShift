import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    // 完全禁用 CSS 相关功能
    css: false
  },
  // 明确指定根目录，避免搜索父目录
  root: resolve(__dirname),
  // 禁用配置文件搜索
  configFile: false,
  // 明确禁用所有 CSS 相关插件
  plugins: [],
  // 禁用所有 PostCSS 相关功能
  css: {
    postcss: false,
    modules: false,
    preprocessorOptions: {}
  }
});