# 🎯 NightShift Vibe Coding 开发提示词

> **项目名称**：NightShift - AI原生编程工具  
> **技术栈**：Electron + Next.js + React + TypeScript + Tailwind CSS  
> **开发模式**：Vibe Coding - 描述需求，AI实现代码  
> **文档版本**：v3.0  

---

## 📋 目录

1. [Phase 1: UI 重新设计](#phase-1-ui-重新设计)
2. [Phase 2: RuleForge 核心](#phase-2-ruleforge-核心)
3. [Phase 3: 任务调度核心](#phase-3-任务调度核心)
4. [Phase 4: 多模型路由](#phase-4-多模型路由)
5. [Phase 5: 多 Agent 并发](#phase-5-多-agent-并发)
6. [Phase 6: 整合 + 记忆体](#phase-6-整合--记忆体)

---

## Phase 1: UI 重新设计

### Step 1.1: 设计系统建立
```markdown
# NightShift UI 设计系统建立

请为 NightShift AI 原生编程工具建立完整的设计系统。

## 项目背景
NightShift 是一个独立的 AI 原生编程工具，基于 Electron + Next.js 构建。需要重新设计 UI 布局，突出多 Agent 并发、任务计划、RuleForge 规则引擎等核心功能。

## 设计要求

### 设计风格
- **主题**：深色主题，专业编程工具风格
- **主色调**：#3B82F6（蓝色）- 代表智能和科技
- **背景色**：#0F172A（深空蓝）- 减少视觉疲劳
- **卡片背景**：#1E293B（深灰）- 突出内容
- **强调色**：#10B981（绿色）- 表示成功/完成
- **警告色**：#F59E0B（橙色）- 表示警告
- **错误色**：#EF4444（红色）- 表示错误

### 设计令牌
```css
/* 颜色系统 */
--color-primary: #3B82F6;
--color-primary-hover: #2563EB;
--color-primary-active: #1D4ED8;

--color-bg-primary: #0F172A;
--color-bg-secondary: #1E293B;
--color-bg-tertiary: #334155;

--color-text-primary: #F8FAFC;
--color-text-secondary: #CBD5E1;
--color-text-muted: #94A3B8;

--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;

/* 间距系统 */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;

/* 圆角系统 */
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;

/* 字体系统 */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
```

### 生成要求
1. 创建完整的 Tailwind CSS 配置
2. 生成 CSS 变量定义
3. 创建基础组件样式（按钮、输入框、卡片）
4. 提供响应式断点配置
5. 输出 Figma 兼容的设计规范

### 交付物
- `tailwind.config.js` 配置文件
- `src/styles/design-tokens.css` 设计令牌文件
- `src/styles/components.css` 基础组件样式
- 设计规范文档
```

### Step 1.2: 核心布局组件开发
```markdown
# NightShift 核心布局组件开发

请为 NightShift 开发核心布局组件，包括主布局、侧边栏、顶部工具栏。

## 组件需求

### 1. 主布局组件 (MainLayout)
```tsx
// 组件结构
interface MainLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  statusbar: React.ReactNode;
}

// 功能要求
- 响应式布局，支持折叠侧边栏
- 拖拽调整侧边栏宽度
- 深色主题支持
- 键盘快捷键支持（Ctrl+B 切换侧边栏）
```

### 2. 侧边栏组件 (Sidebar)
```tsx
// 组件结构
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  width: number;
  onWidthChange: (width: number) => void;
}

// 侧边栏内容
- 项目列表（可折叠）
- 任务计划面板（可折叠）
- Agent 状态面板（可折叠）
- 规则库面板（可折叠）
- 设置入口
```

### 3. 顶部工具栏组件 (TopBar)
```tsx
// 组件结构
interface TopBarProps {
  projectName: string;
  projectPath: string;
  onSearch: (query: string) => void;
  onSettings: () => void;
}

// 功能要求
- 搜索框（Ctrl+K 快捷键）
- 项目信息显示
- 全屏切换按钮
- 设置按钮
```

### 4. 底部状态栏组件 (StatusBar)
```tsx
// 组件结构
interface StatusBarProps {
  agents: AgentStatus[];
  tasks: TaskStatus[];
  modelInfo: ModelInfo;
}

// 显示内容
- Agent 状态概览
- 任务进度
- 当前模型信息
- 连接状态
```

## 技术要求
- 使用 TypeScript
- 使用 Tailwind CSS
- 支持深色主题
- 响应式设计
- 无障碍访问支持
- 键盘导航支持

## 生成要求
1. 生成完整的 React 组件代码
2. 包含 TypeScript 类型定义
3. 包含 Tailwind CSS 样式
4. 包含使用示例
5. 包含测试用例
```

### Step 1.3: 任务计划面板开发
```markdown
# NightShift 任务计划面板开发

请为 NightShift 开发任务计划面板组件，显示任务 DAG、进度、状态。

## 组件需求

### 任务计划面板 (TaskPlanPanel)
```tsx
// 组件结构
interface TaskPlanPanelProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
  onTaskReorder: (taskId: string, newIndex: number) => void;
}

// 任务数据结构
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  dependencies: string[];
  assignedAgent: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}
```

### 功能要求
1. **任务列表显示**
   - 树形结构显示任务依赖
   - 状态图标（待处理、运行中、完成、失败）
   - 进度条显示
   - 优先级标识

2. **任务操作**
   - 点击任务查看详情
   - 拖拽调整优先级
   - 右键菜单（重新开始、跳过、删除）

3. **进度追踪**
   - 总体进度条
   - 完成任务计数
   - 预计剩余时间

4. **可视化**
   - DAG 图可视化（可选）
   - 任务依赖线
   - 关键路径高亮

## 技术要求
- 使用 TypeScript
- 使用 Tailwind CSS
- 支持虚拟滚动（大量任务）
- 支持拖拽排序
- 响应式设计

## 生成要求
1. 生成完整的 React 组件代码
2. 包含 TypeScript 类型定义
3. 包含 Tailwind CSS 样式
4. 包含 Mock 数据
5. 包含交互逻辑
6. 包含测试用例
```

### Step 1.4: Agent 状态面板开发
```markdown
# NightShift Agent 状态面板开发

请为 NightShift 开发 Agent 状态面板组件，显示所有 Agent 的实时状态。

## 组件需求

### Agent 状态面板 (AgentStatusPanel)
```tsx
// 组件结构
interface AgentStatusPanelProps {
  agents: AgentStatus[];
  onAgentSelect: (agent: AgentStatus) => void;
  onAgentStop: (agentId: string) => void;
}

// Agent 状态数据结构
interface AgentStatus {
  id: string;
  name: string;
  role: 'scheduler' | 'frontend' | 'backend' | 'tester';
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentTask: string | null;
  progress: number;
  model: string;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  startTime: Date | null;
  estimatedCompletion: Date | null;
}
```

### 功能要求
1. **Agent 状态显示**
   - 角色图标（调度、前端、后端、测试）
   - 状态指示器（空闲、运行中、完成、失败）
   - 当前任务显示
   - 进度条

2. **性能指标**
   - Token 使用量统计
   - 响应时间
   - 成功率

3. **操作功能**
   - 点击查看详情
   - 强制停止任务
   - 重启 Agent

4. **实时更新**
   - WebSocket 实时状态更新
   - 动画过渡效果
   - 状态变化通知

## 技术要求
- 使用 TypeScript
- 使用 Tailwind CSS
- 支持 WebSocket 实时更新
- 支持动画效果
- 响应式设计

## 生成要求
1. 生成完整的 React 组件代码
2. 包含 TypeScript 类型定义
3. 包含 Tailwind CSS 样式
4. 包含 Mock 数据
5. 包含 WebSocket 连接逻辑
6. 包含测试用例
```

---

## Phase 2: RuleForge 核心

### Step 2.1: 会话日志解析器
```markdown
# NightShift RuleForge 会话日志解析器

请为 NightShift 开发 RuleForge 引擎的会话日志解析器。

## 功能需求

### 会话日志解析器 (ConversationLogParser)
```typescript
// 数据结构
interface ConversationLog {
  id: string;
  timestamp: Date;
  messages: Message[];
  metadata: {
    projectId: string;
    userId: string;
    sessionId: string;
  };
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    toolCalls?: ToolCall[];
    codeBlocks?: CodeBlock[];
    errors?: Error[];
  };
}

interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
  changes?: CodeChange[];
}

