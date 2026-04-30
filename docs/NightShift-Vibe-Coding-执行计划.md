# NightShift 功能补全 — Vibe Coding 执行计划

> 按优先级排列，每个阶段独立可交付。AI Agent 按顺序逐步执行即可。
> 项目根目录：`E:/code/NightShift`
> 最后更新：2026-04-25

---

## 全局约定

### 技术栈
- Next.js 14 + TypeScript + Tailwind CSS
- 数据库：SQLite（better-sqlite3）
- 实时通信：Socket.IO（非原生 WebSocket）
- 状态管理：React Context + Zustand（轻量）

### 代码位置
- 主应用代码：`src/lib/`、`src/app/`、`src/components/`
- Agent 包：`packages/agents/src/`
- 类型定义：`packages/agents/src/types/agent.ts`（已有完整类型，不要修改）
- RuleForge：`packages/ruleforge/src/`（从独立项目复制）

### 关键决策（已确认）
1. **LLM 协议**：OpenAI 兼容协议 + 自定义第三方渠道（中转站），base URL + API Key 可配置
2. **实时通信**：Socket.IO（自动重连、事件机制、Room 概念）
3. **RuleForge 引入**：复制代码到 `packages/ruleforge/`（不用 npm link）
4. **Mock 模式**：保留作为 fallback，环境变量 `USE_MOCK=true` 切换

### v2.0 预留接口（v1.0 不实现，但类型/接口要兼容）
- 动态模型调度：主脑可按任务复杂度切换 Agent 绑定的模型
- 三层通信架构：主脑↔知识缓存层↔Agent
- 知识链系统：Obsidian Markdown 格式的记忆体
- 顾问系统：集成免费对话助手辅助编程

### 执行规则
- 不要删除现有文件，只替换 Mock 实现为真实实现
- 每个 Step 结束后运行 `npm run build` 验证编译通过
- 每个 Phase 完成后手动测试核心功能再进入下一个

---

## Phase 1：LLM 调用层 + AI 任务拆解（替换 MockTaskDecomposer）

> **目标**：建立统一的 LLM 调用能力，让 0 号调度 Agent 能真正理解需求并拆解任务
> **优先级**：🔴 最高 — 整个系统的"大脑"
> **预计耗时**：2-3 天

---

### Step 1.1：创建 LLM 调用封装层

**目的**：提供统一的 LLM 调用接口，所有模块复用。

**创建文件**：`src/lib/llm-client.ts`

**核心接口**：

```typescript
interface LLMClient {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string>;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  model?: string;              // 覆盖默认模型
  temperature?: number;        // 默认 0.7
  maxTokens?: number;          // 默认 4096
  responseFormat?: 'json' | 'text';
  timeout?: number;            // 超时毫秒数，默认 60000
}

interface ChatResponse {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: string;
}
```

**实现要点**：

1. **多渠道支持**：构造函数接受 `LLMConfig`，每个渠道一个 config：

```typescript
interface LLMConfig {
  name: string;              // 渠道名，如 "openrouter"、"中转站A"
  baseUrl: string;           // API 地址
  apiKey: string;            // 密钥
  defaultModel: string;      // 该渠道的默认模型
  protocol: 'openai';        // v1.0 只支持 OpenAI 兼容协议
  headers?: Record<string, string>;  // 自定义请求头（某些中转站需要）
}
```

2. **环境变量配置**（`.env.local`）：

```bash
# 主渠道
LLM_PRIMARY_BASE_URL=https://openrouter.ai/api/v1
LLM_PRIMARY_API_KEY=sk-or-xxx
LLM_PRIMARY_DEFAULT_MODEL=anthropic/claude-sonnet-4

# 备用渠道（可选）
LLM_SECONDARY_BASE_URL=https://your-proxy.com/v1
LLM_SECONDARY_API_KEY=sk-xxx
LLM_SECONDARY_DEFAULT_MODEL=gpt-4o

# Agent 专用模型覆盖（可选）
MODEL_FRONTEND=anthropic/claude-sonnet-4
MODEL_BACKEND=openai/gpt-4o
MODEL_SCHEDULER=anthropic/claude-sonnet-4
```

3. **chat() 方法实现**：

```typescript
async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
  const config = this.selectConfig(options?.model);
  const model = options?.model || config.defaultModel;
  
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...config.headers
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      response_format: options?.responseFormat === 'json' 
        ? { type: 'json_object' } 
        : undefined
    }),
    signal: AbortSignal.timeout(options?.timeout ?? 60000)
  });
  
  // 错误处理：429 限流等待重试，5xx 重试，4xx 抛出
  // 重试逻辑：最多 3 次，指数退避（1s, 2s, 4s）
}
```

4. **chatStream() 方法**：SSE 流式返回，用 `ReadableStream` 逐行解析 `data: {...}` 格式

5. **selectConfig() 方法**：根据 model 名称自动选择渠道（model 名包含渠道关键词时匹配）

6. **日志记录**：每次调用记录 model、token 用量、耗时、成功/失败

**验收标准**：
- [ ] `npm run build` 通过
- [ ] 配置 OpenRouter 后能成功调用 LLM
- [ ] 流式调用能逐 token 返回
- [ ] 限流时自动等待重试

