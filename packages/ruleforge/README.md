# RuleForge - 智能代码模式识别引擎

RuleForge 是一个基于 TypeScript 的智能代码模式识别引擎，能够从开发会话中自动提取最佳实践规则，并生成符合 REP v0.1 标准的 YAML 规则文件。

## 🚀 快速开始（3分钟）

### 安装依赖

```bash
cd packages/ruleforge
npm install
```

### 基本使用

```typescript
import { PatternRecognizer } from './src/recognizer/pattern-recognizer.js';
import { RuleYamlFormatter } from '../../../core/src/formatter/yaml-formatter.js';

// 1. 创建模式识别器
const recognizer = new PatternRecognizer({
  minConfidence: 0.7,
  minFrequency: 2,
  maxPatterns: 10,
});

// 2. 分析开发会话
const sessions = [/* 你的开发会话数据 */];
const patterns = [];
for (const session of sessions) {
  const sessionPatterns = recognizer.recognizePatterns(session);
  patterns.push(...sessionPatterns);
}

// 3. 生成 YAML 规则
const formatter = new RuleYamlFormatter({
  minConfidence: 0.6,
  enableRedaction: true,
});

for (const pattern of patterns) {
  const yaml = await formatter.toYAML(pattern);
  console.log(yaml);
}
```

### 运行演示

```bash
# 运行模式识别演示
npm run demo:recognize

# 运行 YAML 格式化演示
npm run demo:yaml

# 运行端到端测试
npm test:e2e
```

## ✨ 功能特性

### 🎯 智能模式识别
- **多阶段识别算法**：关键词频率分析 → 文件类型聚类 → 模式匹配
- **置信度评分**：基于频率、成功率、适用性等多维度计算
- **实时分析**：支持增量式会话分析

### 🔒 安全与隐私
- **敏感信息脱敏**：自动识别并脱敏 API 密钥、文件路径等
- **数据保护**：支持自定义脱敏规则
- **隐私优先**：本地处理，无需上传数据

### 📊 高质量输出
- **REP v0.1 标准**：生成的规则符合 Rule Extraction Protocol
- **完整元数据**：包含版本、作者、许可证等信息
- **代码示例**：自动生成前后对比代码示例

### 🧪 全面测试覆盖
- **单元测试**：核心算法和功能测试
- **端到端测试**：完整流程验证
- **性能测试**：大规模数据处理验证

## 📋 使用场景

### 开发团队最佳实践提取
```typescript
// 从团队开发历史中提取最佳实践
const teamSessions = await loadTeamSessions();
const bestPractices = recognizer.recognizePatterns(teamSessions);
// 生成团队专属的最佳实践规则库
```

### 代码审查自动化
```typescript
// 自动化代码审查规则生成
const codeReviewSessions = await loadReviewSessions();
const reviewRules = recognizer.recognizePatterns(codeReviewSessions);
// 集成到 CI/CD 流水线
```

### 技术债务识别
```typescript
// 识别重复出现的代码问题
const bugFixSessions = await loadBugFixHistory();
const technicalDebtPatterns = recognizer.recognizePatterns(bugFixSessions);
// 生成技术债务修复指南
```

## ⚙️ 配置指南

### PatternRecognizer 配置

```typescript
const recognizer = new PatternRecognizer({
  // 最小置信度阈值 (0-1)
  minConfidence: 0.7,
  
  // 最小出现频率
  minFrequency: 2,
  
  // 最大模式数量
  maxPatterns: 10,
  
  // 自定义模式模板
  customTemplates: [
    // 你的自定义模式模板
  ],
  
  // 语言特定配置
  languageConfig: {
    typescript: {
      keywords: ['interface', 'type', 'async', 'await'],
      filePatterns: ['**/*.ts', '**/*.tsx']
    },
    python: {
      keywords: ['def', 'class', 'async', 'await'],
      filePatterns: ['**/*.py']
    }
  }
});
```

### RuleYamlFormatter 配置

```typescript
const formatter = new RuleYamlFormatter({
  // 最小置信度过滤
  minConfidence: 0.6,
  
  // 启用敏感信息脱敏
  enableRedaction: true,
  
  // 代码示例最大行数
  codeExampleMaxLines: 15,
  
  // 自定义脱敏规则
  redactionRules: [
    {
      pattern: /sk-\w+/g,
      replacement: '{api_key}'
    },
    {
      pattern: /\/Users\/\w+\/\w+/g,
      replacement: '{user_path}'
    }
  ],
  
  // YAML 格式化选项
  yamlOptions: {
    indent: 2,
    lineWidth: 80,
    quotingType: '"' as const
  }
});
```

## 📁 项目结构