interface CodeChange {
  type: 'add' | 'modify' | 'delete';
  lineNumber: number;
  content: string;
}
```

### 解析功能
1. **消息分类**
   - 用户指令
   - AI 响应
   - 代码生成
   - 错误信息

2. **代码块提取**
   - 识别代码块
   - 提取语言类型
   - 解析文件名
   - 分析代码变更

3. **模式识别**
   - 重复出现的指令
   - 常见错误模式
   - 用户偏好

### 技术要求
- 使用 TypeScript
- 支持多种日志格式
- 高性能解析
- 错误处理
- 单元测试

## 生成要求
1. 生成完整的解析器代码
2. 包含 TypeScript 类型定义
3. 包含测试用例
4. 包含使用示例
5. 包含性能优化建议
```

### Step 2.2: 模式识别引擎
```markdown
# NightShift RuleForge 模式识别引擎

请为 NightShift 开发 RuleForge 引擎的模式识别引擎。

## 功能需求

### 模式识别引擎 (PatternRecognitionEngine)
```typescript
// 数据结构
interface Pattern {
  id: string;
  type: 'code-style' | 'architecture' | 'best-practice' | 'error-pattern';
  description: string;
  examples: PatternExample[];
  confidence: number;
  frequency: number;
  firstSeen: Date;
  lastSeen: Date;
}