---

### Step 1.2：实现 AI 任务分解器

**目的**：替换 `MockTaskDecomposer`，基于 LLM 理解拆解需求。

**新建文件**：`src/lib/ai-task-decomposer.ts`

**保留** `src/lib/types/scheduler-mock.ts` 中的类型定义（Task、TaskStatus、TaskPriority、TaskDAG、TaskDecompositionResult），**删除** `MockTaskDecomposer` 和 `MockTaskManager` 类。

**核心类**：

```typescript
class AITaskDecomposer {
  private llm: LLMClient;
  
  constructor(llm: LLMClient) {
    this.llm = llm;
  }
  
  async decompose(params: {
    text: string;
    context: {
      projectType: string;
      technologyStack: string[];
      complexity: string;
    };
  }): Promise<TaskDecompositionResult>;
}
```

**decompose 方法 — Prompt 设计（最关键）**：

System Prompt 模板：

```
你是一个专业的项目任务拆解专家。将用户的项目需求拆解为可执行的开发任务。

## 输出格式（严格 JSON，不要输出其他内容）

{
  "tasks": [
    {
      "id": "task-1",
      "name": "简短任务名称",
      "description": "详细描述，包含具体要做什么、技术要点、验收标准",
      "type": "component_generation | api_implementation | database_design | authentication_setup | testing | devops",
      "agent": "frontend | backend | fullstack | test",
      "priority": "critical | high | medium | low",
      "estimatedTime": 30,
      "dependencies": [],
      "input": {
        "requirements": "这个任务的具体需求",
        "specifications": {}
      },
      "tags": ["vue", "api", "jwt"]
    }
  ],
  "metadata": {
    "projectName": "项目名",
    "totalEstimatedTime": 120,
    "architecture": "monorepo | single | microservice",
    "phases": ["foundation", "backend", "frontend", "integration", "testing"]
  }
}

## 拆解原则
1. 每个任务 = 一个 Agent 可独立完成的工作单元
2. 粒度：单任务 15-60 分钟
3. 依赖关系准确：被依赖的必须先完成
4. agent 分配合理：前端组件→frontend，API/数据库→backend，测试→test
5. 优先级：基础设施 > 核心功能 > 辅助功能 > 测试
6. 完整项目通常 5-20 个任务
7. 每个任务的 description 要足够详细，让 Agent 不需要额外上下文就能执行
```

**实现逻辑**：
1. 将用户需求 + System Prompt 发送给 LLM（responseFormat: 'json'）
2. 解析返回的 JSON，校验结构完整性
3. 根据 dependencies 构建 TaskDAG
4. 检查循环依赖 → 自动修复（移除导致循环的边）
5. 返回 TaskDecompositionResult

**错误处理**：
- LLM 返回非 JSON → 重试一次，prompt 强调"只输出 JSON"
- 循环依赖 → 自动修复并记录 warning
- LLM 调用失败 → 返回明确错误信息

**验收标准**：
- [ ] 输入"做一个带登录功能的博客系统"，拆解出 8-15 个合理任务
- [ ] 前后端任务分配正确，依赖关系合理
- [ ] DAG 无循环依赖
- [ ] `npm run build` 通过

---

### Step 1.3：实现任务管理器（SQLite 持久化）

**目的**：替换 `MockTaskManager`，任务状态持久化到 SQLite。

**新建文件**：`src/lib/task-manager.ts`

**依赖安装**：`npm install better-sqlite3 && npm install -D @types/better-sqlite3`

**数据库表结构**：

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  agent TEXT,
  status TEXT DEFAULT 'pending',     -- pending | running | completed | failed | cancelled
  priority TEXT DEFAULT 'medium',
  dependencies TEXT,                  -- JSON array
  input TEXT,                         -- JSON
  output TEXT,                        -- JSON
  estimated_time INTEGER,
  tags TEXT,                          -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT
);
```

**接口**：

```typescript
class TaskManager {
  private db: Database;
  
  constructor(dbPath?: string);  // 默认 './data/nightshift.db'
  
  async addTask(task: Task): Promise<string>;
  async getTask(id: string): Promise<Task | null>;
  async updateTaskStatus(id: string, status: TaskStatus, output?: any): Promise<void>;
  async getPendingTasks(): Promise<Task[]>;
  async getTasksByAgent(agent: string): Promise<Task[]>;
  async getTaskProgress(): Promise<{ total: number; completed: number; running: number; failed: number; pending: number }>;
  async getTaskDependencies(id: string): Promise<string[]>;
  async reset(): Promise<void>;
}
```

**实现要点**：
- `better-sqlite3` 是同步 API，所有方法直接返回结果
- `updateTaskStatus` 时自动更新 `started_at`（running）/ `completed_at`（completed）
- 失败时记录 `error_message`，`retry_count` +1

**验收标准**：
- [ ] 任务持久化到 SQLite，重启不丢失
- [ ] `npm run build` 通过

---

### Step 1.4：重写 SchedulerAgent 集成真实组件

**目的**：将 Mock 组件替换为真实组件。

**修改文件**：`src/lib/scheduler-agent.ts`

**改动点**：

```typescript
// 旧 import
import { MockTaskDecomposer, MockTaskManager } from './types/scheduler-mock';