```
packages/ruleforge/
├── src/                    # 源代码
│   ├── recognizer/         # 模式识别器
│   │   ├── pattern-recognizer.ts    # 核心识别算法
│   │   └── templates/      # 模式模板
│   │       ├── vue-patterns.ts      # Vue 模式模板
│   │       ├── fastapi-patterns.ts  # FastAPI 模式模板
│   │       └── test-patterns.ts     # 测试模式模板
│   └── types/              # 类型定义
│       └── pattern.ts      # 模式相关类型
├── __tests__/              # 测试文件
│   ├── e2e/                # 端到端测试
│   │   └── extraction-flow.test.ts  # 完整流程测试
│   └── pattern-recognizer.test.ts   # 单元测试
├── examples/               # 示例规则
│   ├── vue3-best-practices.yaml     # Vue 3 最佳实践
│   ├── fastapi-security.yaml        # FastAPI 安全规则
│   └── testing-patterns.yaml        # 测试最佳实践
├── demo/                   # 演示脚本
│   └── recognize-patterns.ts        # 模式识别演示
└── test-data/              # 测试数据
    └── sample-session.jsonl         # 示例会话数据
```

## 🧪 测试与质量

### 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm test:unit

# 运行端到端测试
npm test:e2e

# 运行测试并生成覆盖率报告
npm test:coverage

# 运行性能测试
npm test:performance
```

### 测试覆盖率

项目目标测试覆盖率 ≥80%，包括：
- 核心算法逻辑测试
- 边界条件测试
- 错误处理测试
- 性能基准测试

### 代码质量

```bash
# 代码检查
npm run lint

# 类型检查
npm run typecheck

# 代码格式化
npm run format
```

## 🔧 集成指南

### 与 NightShift 编辑器集成

```typescript
// 在 NightShift 编辑器中集成 RuleForge
import { RuleForgeIntegration } from './ruleforge-integration';

class NightShiftRuleForge {
  private ruleForge: RuleForgeIntegration;
  
  constructor() {
    this.ruleForge = new RuleForgeIntegration({
      // 配置选项
    });
  }
  
  async analyzeCurrentSession() {
    const session = this.getCurrentDevelopmentSession();
    const patterns = await this.ruleForge.analyze(session);
    return patterns;
  }
}
```

### 与 CI/CD 集成

```yaml
# .github/workflows/ruleforge.yml
name: RuleForge Analysis
on:
  schedule:
    - cron: '0 0 * * 1'  # 每周一运行
  workflow_dispatch:      # 手动触发

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run ruleforge:analyze
      - name: Upload Rules
        uses: actions/upload-artifact@v3
        with:
          name: ruleforge-rules
          path: generated-rules/
```

## 📚 示例规则

### Vue 3 最佳实践

查看 [examples/vue3-best-practices.yaml](./examples/vue3-best-practices.yaml)：
- Props 类型校验
- Composables 命名规范
- 响应式数据最佳实践
- 组件事件定义规范

### FastAPI 安全规则

查看 [examples/fastapi-security.yaml](./examples/fastapi-security.yaml)：
- JWT 认证实现
- 输入验证和序列化
- SQL 注入防护
- CORS 和安全头配置

### 测试最佳实践

查看 [examples/testing-patterns.yaml](./examples/testing-patterns.yaml)：
- 单元测试结构规范
- Mock 使用规范
- E2E 测试最佳实践
- 测试覆盖率和质量

## ❓ 常见问题

### Q: RuleForge 支持哪些编程语言？
A: 目前主要支持 TypeScript/JavaScript 和 Python，可通过自定义模板扩展支持其他语言。

### Q: 如何处理敏感信息？
A: RuleForge 内置敏感信息脱敏功能，可自动识别并替换 API 密钥、文件路径等敏感信息。

### Q: 置信度评分是如何计算的？
A: 置信度 = 出现频率 × 成功率 × 适用性，具体算法详见源代码文档。

### Q: 如何自定义模式模板？
A: 参考 `src/recognizer/templates/` 目录下的模板文件，创建自定义模板并配置到识别器中。

### Q: 生成的规则如何应用到实际项目？
A: 生成的 YAML 规则可以集成到代码审查工具、IDE 插件或 CI/CD 流水线中自动执行。

## 🤝 贡献指南

我们欢迎社区贡献！请参考以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/your-org/ruleforge.git
cd ruleforge

# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 运行测试
npm test
```

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🔗 相关项目

- [NightShift Editor](https://github.com/your-org/nightshift) - 智能代码编辑器
- [RuleForge Core](https://github.com/your-org/ruleforge-core) - 核心规则引擎
- [REP Specification](https://github.com/your-org/rep-spec) - 规则提取协议规范

## 📞 支持与反馈

- 📧 邮箱：support@ruleforge.dev
- 💬 讨论区：[GitHub Discussions](https://github.com/your-org/ruleforge/discussions)
- 🐛 问题报告：[GitHub Issues](https://github.com/your-org/ruleforge/issues)

---

**RuleForge** - 让代码模式识别变得简单而强大！ 🚀