interface PatternExample {
  context: string;
  code: string;
  explanation: string;
  source: 'conversation' | 'user-feedback' | 'auto-detected';
}

// 识别功能
interface PatternRecognitionEngine {
  // 分析对话，识别模式
  analyzeConversation(log: ConversationLog): Promise<Pattern[]>;
  
  // 检测代码风格
  detectCodeStyle(codeBlocks: CodeBlock[]): CodeStylePattern[];
  
  // 检测架构模式
  detectArchitecture(codeBlocks: CodeBlock[]): ArchitecturePattern[];
  
  // 检测最佳实践
  detectBestPractices(codeBlocks: CodeBlock[]): BestPracticePattern[];
  
  // 检测错误模式
  detectErrorPatterns(errors: Error[]): ErrorPattern[];
  
  // 计算置信度
  calculateConfidence(pattern: Pattern): number;
}
```

### 识别算法
1. **代码风格分析**
   - 命名规范检测
   - 缩进风格检测
   - 注释风格检测
   - 导入顺序检测

2. **架构模式分析**
   - 组件化模式
   - 状态管理模式
   - 路由模式
   - API 调用模式

3. **最佳实践分析**
   - 错误处理模式
   - 性能优化模式
   - 安全实践模式
   - 测试模式

4. **错误模式分析**
   - 常见错误类型
   - 错误解决方案
   - 错误预防措施

### 技术要求
- 使用 TypeScript
- 机器学习算法（可选）
- 高性能处理
- 可配置阈值
- 单元测试

## 生成要求
1. 生成完整的模式识别引擎代码
2. 包含 TypeScript 类型定义
3. 包含识别算法实现
4. 包含测试用例
5. 包含配置选项
```

### Step 2.3: YAML 生成器
```markdown
# NightShift RuleForge YAML 生成器

请为 NightShift 开发 RuleForge 引擎的 YAML 生成器。

## 功能需求

### YAML 生成器 (YAMLGenerator)
```typescript
// 数据结构
interface RuleYAML {
  rule: {
    id: string;
    name: string;
    description: string;
    type: 'code-style' | 'architecture' | 'best-practice' | 'error-pattern';
    pattern: string | RegExp;
    replacement?: string;
    examples: RuleExample[];
    confidence: number;
    source: string;
    tags: string[];
    metadata: {
      createdAt: Date;
      updatedAt: Date;
      version: string;
      author: string;
    };
  };
}

interface RuleExample {
  before: string;
  after: string;
  explanation: string;
}

// 生成功能
interface YAMLGenerator {
  // 从模式生成规则 YAML
  generateRuleYAML(pattern: Pattern): RuleYAML;
  
  // 批量生成规则
  generateRulesYAML(patterns: Pattern[]): RuleYAML[];
  
  // 验证 YAML 格式
  validateRuleYAML(yaml: RuleYAML): ValidationResult;
  
  // 序列化为 YAML 字符串
  serializeToYAML(rule: RuleYAML): string;
  
