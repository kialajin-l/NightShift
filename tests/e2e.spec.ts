import { test, expect, type Page } from '@playwright/test';

/**
 * NightShift 项目端到端自动化测试
 * 基于 Playwright + TypeScript
 * 
 * 测试优先级：
 * P0 - 核心聊天流
 * P1 - 设置页面与持久化、错误处理
 * P2 - 侧边栏交互
 */

/**
 * 测试辅助函数
 */
class NightShiftTestHelpers {
  constructor(private page: Page) {}

  /**
   * 等待页面加载完成
   */
  async waitForAppReady(): Promise<void> {
    // 等待主应用容器加载
    await this.page.waitForSelector('[data-testid="app-shell"]', { 
      timeout: 15000 
    });
    
    // 等待聊天界面加载
    await this.page.waitForSelector('[data-testid="chat-view"]', { 
      timeout: 10000 
    });
  }

  /**
   * 获取消息输入框
   */
  async getMessageInput() {
    return this.page.locator('[data-testid="message-input"] textarea');
  }

  /**
   * 发送消息
   */
  async sendMessage(content: string): Promise<void> {
    const input = await this.getMessageInput();
    await input.fill(content);
    await input.press('Enter');
  }

  /**
   * 等待 AI 响应
   */
  async waitForAIResponse(timeout = 30000): Promise<void> {
    // 等待流式响应开始
    await this.page.waitForSelector('[data-testid="streaming-response"]', {
      timeout
    });
    
    // 等待流式响应完成
    await this.page.waitForSelector('[data-testid="message-complete"]', {
      timeout: timeout + 10000
    });
  }

  /**
   * 获取最后一条用户消息
   */
  async getLastUserMessage(): Promise<string> {
    const userMessages = this.page.locator('[data-testid="user-message"]').last();
    return await userMessages.textContent() || '';
  }

  /**
   * 获取最后一条 AI 消息
   */
  async getLastAIMessage(): Promise<string> {
    const aiMessages = this.page.locator('[data-testid="ai-message"]').last();
    return await aiMessages.textContent() || '';
  }

  /**
   * 导航到设置页面
   */
  async navigateToSettings(): Promise<void> {
    await this.page.goto('/settings');
    await this.page.waitForSelector('[data-testid="settings-layout"]', {
      timeout: 10000
    });
  }

  /**
   * 切换暗色/亮色模式
   */
  async toggleTheme(): Promise<void> {
    const themeToggle = this.page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    
    // 等待主题切换动画完成
    await this.page.waitForTimeout(500);
  }

  /**
   * 检查当前主题
   */
  async getCurrentTheme(): Promise<'light' | 'dark'> {
    const html = this.page.locator('html');
    const classList = await html.getAttribute('class');
    return classList?.includes('dark') ? 'dark' : 'light';
  }

  /**
   * 切换侧边栏状态
   */
  async toggleSidebar(): Promise<void> {
    const sidebarToggle = this.page.locator('[data-testid="sidebar-toggle"]');
    await sidebarToggle.click();
    
    // 等待侧边栏动画完成
    await this.page.waitForTimeout(300);
  }

  /**
   * 检查侧边栏状态
   */
  async getSidebarState(): Promise<'expanded' | 'collapsed'> {
    const sidebar = this.page.locator('[data-testid="chat-list-panel"]');
    const classList = await sidebar.getAttribute('class');
    return classList?.includes('collapsed') ? 'collapsed' : 'expanded';
  }

  /**
   * 模拟 API 错误
   */
  async triggerAPIError(): Promise<void> {
    // 发送一个可能触发错误的特殊指令
    await this.sendMessage('/error-test');
  }

  /**
   * 检查错误 Toast 是否显示
   */
  async checkErrorToast(): Promise<boolean> {
    const toast = this.page.locator('[data-testid="error-toast"]');
    return await toast.isVisible();
  }
}

/**
 * 测试用例组：核心聊天流 (P0)
 */