// 新 import
import { AITaskDecomposer } from './ai-task-decomposer';
import { TaskManager } from './task-manager';
import { LLMClient } from './llm-client';
```

**构造函数改动**：

```typescript
constructor() {
  const llm = new LLMClient();  // 从环境变量读取配置
  this.decomposer = new AITaskDecomposer(llm);
  this.taskManager = new TaskManager();
  this.llm = llm;
  
  // v2.0 预留：初始化 Socket.IO 连接
  this.initializeSocketIO();
}
```

**新增 Mock fallback**：

```typescript
// 环境变量 USE_MOCK=true 时走 Mock
if (process.env.USE_MOCK === 'true') {
  this.decomposer = new MockTaskDecomposer();  // 保留旧 Mock 类作为 fallback
}
```

**验收标准**：
- [ ] `decomposeRequirement("做一个博客系统")` 返回真实拆解结果
- [ ] 拆解结果通过 `scheduleTasks` 写入 SQLite
- [ ] `USE_MOCK=true` 时回退到 Mock 模式
- [ ] `npm run build` 通过

---

## Phase 2：Agent 执行引擎（让 Agent 真正写代码）

> **目标**：让 FrontendAgent、BackendAgent 能调用 LLM 生成代码
> **优先级**：🔴 高
> **前置依赖**：Phase 1 完成
> **预计耗时**：2-3 天

---

### Step 2.1：实现 ModelRouter（含 v2.0 动态调度预留）

**目的**：让 Agent 能通过配置选择不同 LLM 模型。

**新建文件**：`packages/agents/src/model-router.ts`

```typescript
interface ModelConfig {
  id: string;                    // 如 "frontend-main"
  provider: string;              // 渠道名
  model: string;                 // 模型名
  capabilities: string[];        // 能力标签：["code", "reasoning", "fast"]
  costPerToken: number;          // 成本估算
  maxTokens: number;
}

class RealModelRouter implements ModelRouter {
  private configs: Map<string, ModelConfig>;
  private performanceHistory: Map<string, ModelMetrics[]>;
  
  constructor(configs?: ModelConfig[]) {
    // 从环境变量加载：MODEL_FRONTEND, MODEL_BACKEND 等
    // 默认：所有 Agent 使用 DEFAULT_LLM_MODEL
  }
  
  // v1.0：根据 task.type 选择模型
  route(task: Task, availableModels: string[]): string {
    // 优先级：用户指定 > 任务类型匹配 > 默认模型
  }
  
  getModelInfo(model: string): ModelInfo { ... }
  trackPerformance(model: string, metrics: ModelMetrics): void { ... }
  
  // ===== v2.0 预留方法（v1.0 不实现，只留接口） =====
  
  // 动态重分配模型：主脑根据任务复杂度切换 Agent 的模型
  // v2.0 实现：通知用户确认 → 切换模型 → 记录切换日志
  async reassignModel?(agentId: string, newModel: string, reason: string): Promise<void> {
    throw new Error('v2.0 feature: dynamic model reassignment');
  }
  
  // 查询模型能力：判断某个模型是否适合特定任务
  getModelCapabilities?(model: string): ModelCapability {
    return this.configs.get(model)?.capabilities || [];
  }
  
  // 建议模型切换：当任务复杂度超出当前模型能力时，建议切换
  suggestModelSwitch?(currentModel: string, taskComplexity: string): string | null {
    return null;  // v1.0 不做建议
  }
}
```

**v2.0 动态调度的完整设计**（仅供参考，v1.0 不实现）：

```
场景：任务需要 Opus-4.7 级别推理能力，但 Agent 绑定的是 Sonnet-4

v2.0 流程：
1. Agent 执行任务时，ModelRouter 检测到任务复杂度超出当前模型能力
2. suggestModelSwitch() 返回建议的模型（如 "anthropic/claude-opus-4-7"）
3. 主脑通过 Socket.IO 向用户发送确认请求：
   { type: 'model_switch_request', agentId, currentModel, suggestedModel, reason }