  // 从 YAML 反序列化
  deserializeFromYAML(yamlString: string): RuleYAML;
}
```

### YAML 格式规范
```yaml
rule:
  id: "code-style-001"
  name: "驼峰命名法"
  description: "变量和函数使用驼峰命名法，类名使用 PascalCase"
  type: "code-style"
  pattern: "(snake_case|kebab-case)"
  replacement: "camelCase"
  examples:
    - before: "user_name"
      after: "userName"
      explanation: "变量名使用驼峰命名法"
    - before: "get-user-data"
      after: "getUserData"
      explanation: "函数名使用驼峰命名法"
  confidence: 0.95
  source: "conversation-2024-04-24"
  tags: ["code-style", "naming", "javascript"]
  metadata:
    createdAt: "2024-04-24T10:00:00Z"
    updatedAt: "2024-04-24T10:00:00Z"
    version: "1.0.0"
    author: "RuleForge"
```

### 技术要求
- 使用 TypeScript
- 支持 YAML 序列化/反序列化
- 支持验证
- 支持批量处理
- 单元测试

## 生成要求
1. 生成完整的 YAML 生成器代码
2. 包含 TypeScript 类型定义
3. 包含 YAML 序列化逻辑
4. 包含验证逻辑
5. 包含测试用例
6. 包含使用示例
```

---

## Phase 3: 任务调度核心

### Step 3.1: 调度 Agent 开发
```markdown
# NightShift 调度 Agent 开发

请为 NightShift 开发调度 Agent，负责任务拆解、分配、监控。

## 功能需求

### 调度 Agent (SchedulerAgent)
```typescript
// 数据结构
interface SchedulerAgent {
  id: string;
  name: string;
  role: 'scheduler';
  model: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  
  // 核心功能
  decomposeRequirement(requirement: string): Promise<TaskDAG>;
  assignTasks(dag: TaskDAG): Promise<TaskAssignment[]>;
  monitorProgress(): Promise<ProgressReport>;
  generateReport(): Promise<ExecutionReport>;
}

interface TaskDAG {
  id: string;
  requirement: string;
  tasks: Task[];
  dependencies: TaskDependency[];
  estimatedTime: number;
  complexity: 'low' | 'medium' | 'high';
}

interface Task {
  id: string;
  title: string;
  description: string;
  type: 'frontend' | 'backend' | 'testing' | 'documentation';
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
  requirements: string[];
  acceptanceCriteria: string[];
}

interface TaskDependency {
  from: string;
  to: string;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish';
}
```

### 调度算法
1. **任务拆解**
   - 使用 LLM 分析需求
   - 识别任务类型
   - 确定任务优先级
   - 估算时间

2. **依赖分析**
   - 识别任务依赖关系
   - 构建 DAG 图
   - 确定关键路径

3. **资源分配**
   - 根据任务类型分配 Agent
   - 考虑 Agent 能力
   - 负载均衡

4. **进度监控**
   - 实时跟踪任务状态
   - 预测完成时间
   - 异常处理

### 技术要求
- 使用 TypeScript
- 集成 LLM API
- 支持 WebSocket 通信
- 支持并发处理
- 单元测试

## 生成要求
1. 生成完整的调度 Agent 代码
2. 包含 TypeScript 类型定义
3. 包含调度算法实现
4. 包含 LLM 集成
5. 包含测试用例
6. 包含使用示例
```

### Step 3.2: 任务管理器
```markdown
# NightShift 任务管理器开发

请为 NightShift 开发任务管理器，负责任务的创建、更新、删除、查询。

## 功能需求

### 任务管理器 (TaskManager)
```typescript
// 数据结构
interface TaskManager {
  // 任务 CRUD 操作
  createTask(task: CreateTaskRequest): Promise<Task>;
  getTask(taskId: string): Promise<Task>;
  updateTask(taskId: string, updates: UpdateTaskRequest): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
  
  // 任务查询
  listTasks(filters?: TaskFilters): Promise<Task[]>;
  getTasksByStatus(status: TaskStatus): Promise<Task[]>;
  getTasksByAgent(agentId: string): Promise<Task[]>;
  
  // 任务状态管理
  startTask(taskId: string): Promise<Task>;
  completeTask(taskId: string, result: TaskResult): Promise<Task>;
  failTask(taskId: string, error: Error): Promise<Task>;
  
