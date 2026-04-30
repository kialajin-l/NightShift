# RuleForge 核心引擎

RuleForge 是 NightShift 项目的核心规则引擎，负责从开发会话中自动提取模式并生成可重用的代码规则。

## 🚀 核心功能

### 1. 模式识别引擎 (`PatternRecognizer`)
- **关键词频率统计**：分析会话中的高频关键词
- **文件类型聚类**：识别常用的文件类型和生成模式
- **错误模式识别**：检测重复出现的错误和解决方案
- **代码结构分析**：分析代码的组织结构和最佳实践

### 2. YAML 生成器 (`YAMLGenerator`)
- **REP v0.1 标准**：生成符合规则交换协议的 YAML 文件
- **自动脱敏**：清理代码中的敏感信息和项目路径
- **代码示例生成**：为每个规则生成实用的代码示例
- **Schema 验证**：确保生成的规则文件格式正确

## 📦 安装和使用

### 安装依赖
```bash
cd packages/core
npm install
```

### 基本用法
```typescript
import { PatternRecognizer, YAMLGenerator } from './src';

// 1. 创建模式识别器
const recognizer = new PatternRecognizer();

// 2. 添加会话日志
recognizer.addSessionLogs(sessionLogs);

// 3. 识别模式
const patterns = recognizer.recognizePatterns();

// 4. 生成 YAML 规则
const generator = new YAMLGenerator();
const yamlFiles = generator.generateRulesYAML(patterns.candidates);

// 5. 保存规则文件
for (const [filename, content] of Object.entries(yamlFiles)) {
  fs.writeFileSync(`rules/${filename}`, content);
}
```

## 🧪 测试

运行单元测试：
```bash
npm test
```

运行特定测试：
```bash
npm test pattern-recognizer.test.ts
npm test yaml-generator.test.ts
```

## 📚 示例规则

### 1. 登录功能规则 (`examples/login-rule.rule.yaml`)
- **触发条件**：用户提到"登录"关键词
- **生成内容**：React 登录组件 + FastAPI 登录接口
- **适用场景**：用户认证系统开发

### 2. 表单验证规则 (`examples/form-validation-rule.rule.yaml`)
- **触发条件**：用户需要表单验证功能
- **生成内容**：React 验证 Hook + Pydantic 数据模型
- **适用场景**：数据输入验证和校验

### 3. API CRUD 规则 (`examples/api-crud-rule.rule.yaml`)
- **触发条件**：用户需要 CRUD 操作
- **生成内容**：React CRUD Hook + FastAPI 路由
- **适用场景**：数据管理界面开发

## 🔧 配置选项

### PatternRecognizer 配置
```typescript
const recognizer = new PatternRecognizer();

// 设置最小出现次数（默认：3）
recognizer.setMinOccurrences(2);

// 设置最小置信度（默认：0.7）
recognizer.setMinConfidence(0.8);
```

### YAMLGenerator 配置
```typescript
const generator = new YAMLGenerator({
  autoSanitize: true,        // 自动清理敏感信息
  includeExamples: true,      // 包含代码示例
  maxExampleLines: 15,       // 最大代码行数
  validateSchema: true       // 验证 REP Schema
});
```

## 📊 数据模型

### SessionLog（会话日志）
```typescript
interface SessionLog {
  id: string;                    // 唯一标识
  userInput: string;            // 用户输入
  aiResponse: string;           // AI 响应
  timestamp: Date;              // 时间戳
  generatedFiles?: GeneratedFile[]; // 生成的文件
  errors?: string[];           // 错误信息
}
```

### RuleCandidate（规则候选）
```typescript
interface RuleCandidate {
  id: string;                    // 规则ID
  name: string;                  // 规则名称
  description: string;           // 规则描述
  confidence: number;           // 置信度
  frequency: number;            // 出现频率
  type: string;                 // 规则类型
  metadata: Record<string, any>; // 元数据
}
```

## 🔍 工作原理

### 1. 数据收集
- 监听开发会话
- 记录用户输入和 AI 响应
- 跟踪生成的文件和错误

### 2. 模式分析
- 统计关键词频率
- 聚类相似的文件类型
- 识别重复的错误模式
- 分析代码结构特征

### 3. 规则生成
- 根据置信度过滤候选规则
- 生成符合 REP 标准的 YAML
- 包含实用的代码示例
- 验证规则格式正确性

### 4. 规则应用
- 在后续开发中自动应用规则
- 提供代码模板和最佳实践
- 减少重复工作，提高效率

## 🎯 性能优化

### 内存优化
- 使用增量处理，避免内存泄漏
- 定期清理过期的会话日志
- 限制单个规则的文件大小

### 处理速度
- 支持批量处理大量会话日志
- 使用高效的算法进行模式识别
- 并行处理不同类型的模式分析

## 🔄 扩展性

### 添加新的模式类型
```typescript
// 1. 扩展 PatternRecognizer
class CustomPatternRecognizer extends PatternRecognizer {
  private analyzeCustomPattern(): CodePattern[] {
    // 实现自定义模式分析逻辑
  }
}

// 2. 扩展 YAMLGenerator
class CustomYAMLGenerator extends YAMLGenerator {
  private generateCustomTemplate(): string {
    // 实现自定义模板生成逻辑
  }
}
```

### 集成新的数据源
```typescript
// 集成外部数据源
recognizer.addExternalData(externalLogs);
```

## 📈 监控和日志

### 性能监控
```typescript
// 监控处理时间
const startTime = Date.now();
const result = recognizer.recognizePatterns();
const processingTime = Date.now() - startTime;

console.log(`处理了 ${result.totalSessions} 个会话，耗时 ${processingTime}ms`);
```

### 质量指标
- **规则置信度**：衡量规则的可信程度
- **模式覆盖率**：统计识别的模式类型
- **生成成功率**：跟踪规则生成的成功率

## 🤝 贡献指南

### 开发环境设置
1. 克隆项目
2. 安装依赖：`npm install`
3. 运行测试：`npm test`
4. 开始开发

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 Airbnb JavaScript 风格指南
- 编写完整的单元测试
- 添加详细的文档注释

### 提交规则
1. 在 `examples/` 目录添加示例规则
2. 更新 README 文档
3. 提交 Pull Request

## 📄 许可证

本项目采用 BUSL-1.1 许可证，仅限个人和学术使用。

## 🔗 相关链接

- [NightShift 主项目](../README.md)
- [REP v0.1 标准文档](./docs/rep-v0.1.md)
- [API 参考文档](./docs/api.md)

## 🆘 故障排除

### 常见问题

**Q: 规则生成失败怎么办？**
A: 检查会话日志格式是否正确，确保包含必要的字段。

**Q: YAML 文件验证失败？**
A: 使用 `validateSchema: false` 临时禁用验证，检查规则格式。

**Q: 处理速度慢？**
A: 考虑减少会话日志数量或调整识别参数。

### 获取帮助
- 查看示例规则文件
- 运行单元测试验证功能
- 提交 Issue 描述问题

---

**RuleForge - 让代码生成更智能，让开发更高效！** 🚀