4. 用户确认后，主脑调用 reassignModel() 切换模型
5. Agent 使用新模型重新执行任务
6. 记录切换日志到记忆系统
```

**验收标准**：
- [ ] 不同类型的 task 能路由到不同模型
- [ ] `npm run build` 通过

---

### Step 2.2：实现 Agent 的 LLM 执行能力

**目的**：让 BaseAgent 的 `executeWithContext` 方法真正调用 LLM 生成代码。

**修改文件**：`packages/agents/src/base-agent.ts`

**改动点**：找到 `executeWithContext` 方法（当前返回硬编码结果），替换为：

```typescript
protected async executeWithContext(
  task: Task,
  context: ExecutionContext
): Promise<TaskOutput> {
  const startTime = Date.now();
  
  try {
    // 1. 构建 Prompt（根据 Agent 角色，Prompt 模板不同）
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(task);
    
    // 2. 调用 LLM（通过 LLMClient）
    const response = await this.llmClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      model: this.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens
    });
    
    // 3. 解析 LLM 输出（提取代码块）
    const codeBlocks = this.extractCodeBlocks(response.content);
    
    // 4. 返回结果
    return {
      success: true,
      generatedCode: codeBlocks.map(b => b.code).join('\n\n'),
      documentation: response.content,
      executionTime: Date.now() - startTime,
      tokensUsed: response.usage.totalTokens,
      model: this.model
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      executionTime: Date.now() - startTime,
      model: this.model
    };
  }
}
```

**新增辅助方法**：

```typescript
// 根据 Agent 角色生成 System Prompt
protected buildSystemPrompt(): string {
  const rolePrompts: Record<string, string> = {
    frontend: `你是一个专业的前端开发工程师。
技术栈：Vue 3 / React + TypeScript + Tailwind CSS
要求：
1. 使用 Composition API（Vue）或函数组件（React）
2. 样式用 Tailwind CSS
3. 代码结构清晰，有适当注释
4. 处理加载状态和错误状态
5. 输出可直接运行的代码，用 markdown 代码块包裹
6. 每个文件用 // File: path/to/file 标记`,

    backend: `你是一个专业的后端开发工程师。
技术栈：Node.js/Express + TypeScript 或 Python/FastAPI
要求：
1. RESTful API 设计
2. 输入验证和错误处理
3. 适当的类型定义
4. 包含数据库查询逻辑
5. 输出可直接运行的代码，用 markdown 代码块包裹
6. 每个文件用 // File: path/to/file 标记`,

    test: `你是一个专业的测试工程师。
要求：
1. 编写单元测试和集成测试
2. 覆盖正常流程和边界情况
3. 使用项目已有的测试框架
4. 输出可直接运行的测试代码`
  };
  
  return rolePrompts[this.role] || rolePrompts.frontend;
}