test.describe('核心聊天流测试 (P0)', () => {
  let helpers: NightShiftTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new NightShiftTestHelpers(page);
    
    // 访问首页
    await page.goto('/');
    await helpers.waitForAppReady();
  });

  test('TC001 - 基本消息发送和接收', async ({ page }) => {
    // 测试步骤 1: 发送简单消息
    const testMessage = 'Hello, NightShift!';
    await helpers.sendMessage(testMessage);

    // 断言 1: 用户消息正确显示
    await expect(page.locator('[data-testid="user-message"]').last())
      .toContainText(testMessage, { timeout: 5000 });

    // 测试步骤 2: 等待 AI 响应
    await helpers.waitForAIResponse();

    // 断言 2: AI 响应正确显示
    const aiResponse = await helpers.getLastAIMessage();
    expect(aiResponse).toBeTruthy();
    expect(aiResponse.length).toBeGreaterThan(0);

    // 断言 3: 流式响应元素存在
    await expect(page.locator('[data-testid="streaming-response"]')).not.toBeVisible();
    
    // 截图记录测试结果
    await page.screenshot({ 
      path: 'test-results/TC001-basic-chat.png',
      fullPage: true 
    });
  });

  test('TC002 - 长文本消息处理', async ({ page }) => {
    // 测试步骤: 发送长文本消息
    const longMessage = '这是一段很长的测试消息。'.repeat(50);
    await helpers.sendMessage(longMessage);

    // 断言: 长消息正确显示
    await expect(page.locator('[data-testid="user-message"]').last())
      .toContainText('这是一段很长的测试消息', { timeout: 5000 });

    // 等待 AI 响应
    await helpers.waitForAIResponse();
  });

  test('TC003 - 连续消息发送', async ({ page }) => {
    // 测试步骤: 连续发送多条消息
    const messages = [
      '第一条测试消息',
      '第二条测试消息',
      '第三条测试消息'
    ];

    for (const message of messages) {
      await helpers.sendMessage(message);
      
      // 断言: 每条消息都正确显示
      await expect(page.locator('[data-testid="user-message"]').last())
        .toContainText(message, { timeout: 3000 });
      
      // 短暂等待下一条消息
      await page.waitForTimeout(1000);
    }

    // 断言: 总共显示 3 条用户消息
    await expect(page.locator('[data-testid="user-message"]')).toHaveCount(3);
  });
});

/**
 * 测试用例组：设置页面与持久化 (P1)
 */
test.describe('设置页面与持久化测试 (P1)', () => {
  let helpers: NightShiftTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new NightShiftTestHelpers(page);
  });

  test('TC004 - 设置页面导航和主题切换', async ({ page }) => {
    // 测试步骤 1: 导航到设置页面
    await helpers.navigateToSettings();

    // 断言 1: 设置页面正确加载
    await expect(page).toHaveURL(/.*\/settings/);
    await expect(page.locator('[data-testid="settings-layout"]')).toBeVisible();

    // 测试步骤 2: 获取当前主题
    const initialTheme = await helpers.getCurrentTheme();

    // 测试步骤 3: 切换主题
    await helpers.toggleTheme();
    
    // 断言 2: 主题正确切换
    const newTheme = await helpers.getCurrentTheme();
    expect(newTheme).not.toBe(initialTheme);

    // 测试步骤 4: 刷新页面
    await page.reload();
    await helpers.waitForAppReady();

    // 断言 3: 主题设置持久化
    const persistedTheme = await helpers.getCurrentTheme();
    expect(persistedTheme).toBe(newTheme);

    // 截图记录
    await page.screenshot({ 
      path: `test-results/TC004-theme-${newTheme}.png`,
      fullPage: true 
    });
  });

  test('TC005 - API Key 设置持久化', async ({ page }) => {
    // 测试步骤 1: 导航到设置页面
    await helpers.navigateToSettings();

    // 测试步骤 2: 修改 API Key（模拟）
    const testApiKey = 'test-api-key-' + Date.now();
    const apiKeyInput = page.locator('[data-testid="api-key-input"]');
    
    if (await apiKeyInput.isVisible()) {
      await apiKeyInput.fill(testApiKey);
      
      // 测试步骤 3: 保存设置
      const saveButton = page.locator('[data-testid="save-settings"]');
      await saveButton.click();
      
      // 等待保存完成
      await page.waitForTimeout(1000);

      // 测试步骤 4: 刷新页面
      await page.reload();
      await helpers.waitForAppReady();

      // 断言: API Key 设置持久化
      await expect(apiKeyInput).toHaveValue(testApiKey);
    }
  });
});

/**
 * 测试用例组：错误处理 (P1)
 */