  // 依赖管理
  addDependency(fromTaskId: string, toTaskId: string): Promise<void>;
  removeDependency(fromTaskId: string, toTaskId: string): Promise<void>;
  getDependencies(taskId: string): Promise<TaskDependency[]>;
}

interface CreateTaskRequest {
  title: string;
  description: string;
  type: 'frontend' | 'backend' | 'testing' | 'documentation';
  priority: 'low' | 'medium' | 'high';
  requirements: string[];
  acceptanceCriteria: string[];
  dependencies?: string[];
  assignedAgent?: string;
}

interface TaskFilters {
  status?: TaskStatus;
  type?: string;
  priority?: string;
  assignedAgent?: string;
  createdAt?: {
    from: Date;
    to: Date;
  };
}
```

### 存储方案
1. **SQLite 数据库**
   - 任务表
   - 依赖表
   - 状态历史表

2. **内存缓存**
   - 热点任务缓存
   - 依赖关系缓存

3. **文件存储**
   - 任务结果文件
   - 日志文件

### 技术要求
- 使用 TypeScript
- 使用 SQLite
- 支持事务
- 支持并发访问
- 单元测试

## 生成要求
1. 生成完整的任务管理器代码
2. 包含 TypeScript 类型定义
3. 包含数据库操作
4. 包含缓存逻辑
5. 包含测试用例
6. 包含使用示例
```

---

## Phase 4: 多模型路由

### Step 4.1: 任务分析器
```markdown
# NightShift 任务分析器开发

请为 NightShift 开发任务分析器，分析任务类型和复杂度。

## 功能需求

### 任务分析器 (TaskAnalyzer)
```typescript
// 数据结构
interface TaskAnalyzer {
  analyzeTask(task: Task): Promise<TaskAnalysis>;
  analyzeComplexity(task: Task): Promise<ComplexityAnalysis>;
  analyzeRequirements(task: Task): Promise<RequirementsAnalysis>;
}

interface TaskAnalysis {
  taskId: string;
  type: TaskType;
  complexity: ComplexityLevel;
  requirements: string[];
  skills: string[];
  estimatedTime: number;
  confidence: number;
}

interface ComplexityAnalysis {
  level: 'low' | 'medium' | 'high' | 'very-high';
  score: number; // 0-100
  factors: ComplexityFactor[];
  reasoning: string;
}

interface ComplexityFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

type TaskType = 
  | 'code-generation'
  | 'code-review'
  | 'debugging'
  | 'refactoring'
  | 'testing'
  | 'documentation'
  | 'architecture'
  | 'simple-edit';
```

### 分析算法
1. **任务类型识别**
   - 关键词分析
   - 语义分析
   - 历史模式匹配

2. **复杂度评估**
   - 代码行数估算
   - 依赖关系分析
   - 技术栈复杂度
   - 集成复杂度

3. **技能需求分析**
   - 编程语言需求
   - 框架需求
   - 工具需求
   - 领域知识需求

### 技术要求
- 使用 TypeScript
- 集成 LLM API
- 支持缓存
- 高性能
- 单元测试

## 生成要求
1. 生成完整的任务分析器代码
2. 包含 TypeScript 类型定义
3. 包含分析算法实现
4. 包含 LLM 集成
5. 包含测试用例
6. 包含使用示例
```

### Step 4.2: 模型选择器
```markdown
# NightShift 模型选择器开发

请为 NightShift 开发模型选择器，根据任务类型选择最佳模型。

## 功能需求

### 模型选择器 (ModelSelector)
```typescript
// 数据结构
interface ModelSelector {
  selectModel(taskAnalysis: TaskAnalysis): Promise<ModelSelection>;
  getAvailableModels(): Promise<Model[]>;
  getModelInfo(modelId: string): Promise<ModelInfo>;
  updateModelPerformance(modelId: string, metrics: PerformanceMetrics): Promise<void>;
}

interface ModelSelection {
  modelId: string;
  model: Model;
  reason: string;
  confidence: number;
  fallbackModels: string[];
}

interface Model {
  id: string;
  name: string;
  provider: 'ollama' | 'openai' | 'anthropic' | 'openrouter';
  capabilities: ModelCapability[];
  pricing: ModelPricing;
  performance: ModelPerformance;
  status: 'available' | 'unavailable' | 'rate-limited';
}