// 从 LLM 输出中提取代码块
protected extractCodeBlocks(content: string): Array<{ filename: string; code: string }> {
  const blocks: Array<{ filename: string; code: string }> = [];
  const regex = /(?:\/\/ File: (.+?)\n)?```[\w]*\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      filename: match[1] || `generated-${blocks.length}`,
      code: match[2].trim()
    });
  }
  return blocks;
}
```

**新增依赖**：`packages/agents` 需要能调用 LLMClient。两种方案：
- 方案 A：将 `llm-client.ts` 复制到 `packages/agents/src/`
- 方案 B：在 `packages/agents/package.json` 中添加对主应用的引用（不推荐，会循环依赖）
- **推荐方案 A**

**验收标准**：
- [ ] FrontendAgent 执行任务后返回真实 Vue/React 代码
- [ ] BackendAgent 执行任务后返回真实 API 代码
- [ ] 代码包含正确的文件名标记
- [ ] `npm run build` 通过

---

### Step 2.3：实现 Agent 技能系统

**目的**：让 Agent 根据任务类型自动选择技能。

**修改文件**：各 Agent 的 `loadDefaultSkills()` 方法

**FrontendAgent 技能列表**：

```typescript
protected async loadDefaultSkills(): Promise<void> {
  this.skills = [
    {
      id: 'vue-component',
      name: 'Vue 组件生成',
      description: '生成 Vue 3 Composition API 组件',
      capabilities: ['component_generation', 'vue', 'typescript'],
      supportedTechnologies: ['vue', 'typescript', 'tailwind'],
      execute: async (input, context) => {
        // 调用 LLM 生成 Vue 组件
        const response = await this.llmClient.chat([
          { role: 'system', content: '生成 Vue 3 Composition API 组件...' },
          { role: 'user', content: input.requirements }
        ]);
        return { success: true, output: response.content };
      },
      validate: (input) => ({ isValid: true, errors: [] })
    },
    {
      id: 'react-component',
      name: 'React 组件生成',
      capabilities: ['component_generation', 'react', 'typescript'],
      supportedTechnologies: ['react', 'typescript', 'tailwind'],
      execute: async (input, context) => { /* 类似 */ },
      validate: (input) => ({ isValid: true, errors: [] })
    },
    {
      id: 'page-layout',
      name: '页面布局生成',
      capabilities: ['layout_generation', 'responsive'],
      supportedTechnologies: ['vue', 'react', 'tailwind'],
      execute: async (input, context) => { /* 类似 */ },
      validate: (input) => ({ isValid: true, errors: [] })
    }
  ];
}
```

**BackendAgent 技能列表**：

```typescript
protected async loadDefaultSkills(): Promise<void> {
  this.skills = [
    {
      id: 'api-endpoint',
      name: 'API 端点生成',
      capabilities: ['api_implementation', 'express', 'fastapi'],
      supportedTechnologies: ['express', 'fastapi', 'typescript', 'python'],
      execute: async (input, context) => { /* 调用 LLM 生成 API */ },
      validate: (input) => ({ isValid: true, errors: [] })
    },
    {
      id: 'database-schema',
      name: '数据库 Schema 生成',
      capabilities: ['database_design', 'sql', 'migration'],
      supportedTechnologies: ['postgresql', 'mysql', 'sqlite'],
      execute: async (input, context) => { /* 调用 LLM 生成 Schema */ },
      validate: (input) => ({ isValid: true, errors: [] })
    }
  ];
}
```

**验收标准**：
- [ ] Agent 初始化后 `skills` 数组不为空
- [ ] `findSkills(['vue', 'component'])` 返回匹配技能
- [ ] `npm run build` 通过

---

## Phase 3：Socket.IO 实时通信

> **目标**：Agent 状态和任务进度实时推送到前端
> **优先级**：🟡 中高
> **前置依赖**：Phase 1 完成
> **预计耗时**：1-2 天

---

### Step 3.1：实现 Socket.IO 服务端

**目的**：提供 Agent 与前端之间的实时通信通道。

**安装依赖**：`npm install socket.io && npm install socket.io-client`

**创建文件**：`src/lib/socket-server.ts`

```typescript
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

class NightShiftSocketServer {
  private io: SocketIOServer;
  private agentRooms: Map<string, Set<string>> = new Map();  // agentId → 客户端ID集合
  
  constructor(httpServer: ReturnType<typeof createServer>) {
    this.io = new SocketIOServer(httpServer, {
      cors: { origin: '*' },
      path: '/socket.io'
    });
    
    this.io.on('connection', (socket) => {
      console.log(`客户端连接: ${socket.id}`);
      
      // 订阅 Agent 状态
      socket.on('subscribe:agent', (agentId: string) => {
        socket.join(`agent:${agentId}`);
        // 记录到 agentRooms
      });
      
      // 订阅任务更新
      socket.on('subscribe:tasks', () => {
        socket.join('tasks');
      });
      
      // 心跳
      socket.on('ping', () => socket.emit('pong'));
      
      socket.on('disconnect', () => {
        console.log(`客户端断开: ${socket.id}`);
      });
    });
  }
  
  // ===== 广播方法 =====
  
  // 任务状态更新 → 发到 'tasks' 房间
  broadcastTaskUpdate(taskId: string, status: string, data?: any) {
    this.io.to('tasks').emit('task_update', {
      taskId, status, ...data, timestamp: Date.now()
    });
  }
  
  // Agent 状态更新 → 发到 'agent:{agentId}' 房间
  broadcastAgentUpdate(agentId: string, status: string, data?: any) {
    this.io.to(`agent:${agentId}`).emit('agent_update', {
      agentId, status, ...data, timestamp: Date.now()
    });
  }
  
  // 进度更新
  broadcastProgress(overall: number, phase: string) {
    this.io.to('tasks').emit('progress_update', {
      overall, phase, timestamp: Date.now()
    });
  }
  
  // Agent 日志
  broadcastAgentLog(agentId: string, level: string, message: string) {
    this.io.to(`agent:${agentId}`).emit('agent_log', {
      agentId, level, message, timestamp: Date.now()
    });
  }
  
  // v2.0 预留：模型切换请求（需要用户确认）
  requestModelSwitch(agentId: string, currentModel: string, suggestedModel: string, reason: string) {
    this.io.emit('model_switch_request', {
      agentId, currentModel, suggestedModel, reason, timestamp: Date.now()
    });
  }
}
```

**消息协议**：

```typescript
// 服务端 → 客户端
type ServerMessage =
  | { type: 'task_update'; payload: { taskId: string; status: string; progress?: number } }
  | { type: 'agent_update'; payload: { agentId: string; status: string; currentTask?: string } }
  | { type: 'progress_update'; payload: { overall: number; phase: string } }
  | { type: 'agent_log'; payload: { agentId: string; level: string; message: string } }
  | { type: 'model_switch_request'; payload: { agentId: string; currentModel: string; suggestedModel: string; reason: string } }

// 客户端 → 服务端
type ClientMessage =
  | { type: 'subscribe:agent'; payload: { agentId: string } }
  | { type: 'subscribe:tasks' }
  | { type: 'model_switch_response'; payload: { agentId: string; approved: boolean } }
```

**验收标准**：
- [ ] Socket.IO 服务器能启动并接受连接
- [ ] 客户端订阅后能收到实时消息
- [ ] 断线后自动重连
- [ ] `npm run build` 通过

---

### Step 3.2：将 SchedulerAgent 接入 Socket.IO

**修改文件**：`src/lib/scheduler-agent.ts`

**改动点**：在关键方法中添加推送调用：

```typescript
// 任务拆解完成后
this.socketServer.broadcastTaskUpdate(rootTask.id, 'decomposed', {
  subtasks: result.decomposedTasks.map(t => ({ id: t.id, name: t.name, agent: t.agent }))
});

// 任务状态变更时
async onTaskStatusChanged(taskId: string, newStatus: string) {
  this.socketServer.broadcastTaskUpdate(taskId, newStatus);
  const progress = await this.taskManager.getTaskProgress();
  this.socketServer.broadcastProgress(
    Math.round((progress.completed / progress.total) * 100),
    newStatus
  );
}

// Agent 开始执行时
this.socketServer.broadcastAgentUpdate(agentId, 'busy', { currentTask: task.id });

// Agent 完成时
this.socketServer.broadcastAgentUpdate(agentId, 'idle', { completedTasks: count });
```

**验收标准**：
- [ ] 任务拆解完成后，前端实时收到子任务列表
- [ ] 任务状态变更时，前端面板自动更新
- [ ] `npm run build` 通过

---

## Phase 4：PRD 文档解析器

> **目标**：支持上传 PRD 文档，自动解析为任务拆解输入
> **优先级**：🟡 中
> **前置依赖**：Phase 1 完成
> **预计耗时**：1-2 天

---

### Step 4.1：实现 PRD 解析器

**创建文件**：`src/lib/prd-parser.ts`

**支持格式**：Markdown（.md）、纯文本（.txt）、JSON

**核心类**：

```typescript
interface PRDResult {
  projectName: string;
  description: string;
  features: Array<{
    name: string;
    description: string;
    priority: 'must' | 'should' | 'could';
    modules: string[];
  }>;
  techStack: { frontend?: string; backend?: string; database?: string };
  constraints: string[];
  rawContent: string;
}

class PRDParser {
  private llm: LLMClient;
  
  constructor(llm: LLMClient) {
    this.llm = llm;
  }
  
  async parse(fileContent: string, fileName: string): Promise<PRDResult> {
    // 1. JSON 格式 → 直接解析
    if (fileName.endsWith('.json')) {
      return JSON.parse(fileContent) as PRDResult;
    }
    
    // 2. Markdown/文本 → 用 LLM 提取结构化信息
    const response = await this.llm.chat([
      {
        role: 'system',
        content: `从 PRD 文档中提取结构化信息，输出 JSON：
{
  "projectName": "项目名",
  "description": "项目描述",
  "features": [{ "name": "功能名", "description": "描述", "priority": "must|should|could", "modules": ["模块"] }],
  "techStack": { "frontend": "框架", "backend": "框架", "database": "数据库" },
  "constraints": ["约束条件"]
}`
      },
      { role: 'user', content: fileContent }
    ], { responseFormat: 'json' });
    
    return JSON.parse(response.content);
  }
}
```

**与 SchedulerAgent 集成**：

```typescript
// scheduler-agent.ts 新增方法
async decomposePRD(prdContent: string, fileName: string): Promise<TaskDecompositionResult> {
  const parser = new PRDParser(this.llm);
  const prd = await parser.parse(prdContent, fileName);
  
  // 将 PRD 转为自然语言描述
  const requirementText = `
项目：${prd.projectName}
描述：${prd.description}
功能列表：
${prd.features.map(f => `- ${f.name}（${f.priority}）：${f.description}`).join('\n')}
技术栈：前端 ${prd.techStack.frontend || '未指定'}，后端 ${prd.techStack.backend || '未指定'}
约束：${prd.constraints.join('；')}
  `.trim();
  
  return await this.decomposer.decompose({
    text: requirementText,
    context: {
      projectType: prd.techStack.frontend ? 'fullstack' : 'backend',
      technologyStack: [prd.techStack.frontend, prd.techStack.backend].filter(Boolean),
      complexity: prd.features.length > 10 ? 'high' : prd.features.length > 5 ? 'medium' : 'low'
    }
  });
}
```

**验收标准**：
- [ ] 上传 Markdown PRD → 解析出项目名、功能列表、技术栈
- [ ] 解析结果正确传递给 AITaskDecomposer
- [ ] `npm run build` 通过

---

## Phase 5：前端面板数据绑定

> **目标**：TaskPlanPanel 和 AgentStatusPanel 显示真实数据
> **优先级**：🟢 中
> **前置依赖**：Phase 1 + Phase 3 完成
> **预计耗时**：1 天

---

### Step 5.1：创建全局状态管理 + API 路由

**创建文件**：`src/lib/store/project-store.ts`

```typescript
// 使用 React Context（或 Zustand）
interface ProjectState {
  tasks: Task[];
  taskProgress: { total: number; completed: number; running: number; failed: number; pending: number };
  agents: AgentStatus[];
  wsConnected: boolean;
  
  loadTasks: () => Promise<void>;
  loadAgents: () => Promise<void>;
  handleWSMessage: (message: ServerMessage) => void;
}
```

**创建 API 路由**：

- `src/app/api/tasks/route.ts` — GET 返回所有任务
- `src/app/api/tasks/progress/route.ts` — GET 返回进度统计
- `src/app/api/agents/route.ts` — GET 返回 Agent 状态

**实现逻辑**：
1. 组件挂载时通过 REST API 加载初始数据
2. 建立 Socket.IO 连接，监听实时更新
3. 收到 `task_update` → 更新 tasks 数组
4. 收到 `agent_update` → 更新 agents 数组

**验收标准**：
- [ ] TaskPlanPanel 显示真实任务列表和进度
- [ ] AgentStatusPanel 显示真实 Agent 状态
- [ ] 状态变更时面板自动更新
- [ ] `npm run build` 通过

---

### Step 5.2：连接现有面板组件

**修改文件**：
- `src/components/project/TaskPlanPanel.tsx` — 替换 props 为 store 数据
- `src/components/project/AgentStatusPanel.tsx` — 替换 props 为 store 数据

**改动要点**：
1. 移除硬编码的 props 数据
2. 从 store 获取数据
3. 添加 `useEffect` 在挂载时加载数据 + 订阅 Socket.IO
4. 确保状态标签颜色正确（灰=待执行，蓝=执行中，绿=完成，红=失败）

**验收标准**：
- [ ] 打开侧边栏能看到真实任务列表
- [ ] 任务状态标签颜色正确
- [ ] 进度条显示正确百分比
- [ ] `npm run build` 通过

---

## Phase 6：RuleForge 集成

> **目标**：NightShift 能使用 RuleForge 的规则约束 Agent 行为
> **优先级**：🟢 中
> **前置依赖**：Phase 2 完成
> **预计耗时**：1-2 天

---

### Step 6.1：在 NightShift 中引入 RuleForge 核心

**操作**：将 RuleForge 核心文件复制到 NightShift

```bash
# 从 RuleForge 项目复制核心源码
cp -r E:/code/ruleforge/packages/core/src/* E:/code/NightShift/packages/ruleforge/src/

# 复制类型定义
cp E:/code/ruleforge/packages/core/src/types/rule-schema.ts E:/code/NightShift/packages/ruleforge/src/types/
```

**保留的文件**：
- `extractor/` — 规则提取器
- `validator/` — 规则验证器
- `formatter/` — YAML 格式化器
- `storage/` — 规则存储
- `types/` — 类型定义（REP 协议）

**不复制的文件**：
- `github/` — GitHub 同步（v2.0 再做）
- `config/` — 配置管理（NightShift 有自己的配置体系）

**验收标准**：
- [ ] `import { RuleForgeEngine } from '../packages/ruleforge/src'` 能正常解析
- [ ] `npm run build` 通过

---

### Step 6.2：实现任务完成→规则提取的事件桥接

**创建文件**：`src/lib/ruleforge-bridge.ts`

```typescript
class RuleForgeBridge {
  private engine: RuleForgeEngine;
  
  constructor() {
    this.engine = new RuleForgeEngine({ projectName: 'nightshift' });
  }
  
  // Agent 完成任务时调用 → 自动提取规则
  async onTaskCompleted(task: Task, output: TaskOutput, conversationLog: any[]) {
    const extractionResult = await this.engine.extractOnly({
      sessionId: task.id,
      logPath: conversationLog,
      minConfidence: 0.6
    });
    
    if (extractionResult.rules.length > 0) {
      const validation = this.engine.validateOnly(extractionResult.rules);
      const validRules = validation.filter(v => v.isValid).map(v => v.rule);
      if (validRules.length > 0) {
        await this.engine.importRules(validRules);
      }
    }
  }
  
  // Agent 执行任务前调用 → 注入相关规则到 System Prompt
  async getRulesForTask(task: Task): Promise<string> {
    const allRules = await this.engine.getStore().getAll();
    const relevant = allRules.filter(rule => {
      const trigger = rule.rule.trigger;
      return task.tags.some(tag =>
        trigger.keywords.includes(tag) ||
        trigger.file_pattern.includes(tag)
      );
    });
    
    if (relevant.length === 0) return '';
    
    // 格式化为 System Prompt 的一部分
    return `\n\n## 编码规则（必须遵循）\n` +
      relevant.map(r => `- ${r.rule.name}: ${r.rule.condition}\n  建议: ${r.rule.suggestion}`).join('\n');
  }
}
```

**与 SchedulerAgent 集成**：

```typescript
// 任务开始前：注入规则
const rulesPrompt = await this.ruleForge.getRulesForTask(task);
// 将 rulesPrompt 追加到 Agent 的 System Prompt 中