test.describe('错误处理测试 (P1)', () => {
  let helpers: NightShiftTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new NightShiftTestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
  });

  test('TC006 - API 错误友好提示', async ({ page }) => {
    // 测试步骤: 触发 API 错误
    await helpers.triggerAPIError();

    // 断言 1: 错误 Toast 显示
    const isToastVisible = await helpers.checkErrorToast();
    expect(isToastVisible).toBe(true);

    // 断言 2: 应用未崩溃，仍然可以正常操作
    await expect(page.locator('[data-testid="chat-view"]')).toBeVisible();
    
    // 断言 3: 输入框仍然可用
    const input = await helpers.getMessageInput();
    await expect(input).toBeEnabled();

    // 截图记录错误状态
    await page.screenshot({ 
      path: 'test-results/TC006-error-handling.png',
      fullPage: true 
    });
  });

  test('TC007 - 网络断开恢复', async ({ page }) => {
    // 测试步骤 1: 模拟网络断开
    await page.context().setOffline(true);
    
    // 测试步骤 2: 尝试发送消息
    await helpers.sendMessage('测试网络断开');
    
    // 断言 1: 显示网络错误提示
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible({
      timeout: 5000
    });

    // 测试步骤 3: 恢复网络
    await page.context().setOffline(false);
    
    // 断言 2: 网络恢复后可以正常操作
    await expect(page.locator('[data-testid="message-input"]')).toBeEnabled({
      timeout: 10000
    });
  });
});

/**
 * 测试用例组：侧边栏交互 (P2)
 */
test.describe('侧边栏交互测试 (P2)', () => {
  let helpers: NightShiftTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new NightShiftTestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
  });

  test('TC008 - 侧边栏展开收起', async ({ page }) => {
    // 测试步骤 1: 获取初始侧边栏状态
    const initialState = await helpers.getSidebarState();

    // 测试步骤 2: 切换侧边栏状态
    await helpers.toggleSidebar();
    
    // 断言 1: 侧边栏状态正确切换
    const newState = await helpers.getSidebarState();
    expect(newState).not.toBe(initialState);

    // 测试步骤 3: 再次切换
    await helpers.toggleSidebar();
    
    // 断言 2: 侧边栏状态恢复
    const finalState = await helpers.getSidebarState();
    expect(finalState).toBe(initialState);

    // 断言 3: 主内容区域布局正确
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    
    // 截图记录不同状态
    await page.screenshot({ 
      path: `test-results/TC008-sidebar-${initialState}.png`,
      fullPage: true 
    });
  });

  test('TC009 - 侧边栏会话列表交互', async ({ page }) => {
    // 测试步骤: 点击侧边栏中的会话项
    const sessionItems = page.locator('[data-testid="session-item"]');
    
    if (await sessionItems.first().isVisible()) {
      await sessionItems.first().click();
      
      // 断言: 会话正确切换
      await expect(page.locator('[data-testid="chat-view"]')).toBeVisible();
      
      // 短暂等待会话加载
      await page.waitForTimeout(1000);
    }
  });
});

/**
 * 综合场景测试
 */
test.describe('综合场景测试', () => {
  let helpers: NightShiftTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new NightShiftTestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
  });

  test('TC010 - 完整用户工作流', async ({ page }) => {
    // 步骤 1: 发送消息
    await helpers.sendMessage('帮我写一个 TypeScript 函数');
    await helpers.waitForAIResponse();

    // 步骤 2: 切换侧边栏状态
    await helpers.toggleSidebar();

    // 步骤 3: 导航到设置页面
    await helpers.navigateToSettings();

    // 步骤 4: 修改主题
    await helpers.toggleTheme();

    // 步骤 5: 返回聊天页面
    await page.goBack();
    await helpers.waitForAppReady();

    // 步骤 6: 继续聊天
    await helpers.sendMessage('谢谢，这个函数很好用！');
    await helpers.waitForAIResponse();

    // 综合断言: 所有功能正常
    await expect(page.locator('[data-testid="chat-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-message"]')).toHaveCount(2);
    
    // 最终截图
    await page.screenshot({ 
      path: 'test-results/TC010-complete-workflow.png',
      fullPage: true 
    });
  });
});

/**
 * 性能测试（可选）
 */
test.describe('性能测试', () => {
  test('TC011 - 页面加载性能', async ({ page }) => {
    // 记录页面加载时间
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-shell"]');
    
    const loadTime = Date.now() - startTime;
    
    // 断言: 页面加载时间在合理范围内
    expect(loadTime).toBeLessThan(5000); // 5秒内加载完成
    
    console.log(`页面加载时间: ${loadTime}ms`);
  });

  test('TC012 - 消息响应性能', async ({ page }) => {
    const helpers = new NightShiftTestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
    
    // 记录消息响应时间
    const startTime = Date.now();
    
    await helpers.sendMessage('性能测试消息');
    await helpers.waitForAIResponse(15000); // 15秒超时
    
    const responseTime = Date.now() - startTime;
    
    // 断言: AI 响应时间在合理范围内
    expect(responseTime).toBeLessThan(10000); // 10秒内响应
    
    console.log(`AI 响应时间: ${responseTime}ms`);
  });
});