interface ModelCapability {
  type: 'code-generation' | 'code-review' | 'debugging' | 'architecture';
  score: number; // 0-100
  maxTokens: number;
  supportedLanguages: string[];
}

interface ModelPerformance {
  averageResponseTime: number;
  successRate: number;
  tokenEfficiency: number;
  lastUpdated: Date;
}
```

### 选择策略
1. **基于任务类型**
   - 代码生成：qwen-coder, deepseek-coder
   - 架构设计：glm-5, kimi-k2.5
   - 简单编辑：本地模型

2. **基于复杂度**
   - 低复杂度：本地模型
   - 中复杂度：云端代码模型
   - 高复杂度：云端架构模型

3. **基于成本**
   - 优先本地模型
   - 云端模型按价格排序
   - 考虑用户预算

4. **基于可用性**
   - 检查模型状态
   - 处理限流
   - 自动降级

### 技术要求
- 使用 TypeScript
- 支持多提供商
- 支持性能监控
- 支持动态更新
- 单元测试

## 生成要求
1. 生成完整的模型选择器代码
2. 包含 TypeScript 类型定义
3. 包含选择策略实现
4. 包含性能监控
5. 包含测试用例
6. 包含使用示例
```

---

## Phase 5: 多 Agent 并发

### Step 5.1: Agent 角色实现
```markdown
# NightShift Agent 角色实现

请为 NightShift 实现各种 Agent 角色，包括前端、后端、测试 Agent。

## 功能需求

### 前端 Agent (FrontendAgent)
```typescript
interface FrontendAgent {
  id: string;
  name: string;
  role: 'frontend';
  capabilities: AgentCapability[];
  skills: string[];
  
  // 核心功能
  executeTask(task: Task): Promise<TaskResult>;
  generateComponent(spec: ComponentSpec): Promise<ComponentCode>;
  applyStyle(component: Component, style: StyleSpec): Promise<Component>;
  runTests(component: Component): Promise<TestResult>;
}

interface ComponentSpec {
  name: string;
  props: PropSpec[];
  events: EventSpec[];
  styles: StyleSpec[];
  requirements: string[];
}

interface ComponentCode {
  jsx: string;
  css: string;
  types: string;
  tests: string;
  documentation: string;
}
```

### 后端 Agent (BackendAgent)
```typescript
interface BackendAgent {
  id: string;
  name: string;
  role: 'backend';
  capabilities: AgentCapability[];
  skills: string[];
  
  // 核心功能
  executeTask(task: Task): Promise<TaskResult>;
  generateAPI(spec: APISpec): Promise<APICode>;
  generateDatabase(schema: DatabaseSchema): Promise<DatabaseCode>;
  runTests(api: APICode): Promise<TestResult>;
}

interface APISpec {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  parameters: ParameterSpec[];
  response: ResponseSpec;
  authentication: boolean;
}
```

### 测试 Agent (TesterAgent)
```typescript
interface TesterAgent {
  id: string;
  name: string;
  role: 'tester';
  capabilities: AgentCapability[];
  skills: string[];
  
  // 核心功能
  executeTask(task: Task): Promise<TaskResult>;
  generateTests(code: Code): Promise<TestSuite>;
  runTests(tests: TestSuite): Promise<TestResult>;
  generateReport(results: TestResult[]): Promise<TestReport>;
}

interface TestSuite {
  unitTests: UnitTest[];
  integrationTests: IntegrationTest[];
  e2eTests: E2ETest[];
  coverage: CoverageReport;
}
```

### 技术要求
- 使用 TypeScript
- 支持技能系统
- 支持规则注入
- 支持并发执行
- 单元测试

## 生成要求
1. 生成完整的 Agent 角色代码
2. 包含 TypeScript 类型定义
3. 包含技能系统
4. 包含测试用例
5. 包含使用示例
```

### Step 5.2: Level1 通信协议
```markdown
# NightShift Level1 通信协议开发

请为 NightShift 开发 Level1 通信协议，实现 0 token 的结构化数据交换。

## 功能需求

### Level1 通信协议 (Level1Protocol)
```typescript
// 数据结构
interface Level1Protocol {
  // 连接管理
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // 消息发送
  sendMessage(message: Level1Message): Promise<void>;
  sendRequest(request: Level1Request): Promise<Level1Response>;
  