// 任务完成后：提取规则
await this.ruleForge.onTaskCompleted(task, output, conversationLogs);
```

**验收标准**：
- [ ] Agent 执行任务时 System Prompt 包含相关规则
- [ ] 任务完成后能提取新规则
- [ ] 新规则保存到本地规则库
- [ ] `npm run build` 通过

---

## Phase 7：记忆系统增强

> **目标**：记忆系统支持持久化 + 知识链预留
> **优先级**：🟠 中低
> **前置依赖**：无
> **预计耗时**：1 天

---

### Step 7.1：MemoryStore 持久化 + 知识链预留

**修改文件**：`src/lib/memory/memory-store.ts`

**数据库表结构**：

```sql
CREATE TABLE short_term_memory (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  messages TEXT,          -- JSON array
  created_at DATETIME,
  expires_at DATETIME
);

CREATE TABLE long_term_memory (
  id TEXT PRIMARY KEY,
  type TEXT,              -- profile | relation | commitment | fact
  content TEXT,           -- JSON
  tags TEXT,              -- JSON array
  links TEXT,             -- JSON array — 关联的其他记忆ID（v2.0 知识链）
  importance REAL,
  created_at DATETIME,
  accessed_at DATETIME,
  access_count INTEGER DEFAULT 0
  -- v2.0 预留字段：
  -- obsidian_path TEXT,  — 对应 Obsidian vault 中的文件路径
  -- knowledge_chain TEXT — 知识链路径 JSON
);

