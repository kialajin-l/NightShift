import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置 - NightShift 项目端到端测试
 * 基于 Next.js App Router 和 TypeScript 环境
 */
export default defineConfig({
  // 测试文件匹配模式
  testDir: './tests',
  
  // 测试文件匹配模式
  testMatch: '**/*.spec.ts',
  
  // 测试超时设置
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  
  // 是否并行运行测试
  fullyParallel: true,
  
  // 失败时重试次数
  retries: process.env.CI ? 2 : 0,
  
  // 并行工作进程数
  workers: process.env.CI ? 1 : undefined,
  
  // 测试报告配置
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'results.xml' }]
  ],
  
  // 项目配置
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // 视口设置
        viewport: { width: 1920, height: 1080 },
        // 忽略 HTTPS 错误（开发环境）
        ignoreHTTPSErrors: true,
        // 截图设置
        screenshot: 'only-on-failure',
        // 视频录制
        video: 'retain-on-failure'
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    // 移动端测试（可选）
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Web 服务器配置
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // 全局设置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',
    
    // 自动等待元素可见
    actionTimeout: 10000,
    
    // 导航超时
    navigationTimeout: 30000,
    
    // 追踪请求
    trace: 'on-first-retry',
  },
});