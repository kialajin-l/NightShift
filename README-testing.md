# NightShift 项目自动化测试指南

## 概述

本项目使用 **Playwright + TypeScript** 进行端到端自动化测试，覆盖前端交互、后端 API 和全栈数据流。

## 测试架构

### 测试文件结构
```
tests/
├── e2e.spec.ts          # 主要端到端测试用例
├── setup/
│   └── test-helpers.ts  # 测试辅助函数
└── test-results/        # 测试结果和截图
```

### 配置文件
- `playwright.config.ts` - Playwright 主配置
- `package.json` - 测试脚本配置

## 快速开始

### 1. 安装依赖
```bash
# 安装 Playwright
npm install

# 安装浏览器（首次运行）
npx playwright install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 运行测试
```bash
# 运行所有测试
npm run test

# 运行指定浏览器测试
npm run test:chromium
npm run test:firefox
npm run test:webkit

# 可视化运行测试
npm run test:headed

# 调试模式
npm run test:debug

# UI 模式（Playwright 测试界面）
npm run test:ui
```

## 测试用例说明

### P0 - 核心聊天流测试
- **TC001**: 基本消息发送和接收
- **TC002**: 长文本消息处理
- **TC003**: 连续消息发送

### P1 - 设置页面与持久化测试
- **TC004**: 设置页面导航和主题切换
- **TC005**: API Key 设置持久化

### P1 - 错误处理测试
- **TC006**: API 错误友好提示
- **TC007**: 网络断开恢复

### P2 - 侧边栏交互测试
- **TC008**: 侧边栏展开收起
- **TC009**: 侧边栏会话列表交互

### 综合场景测试
- **TC010**: 完整用户工作流
- **TC011**: 页面加载性能
- **TC012**: 消息响应性能

## 测试数据标识符

测试使用以下 `data-testid` 属性来定位元素：

### 布局组件
- `app-shell` - 主应用容器
- `chat-view` - 聊天界面
- `settings-layout` - 设置页面布局
- `chat-list-panel` - 侧边栏会话列表
- `main-content` - 主内容区域

### 消息组件
- `message-input` - 消息输入框
- `user-message` - 用户消息
- `ai-message` - AI 消息
- `streaming-response` - 流式响应元素
- `message-complete` - 消息完成标识

### 交互组件
- `sidebar-toggle` - 侧边栏切换按钮
- `theme-toggle` - 主题切换按钮
- `api-key-input` - API Key 输入框
- `save-settings` - 保存设置按钮

### 状态组件
- `error-toast` - 错误提示 Toast
- `network-error` - 网络错误提示
- `session-item` - 会话列表项

## 测试配置说明

### Playwright 配置特性
- **多浏览器支持**: Chromium, Firefox, WebKit
- **并行测试**: 支持多工作进程并行运行
- **自动截图**: 失败时自动截取屏幕截图
- **视频录制**: 失败时录制测试视频
- **追踪功能**: 记录测试执行过程

### 环境配置
- **基础 URL**: `http://localhost:3000`
- **超时设置**: 页面加载 30秒，操作 10秒
- **视口设置**: 1920x1080 桌面分辨率
- **网络模拟**: 支持离线模式和延迟模拟

## 测试最佳实践

### 1. 测试编写原则
- 每个测试用例独立运行
- 使用明确的等待条件而非固定延迟
- 验证预期的用户行为而非实现细节
- 包含适当的断言和错误处理

### 2. 性能监控
- 监控页面加载时间（<5秒）
- 监控 AI 响应时间（<10秒）
- 记录关键性能指标

### 3. 错误处理
- 验证错误提示的正确显示
- 确保应用在错误状态下不崩溃
- 测试网络异常恢复能力

## 故障排除

### 常见问题

1. **测试超时**
   - 检查开发服务器是否正常运行
   - 增加超时时间配置
   - 检查网络连接

2. **元素定位失败**
   - 确认 `data-testid` 属性正确设置
   - 检查元素是否在视口内
   - 验证页面加载状态

3. **浏览器兼容性问题**
   - 分别运行不同浏览器测试
   - 检查浏览器版本兼容性

### 调试技巧

```bash
# 启用调试模式
npm run test:debug

# 查看详细日志
DEBUG=pw:api npm run test

# 生成测试报告
npx playwright show-report
```

## CI/CD 集成

测试可以集成到 CI/CD 流程中：

```yaml
# GitHub Actions 示例
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npx playwright install
      - run: npm run test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## 扩展测试

### 添加新测试用例
1. 在 `e2e.spec.ts` 中添加新的 `test` 块
2. 使用现有的测试辅助函数
3. 添加必要的 `data-testid` 属性
4. 更新测试文档

### 自定义测试辅助函数
1. 在 `tests/setup/test-helpers.ts` 中添加新函数
2. 导出函数供测试用例使用
3. 更新类型定义

## 联系方式

如有测试相关问题，请参考：
- [Playwright 官方文档](https://playwright.dev)
- [项目 Issue 跟踪](https://github.com/your-repo/issues)
- [测试报告目录](./test-results/)