CREATE TABLE working_memory (
  id TEXT PRIMARY KEY,
  context TEXT,           -- JSON
  updated_at DATETIME
);
```

**v2.0 知识链预留**（类型定义，不实现）：

```typescript
// v2.0：记忆可导出为 Obsidian Markdown
interface KnowledgeChain {
  id: string;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

interface KnowledgeNode {
  memoryId: string;
  obsidianPath: string;  // 如 "用户偏好/编程习惯.md"
  content: string;
}

interface KnowledgeEdge {
  from: string;
  to: string;
  relation: string;  // 如 "导致"、"相关"、"补充"
}

// v2.0：主脑分发知识链给 Agent
// Agent 执行任务时，主脑根据任务标签匹配相关知识链
// 将知识链压缩后注入 Agent 的上下文，降低 token 消耗
```

**验收标准**：
- [ ] 重启应用后记忆数据不丢失
- [ ] `npm run build` 通过

---

## Phase 8：TodoList 进度面板增强

> **目标**：侧边栏显示 TodoList 式任务清单，完成后自动勾选
> **优先级**：🟢 低
> **前置依赖**：Phase 5 完成
> **预计耗时**：0.5 天

---

### Step 8.1：增强 TaskPlanPanel 交互

**修改文件**：`src/components/project/TaskPlanPanel.tsx`

**改动点**：

1. 每个任务行添加 checkbox：
```tsx
<div className="flex items-center gap-2">
  <input 
    type="checkbox" 
    checked={task.status === 'completed'} 
    readOnly 
    className="w-4 h-4"
  />
  <span className={task.status === 'completed' ? 'line-through text-gray-400' : ''}>
    {task.name}
  </span>
  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
    {task.agent}
  </span>
</div>
```

2. 完成动画（checkbox 勾选时的过渡效果）
3. 任务分组显示（按 phase 分组：基础设施 → 后端 → 前端 → 测试）

**验收标准**：
- [ ] 任务完成后 checkbox 自动勾选
- [ ] 已完成任务显示删除线
- [ ] 每个任务显示负责的 Agent 标签
- [ ] `npm run build` 通过

---

## 执行顺序总结

```
Phase 1 (2-3天)  ──→  Phase 2 (2-3天)  ──→  Phase 6 (1-2天)
    │                      │
    │                      ↓
    │                 Phase 7 (1天)
    ↓
Phase 3 (1-2天)  ──→  Phase 5 (1天)  ──→  Phase 8 (0.5天)
    │
    ↓
Phase 4 (1-2天)
```

**最短可行路径（MVP）**：Phase 1 → Phase 2 → Phase 3 → Phase 5
**预计总耗时**：7-10 天（单人开发）

---

## 环境变量清单（.env.local）

```bash
# ===== LLM 配置 =====
# 主渠道（必填）
LLM_PRIMARY_BASE_URL=https://openrouter.ai/api/v1
LLM_PRIMARY_API_KEY=sk-or-xxx
LLM_PRIMARY_DEFAULT_MODEL=anthropic/claude-sonnet-4

# 备用渠道（可选）
LLM_SECONDARY_BASE_URL=https://your-proxy.com/v1
LLM_SECONDARY_API_KEY=sk-xxx
LLM_SECONDARY_DEFAULT_MODEL=gpt-4o

# Agent 专用模型（可选，不配则使用主渠道默认模型）
MODEL_FRONTEND=anthropic/claude-sonnet-4
MODEL_BACKEND=openai/gpt-4o
MODEL_SCHEDULER=anthropic/claude-sonnet-4
MODEL_TEST=anthropic/claude-sonnet-4

# ===== 开发模式 =====
USE_MOCK=false          # true = 走 Mock，不调 LLM（开发调试用）

# ===== Socket.IO =====
WS_PORT=3001

# ===== 数据库 =====
DB_PATH=./data/nightshift.db

# ===== RuleForge（可选）=====
RULEFORGE_ENABLED=true
RULEFORGE_RULES_DIR=./rules
```

---

## v2.0 演进方向（仅供参考，v1.0 不实现）

### 动态模型调度
- 主脑根据任务复杂度自动建议切换 Agent 绑定的模型
- 需要用户确认后执行切换
- 切换日志记录到记忆系统

### 三层通信架构
- 第一层：主脑 ↔ Agent（任务分发/结果回收）
- 第二层：主脑 ↔ 知识缓存层（知识链分发）
- 第三层：Agent ↔ Agent（协作通信，如前端 Agent 询问后端 API 接口格式）

### 知识链系统
- 结合本地 Obsidian vault 作为记忆体
- 主脑整理用户信息形成知识链
- 任务执行时主脑分发相关知识链给 Agent
- 压缩上下文，降低 token 消耗

### 顾问系统
- 集成免费对话助手（千问/豆包等）
- 辅助用户生成 prompt
- 解释报错信息
- 提供编程建议

### 0 号主脑进化
- v1.0：直接执行任务拆解
- v2.0：不直接执行，专注调度、记忆、自学习
- 特殊情况下可"下场"执行

---

## 注意事项

1. **逐步推进**：每个 Phase 完成后验证功能可用再进入下一个
2. **Mock fallback**：`USE_MOCK=true` 时走 Mock，方便开发调试
3. **Token 成本控制**：
   - 任务拆解：中等模型，约 1000-2000 tokens/次
   - 代码生成：按复杂度选模型
   - 添加 token 用量统计
4. **错误恢复**：Agent 执行失败时自动重试（最多 3 次），或标记失败通知用户
5. **文件写入安全**：Agent 生成代码写入前检查目标路径是否已存在
6. **RuleForge 同步**：NightShift 中的 RuleForge 是复制版本，独立项目更新后需手动同步