  // 消息接收
  onMessage(handler: MessageHandler): void;
  onRequest(handler: RequestHandler): void;
  
  // 心跳检测
  startHeartbeat(interval: number): void;
  stopHeartbeat(): void;
}

interface Level1Message {
  jsonrpc: '2.0';
  method: string;
  params: Record<string, any>;
  id?: string | number;
}

interface Level1Request extends Level1Message {
  id: string | number;
}

interface Level1Response {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: Level1Error;
}

interface Level1Error {
  code: number;
  message: string;
  data?: any;
}

// 预定义方法
type Level1Method = 
  | 'task.assign'
  | 'task.update'
  | 'task.complete'
  | 'task.fail'
  | 'agent.status'
  | 'agent.register'
  | 'agent.unregister'
  | 'rule.apply'
  | 'rule.update'
  | 'heartbeat';
```

### 消息类型
1. **任务相关**
   - `task.assign`: 分配任务
   - `task.update`: 更新任务状态
   - `task.complete`: 完成任务
   - `task.fail`: 任务失败

2. **Agent 相关**
   - `agent.status`: Agent 状态更新
   - `agent.register`: 注册 Agent
   - `agent.unregister`: 注销 Agent

3. **规则相关**
   - `rule.apply`: 应用规则
   - `rule.update`: 更新规则

4. **系统相关**
   - `heartbeat`: 心跳检测

### 技术要求
- 使用 TypeScript
- 使用 WebSocket
- 支持 JSON-RPC 2.0
- 支持错误处理
- 支持重连机制
- 单元测试

## 生成要求
1. 生成完整的 Level1 通信协议代码
2. 包含 TypeScript 类型定义
3. 包含 WebSocket 实现
4. 包含错误处理
5. 包含测试用例
6. 包含使用示例
```

---

## Phase 6: 整合 + 记忆体

### Step 6.1: 记忆体系统开发
```markdown
# NightShift 记忆体系统开发

请为 NightShift 开发改进的记忆体系统，实现实时学习和知识传递。

## 功能需求

### 记忆体系统 (MemorySystem)
```typescript
// 数据结构
interface MemorySystem {
  // 对话记录
  logger: ConversationLogger;
  // 习惯学习
  learner: HabitLearner;
  // 知识传递
  transfer: KnowledgeTransfer;
  // 记忆库
  store: MemoryStore;
}

interface ConversationLogger {
  logMessage(message: Message): Promise<void>;
  logCodeChange(change: CodeChange): Promise<void>;
  logError(error: Error): Promise<void>;
  getConversationHistory(filters?: LogFilters): Promise<LogEntry[]>;
}

interface HabitLearner {
  analyzeHabits(logs: LogEntry[]): Promise<UserHabit[]>;
  updateHabitProfile(habits: UserHabit[]): Promise<void>;
  getHabitProfile(): Promise<HabitProfile>;
  predictPreferences(context: TaskContext): Promise<PreferencePrediction[]>;
}

interface KnowledgeTransfer {
  extractKnowledge(logs: LogEntry[]): Promise<Knowledge[]>;
  transferKnowledge(task: Task, agent: Agent): Promise<KnowledgeContext>;
  updateKnowledgeBase(knowledge: Knowledge[]): Promise<void>;
  searchKnowledge(query: string): Promise<Knowledge[]>;
}

interface MemoryStore {
  // 短期记忆
  shortTerm: ShortTermMemory;
  // 长期记忆
  longTerm: LongTermMemory;
  // 工作记忆
  working: WorkingMemory;
}
```

### 学习算法
1. **习惯识别**
   - 代码风格偏好
   - 命名规范偏好
   - 架构模式偏好
   - 工具使用偏好

2. **知识提取**
   - 成功模式提取
   - 错误模式提取
   - 最佳实践提取
   - 领域知识提取

3. **知识传递**
   - 任务相关知识注入
   - Agent 能力匹配
   - 上下文优化

### 技术要求
- 使用 TypeScript
- 使用 SQLite
- 支持向量搜索
- 支持实时学习
- 单元测试

## 生成要求
1. 生成完整的记忆体系统代码
2. 包含 TypeScript 类型定义
3. 包含学习算法实现
4. 包含数据库操作
5. 包含测试用例
6. 包含使用示例
```

