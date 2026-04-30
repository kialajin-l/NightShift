# RuleForge YAML 生成器使用说明

## 📋 概述

RuleForge YAML 生成器是一个强大的工具，用于将代码模式转换为符合 REP v0.1 标准的 YAML 格式规则。它支持敏感信息脱敏、代码示例生成和完整的验证机制。

## 🚀 快速开始

### 安装依赖

```bash
cd packages/core
npm install
```

### 编译项目

```bash
npm run build
```

### 运行演示

```bash
# 运行详细演示
node dist/demo/yaml-demo.js

# 运行简单演示
node dist/demo/yaml-formatter-demo.js
```

### 运行测试

```bash
# 运行所有测试
npm test

# 只运行 YAML 格式化器测试
npm test -- --testNamePattern="RuleYamlFormatter"
```

## 🔧 使用方法

### 基本使用

```typescript
import { RuleYamlFormatter } from './src/formatter/yaml-formatter.js';
import { Pattern } from './src/types/rep-rule.js';

// 创建格式化器实例
const formatter = new RuleYamlFormatter();

// 定义模式
const pattern: Pattern = {
  id: 'vue-props-validation',
  category: 'code_style',
  trigger: {
    keywords: ['props', 'validation'],
    filePattern: '**/*.vue',
    frequency: 5,
  },
  solution: {
    description: 'Vue 组件应该使用 TypeScript interface 定义 props',
  },
  confidence: 0.9,
  applicableScenes: 3,
  evidence: ['类型安全', '代码可读性'],
  language: 'typescript',
};

// 生成 YAML
const yaml = await formatter.toYAML(pattern);
console.log(yaml);
```

### 自定义配置

```typescript
const customFormatter = new RuleYamlFormatter({
  minConfidence: 0.8,           // 最小置信度阈值
  enableRedaction: true,        // 启用敏感信息脱敏
  codeExampleMaxLines: 10,      // 代码示例最大行数
  includeTimestamps: true,      // 包含时间戳
  customValidators: [           // 自定义验证器
    (pattern) => ({
      success: pattern.id.startsWith('custom-'),
      errors: pattern.id.startsWith('custom-') ? [] : ['ID 必须以 custom- 开头'],
      warnings: [],
    })
  ],
});
```

## 📊 功能特性

### 1. REP v0.1 标准支持

生成的 YAML 符合 REP v0.1 标准，包含：

- **meta**: 元数据（ID、名称、版本、作者等）
- **rule**: 规则定义（触发条件、检查条件、建议）
- **compatibility**: 兼容性信息（框架、语言、协议版本）

### 2. 敏感信息脱敏

自动识别并脱敏以下敏感信息：

- API 密钥（`sk-...`）
- GitHub Token（`ghp_...`）
- 文件路径（用户目录）
- 邮箱地址
- IP 地址
- 数据库连接字符串

### 3. 智能代码示例生成

从会话数据中自动提取：

- **问题代码**（错误发生时的代码片段）
- **修复代码**（修复后的代码片段）
- **智能截断**（限制代码行数）

### 4. 完整验证机制

- **模式验证**: 验证输入模式的完整性
- **REP 验证**: 验证生成的 YAML 符合 REP v0.1 标准
- **自定义验证**: 支持自定义验证逻辑

## 🧪 测试覆盖

### 单元测试

测试文件：`packages/core/__tests__/yaml-formatter.test.ts`

包含以下测试场景：

- ✅ 构造函数和配置测试
- ✅ toYAML 方法功能测试
- ✅ 敏感信息脱敏测试
- ✅ 代码示例生成测试
- ✅ YAML 格式化测试
- ✅ 错误处理测试
- ✅ REP v0.1 Schema 验证测试
- ✅ 私有方法功能测试
- ✅ 完整模式转换测试

### 演示脚本

- **详细演示**: `packages/core/demo/yaml-demo.ts`
- **简单演示**: `packages/core/demo/yaml-formatter-demo.ts`

演示内容包括：

- Vue Props 验证规则
- FastAPI JWT 认证规则
- 测试最佳实践规则
- 敏感信息脱敏演示

## 🎯 输出示例

```yaml
meta:
  id: vue-props-validation
  name: 代码风格: props
  version: 1.0.0
  description: Vue 组件应该使用 TypeScript interface 定义 props
  authors:
    - RuleForge Auto-Generated
  license: MIT
  tags:
    - code_style
  created_at: "2026-01-20T10:00:00.000Z"
rule:
  trigger:
    keywords:
      - props
      - validation
    file_pattern: "**/*.vue"
    language: typescript
  condition: 代码中包含关键词: props, validation; 文件路径匹配: **/*.vue
  suggestion: Vue 组件应该使用 TypeScript interface 定义 props...
compatibility:
  frameworks:
    vue: ">=3.0.0"
  languages:
    typescript: ">=1.0.0"
  rep_version: "0.1"
```

## 🔍 错误处理

### 验证错误

当模式验证失败时，会抛出详细的错误信息：

```typescript
try {
  const yaml = await formatter.toYAML(invalidPattern);
} catch (error) {
  console.error('模式验证失败:', error.message);
  // 输出: 模式验证失败: ID 不能为空, 触发关键词不能为空
}
```

### REP 验证错误

当生成的 YAML 不符合 REP v0.1 标准时，会抛出验证错误：

```typescript
try {
  const yaml = await formatter.toYAML(pattern);
} catch (error) {
  console.error('REP 验证失败:', error.message);
  // 输出: REP v0.1 验证失败: meta.version: 版本号必须符合语义版本格式
}
```

## 📈 性能优化

### 代码示例截断

通过 `codeExampleMaxLines` 配置项控制代码示例的最大行数，避免生成过大的 YAML 文件。

### 敏感信息缓存

脱敏规则使用高效的正则表达式匹配，避免重复处理相同内容。

## 🔗 集成指南

### 与 RuleForge 模式识别引擎集成

```typescript
import { PatternRecognizer } from '@ruleforge/core';
import { RuleYamlFormatter } from './src/formatter/yaml-formatter.js';

// 识别模式
const recognizer = new PatternRecognizer();
const patterns = await recognizer.recognize(sessionData);

// 转换为 YAML
const formatter = new RuleYamlFormatter();
for (const pattern of patterns) {
  const yaml = await formatter.toYAML(pattern);
  // 保存或发送 YAML 规则
  await saveRuleToFile(pattern.id + '.yaml', yaml);
}
```

### 与 NightShift 编辑器集成

```typescript
// 在 VSCode 扩展中使用
import { RuleYamlFormatter } from './src/formatter/yaml-formatter.js';

// 响应编辑器事件
vscode.workspace.onDidSaveTextDocument(async (document) => {
  const pattern = extractPatternFromDocument(document);
  const yaml = await formatter.toYAML(pattern);
  
  // 在编辑器中显示规则
  vscode.window.showInformationMessage('规则已生成: ' + pattern.id);
});
```

## 🐛 故障排除

### 常见问题

1. **编译错误**: 确保 TypeScript 配置正确，依赖已安装
2. **测试失败**: 检查测试数据格式和导入路径
3. **YAML 格式错误**: 验证输入模式是否符合要求

### 调试技巧

```typescript
// 启用详细日志
const debugFormatter = new RuleYamlFormatter({
  // 添加自定义验证器进行调试
  customValidators: [
    (pattern) => {
      console.log('模式验证:', pattern.id);
      return { success: true, errors: [], warnings: [] };
    }
  ]
});
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

---

**RuleForge YAML 生成器** - 将代码智慧转化为可执行的规则！ 🚀