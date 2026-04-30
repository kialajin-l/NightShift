/**
 * 测试辅助函数库
 * 提供通用的测试工具函数
 */

import { Page, expect } from '@playwright/test';

/**
 * 等待页面加载完成的通用函数
 */
export async function waitForPageReady(page: Page, timeout = 15000): Promise<void> {
  // 等待页面主要内容加载
  await page.waitForLoadState('networkidle', { timeout });
  
  // 等待关键元素可见
  const selectors = [
    '[data-testid="app-shell"]',
    '[data-testid="chat-view"]',
    'body'
  ];
  
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 10000 });
    } catch (error) {
      console.warn(`Selector ${selector} not found within timeout`);
    }
  }
}

/**
 * 截取测试截图
 */
export async function takeScreenshot(page: Page, testName: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = `test-results/screenshots/${testName}-${timestamp}.png`;
  
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });
  
  console.log(`Screenshot saved: ${screenshotPath}`);
}

/**
 * 模拟网络延迟
 */
export async function simulateNetworkDelay(page: Page, delayMs: number): Promise<void> {
  await page.route('**/*', route => {
    setTimeout(() => route.continue(), delayMs);
  });
}

/**
 * 验证元素可见性
 */
export async function assertElementVisible(
  page: Page, 
  selector: string, 
  timeout = 5000
): Promise<void> {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * 验证元素包含文本
 */
export async function assertElementContainsText(
  page: Page,
  selector: string,
  text: string,
  timeout = 5000
): Promise<void> {
  await expect(page.locator(selector)).toContainText(text, { timeout });
}

/**
 * 验证元素数量
 */
export async function assertElementCount(
  page: Page,
  selector: string,
  count: number,
  timeout = 5000
): Promise<void> {
  await expect(page.locator(selector)).toHaveCount(count, { timeout });
}

/**
 * 等待特定条件成立
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout = 10000,
  interval = 500
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * 获取页面性能指标
 */
export async function getPerformanceMetrics(page: Page): Promise<{
  loadTime: number;
  domContentLoadedTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
}> {
  const performanceTiming = await page.evaluate(() => {
    const timing = performance.timing;
    return {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0
    };
  });
  
  return performanceTiming;
}

/**
 * 模拟用户输入
 */
export async function simulateUserInput(
  page: Page,
  selector: string,
  text: string,
  delayBetweenKeys = 50
): Promise<void> {
  const element = page.locator(selector);
  await element.click();
  await element.fill('');
  
  // 模拟逐字输入（更真实的用户行为）
  for (const char of text) {
    await element.press(char);
    await page.waitForTimeout(delayBetweenKeys);
  }
}

/**
 * 验证控制台错误
 */
export async function assertNoConsoleErrors(page: Page): Promise<void> {
  const consoleErrors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // 等待一段时间收集错误
  await page.waitForTimeout(2000);
  
  if (consoleErrors.length > 0) {
    throw new Error(`Console errors detected: ${consoleErrors.join(', ')}`);
  }
}

/**
 * 验证网络请求状态
 */
export async function assertNetworkRequestsSuccessful(page: Page): Promise<void> {
  const failedRequests: string[] = [];
  
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push(`${response.url()} - ${response.status()}`);
    }
  });
  
  // 等待网络活动完成
  await page.waitForLoadState('networkidle');
  
  if (failedRequests.length > 0) {
    throw new Error(`Failed network requests: ${failedRequests.join(', ')}`);
  }
}