### Step 6.2: 端到端联调
```markdown
# NightShift 端到端联调

请为 NightShift 进行端到端联调，确保所有模块正常工作。

## 联调任务

### 1. UI 与后端联调
```typescript
// 测试场景
describe('UI-Backend Integration', () => {
  test('任务计划面板显示正确', async () => {
    // 1. 创建任务
    const task = await taskManager.createTask({
      title: '创建登录页面',
      description: '使用 Vue3 和 Tailwind CSS 创建登录页面',
      type: 'frontend',
      priority: 'high'
    });
    
    // 2. 验证 UI 显示
    const panel = render(<TaskPlanPanel tasks={[task]} />);
    expect(panel.getByText('创建登录页面')).toBeInTheDocument();
    expect(panel.getByText('待处理')).toBeInTheDocument();
  });
  
  test('Agent 状态实时更新', async () => {
    // 1. 启动 Agent
    await agent.start();
    
    // 2. 验证状态更新
    const statusPanel = render(<AgentStatusPanel agents={[agent]} />);
    expect(statusPanel.getByText('运行中')).toBeInTheDocument();
  });
});
```

### 2. 多 Agent 并发测试
```typescript
describe('Multi-Agent Concurrency', () => {
  test('前端和后端 Agent 并发执行', async () => {
    // 1. 创建任务 DAG
    const dag = await scheduler.decomposeRequirement('创建登录功能');
    
    // 2. 分配任务
    const assignments = await scheduler.assignTasks(dag);
    
    // 3. 并发执行
    const results = await Promise.all([
      frontendAgent.executeTask(assignments.frontend),
      backendAgent.executeTask(assignments.backend)
    ]);
    
    // 4. 验证结果
    expect(results[0].status).toBe('completed');
    expect(results[1].status).toBe('completed');
  });
});
```

### 3. RuleForge 集成测试
```typescript
describe('RuleForge Integration', () => {
  test('规则提取和应用', async () => {
    // 1. 模拟对话
    const conversation = mockConversation([
      { role: 'user', content: '使用驼峰命名法' },
      { role: 'assistant', content: '好的，我会使用驼峰命名法' }
    ]);
    
    // 2. 提取规则
    const patterns = await patternEngine.analyzeConversation(conversation);
    const rule = yamlGenerator.generateRuleYAML(patterns[0]);
    
    // 3. 应用规则
    const code = 'user_name';
    const fixed = ruleInjector.applyRule(code, rule);
    
    expect(fixed).toBe('userName');
  });
});
```

### 4. 模型路由测试
```typescript
describe('Model Routing', () => {
  test('根据任务类型选择模型', async () => {
    // 1. 分析任务
    const analysis = await taskAnalyzer.analyzeTask({
      type: 'code-generation',
      complexity: 'medium'
    });
    
    // 2. 选择模型
    const selection = await modelSelector.selectModel(analysis);
    
    expect(selection.model.provider).toBe('ollama');
    expect(selection.model.name).toContain('coder');
  });
});
```

### 技术要求
- 使用 Jest
- 使用 React Testing Library
- 支持 WebSocket 测试
- 支持数据库测试
- 支持并发测试

## 生成要求
1. 生成完整的端到端测试代码
2. 包含测试用例
3. 包含 Mock 数据
4. 包含测试工具
5. 包含测试报告
```

---

## 📋 使用说明

### 1. 提示词使用流程
1. 按 Phase 顺序执行
2. 每个 Step 复制对应提示词
3. 粘贴到 AI IDE（Cursor/Codex/Trae）
4. 生成代码并测试
5. 完成后继续下一个 Step

### 2. 开发顺序建议
1. **Phase 1**: UI 重新设计（1 周）
2. **Phase 2**: RuleForge 核心（1 周）
3. **Phase 3**: 任务调度核心（1 周）
4. **Phase 4**: 多模型路由（1 周）
5. **Phase 5**: 多 Agent 并发（1 周）
6. **Phase 6**: 整合 + 记忆体（1 周）

### 3. 注意事项
- 每个 Step 生成后立即测试
- 保持代码模块化
- 遵循 TypeScript 严格模式
- 使用 Tailwind CSS 设计系统
- 编写单元测试

---

**文档结束** · NightShift Vibe Coding 提示词 · v3.0