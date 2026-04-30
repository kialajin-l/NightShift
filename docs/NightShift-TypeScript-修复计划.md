# NightShift TypeScript 编译错误修复计划

> 项目根目录：`E:/code/NightShift`
> 目标：修复 300+ TypeScript 编译错误，使 `npx tsc --noEmit` 和 `npm run build` 通过
> 预计耗时：1-2 天

---

## 错误根因分析

### 核心问题：两套不兼容的 Task 类型

| 文件 | Task 类型特点 | 被谁引用 |
|------|-------------|---------|
| `packages/agents/src/types/agent.ts` | 完整版：有 input、technology、constraints、context | packages 内部 |
| `src/lib/types/scheduler-mock.ts` | 简化版：有 status、metadata、createdAt、updatedAt | 主应用 src/lib/ |

两个文件都 export 了 `Task`、`TaskStatus`、`TaskPriority`，但字段完全不同。`scheduler-agent.ts` 同时引用两边，导致大量类型不匹配。

### tsconfig.json 严格模式加剧问题

```json
"strict": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"exactOptionalPropertyTypes": true,
"noUncheckedIndexedAccess": true,
"noPropertyAccessFromIndexSignature": true
```

这些设置会让每个小问题都变成编译错误，300+ 中至少一半是严格模式放大出来的。

---

## 修复计划（6 步）

### Step 1：统一 Task 类型定义（解决 ~60% 错误）

**操作**：在 `src/lib/types/` 下新建 `task-types.ts`，合并两边 Task 的字段。

```typescript
// src/lib/types/task-types.ts
// 主应用的权威 Task 类型定义

export type TaskType = 
  | 'component_generation'
  | 'api_implementation' 
  | 'database_design'
  | 'authentication_setup'
  | 'task_decomposition'
  | 'conflict_resolution';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskInput {
  requirements: string;
  examples?: any[];
  specifications?: Record<string, any>;
  existingCode?: string;
}

export interface TechnologyStack {
  frontend?: {
    framework: 'vue' | 'react' | 'angular';
    language: 'typescript' | 'javascript';
    styling: 'tailwind' | 'css' | 'scss';
  };
  backend?: {
    framework: 'fastapi' | 'express' | 'spring';
    language: 'python' | 'javascript' | 'java';
    database: 'postgresql' | 'mysql' | 'mongodb';
  };
}

export interface Task {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  
  // 输入（来自 agent.ts）
  input: TaskInput;
  technology: TechnologyStack;
  
  // 调度（来自 scheduler-mock.ts）
  dependencies: string[];
  metadata: Record<string, any>;
  
  // Agent 分配
  agent: string;           // "frontend" | "backend" | "fullstack" | "test"
  tags: string[];
  
  // 时间
  estimatedTime: number;   // 分钟
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;        // v1.0 新增
  completedAt?: Date;      // v1.0 新增
  
  // 执行
  output?: any;            // v1.0 新增
  retryCount?: number;     // v1.0 新增
}

export interface TaskDAG {
  nodes: Task[];
  edges: Array<{ from: string; to: string }>;
  estimatedTime: number;
}

export interface TaskDecompositionResult {
  success: boolean;
  decomposedTasks: Task[];
  dag: TaskDAG;
  errors?: string[];
  metadata?: Record<string, any>;
}

export interface TaskDecomposer {
  decompose(params: {
    text: string;
    context: {
      projectType: string;
      technologyStack: string[];
      complexity: string;
    };
  }): Promise<TaskDecompositionResult>;
}

export interface TaskManager {
  addTask(task: Task): Promise<string>;
  getTask(id: string): Promise<Task | null>;
  updateTaskStatus(id: string, status: TaskStatus, output?: any): Promise<void>;
  getPendingTasks(): Promise<Task[]>;
  getTaskDependencies(id: string): Promise<string[]>;
  
  // v1.0 新增方法
  start(): Promise<void>;
  shutdown(): Promise<void>;
  isRunning(): boolean;
  getStats(): TaskManagerStats;
  getAllTasks(): Task[];
  retryTask(taskId: string): Promise<boolean>;
  cancelTask(taskId: string): Promise<boolean>;
}

export interface TaskManagerStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}
```

**同时修改** `src/lib/types/scheduler-mock.ts`：
- 删除原有的 `Task`、`TaskStatus`、`TaskPriority`、`TaskDAG`、`TaskDecompositionResult`、`TaskDecomposer`、`TaskManager` 接口定义
- 改为从 `./task-types` 重新导出
- 保留 `MockTaskDecomposer` 和 `MockTaskManager` 类，但让它们实现新接口

```typescript
// scheduler-mock.ts 修改后
export { Task, TaskStatus, TaskPriority, TaskType, TaskDAG, 
         TaskDecompositionResult, TaskDecomposer, TaskManager } from './task-types';

// MockTaskDecomposer 改为实现新的 TaskDecomposer 接口
export class MockTaskDecomposer implements TaskDecomposer {
  async decompose(params: { text: string; context: any }): Promise<TaskDecompositionResult> {
    // 用 params.text 生成 mock 子任务
    // ...
  }
}
```

**验收**：这一步完成后，`scheduler-agent.ts` 中大部分类型错误应该消失。

---

### Step 2：修复 scheduler-agent.ts（核心文件）

这是错误最多的文件。主要问题和修复方式：

**2a. 导入路径更新**

```typescript
// ❌ 旧
import { Task, TaskStatus, ... } from './types/scheduler-mock';

// ✅ 新
import { Task, TaskStatus, TaskPriority, TaskDAG, TaskDecompositionResult, 
         TaskDecomposer, TaskManager } from './types/task-types';
```

**2b. decomposer 调用签名**

```typescript
// ❌ 旧（MockTaskDecomposer 的签名）
const result = await this.decomposer.decomposeTask(task);

// ✅ 新（AITaskDecomposer 的签名）
const result = await this.decomposer.decompose({
  text: task.description,
  context: {
    projectType: 'web',
    technologyStack: task.tags || [],
    complexity: 'medium'
  }
});
```

**2c. dag 属性访问**

```typescript
// ❌ 旧
dag.nodes.forEach(...)
dag.estimatedTime

// ✅ 新（使用新的 TaskDAG 类型）
dag.nodes.forEach(...)
dag.estimatedTime
// 字段名一致，不需要改，但要确保 dag 的类型是新的 TaskDAG
```

**2d. task 缺少属性**

```typescript
// ❌ 旧：task.agent、task.output、task.tags 在旧 Task 中不存在
// ✅ 新：新 Task 类型已包含这些字段，不需要改

// 但要注意赋值时的类型
task.startedAt = new Date();  // ✅ 新类型有 startedAt
task.completedAt = new Date(); // ✅ 新类型有 completedAt
task.retryCount = (task.retryCount || 0) + 1; // ✅ 新类型有 retryCount
```

**2e. taskManager 方法调用**

```typescript
// ❌ 旧：这些方法在旧 TaskManager 接口中不存在
this.taskManager.start();
this.taskManager.shutdown();
this.taskManager.isRunning();
this.taskManager.getStats();
this.taskManager.getAllTasks();
this.taskManager.retryTask(id);
this.taskManager.cancelTask(id);

// ✅ 新：新 TaskManager 接口已包含这些方法
// 不需要改调用代码，只需要确保实现类（AITaskManager）实现了这些方法
```

**验收**：`scheduler-agent.ts` 的类型错误应该全部消除。

---

### Step 3：修复 websocket-service.ts

**3a. EventEmitter 类型声明**

```typescript
// ❌ 旧：declare emit/on 的写法在严格模式下有问题
declare emit: (event: 'connected' | 'disconnected' | 'error' | 'message', ...args: any[]) => boolean;
declare on: (event: 'connected' | 'disconnected' | 'error' | 'message', listener: (...args: any[]) => void) => this;

// ✅ 新：用泛型重载
emit(event: 'connected'): boolean;
emit(event: 'disconnected', event?: Event): boolean;
emit(event: 'error', error: Error): boolean;
emit(event: 'message', data: WebSocketMessage): boolean;
emit(event: string, ...args: any[]): boolean {
  return super.emit(event, ...args);
}

on(event: 'connected', listener: () => void): this;
on(event: 'disconnected', listener: (event?: Event) => void): this;
on(event: 'error', listener: (error: Error) => void): this;
on(event: 'message', listener: (data: WebSocketMessage) => void): this;
on(event: string, listener: (...args: any[]) => void): this {
  return super.on(event, listener);
}
```

**3b. `window` 检查**

```typescript
// ❌ 旧：直接访问 window
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

// ✅ 新：加 typeof 检查
if (typeof window === 'undefined') {
  throw new Error('WebSocket 仅在浏览器环境中可用');
}
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
```

**3c. Map.get() undefined 检查**

```typescript
// ❌ 旧
const task = this.tasks.get(id);

// ✅ 新
const task = this.tasks.get(id);
if (!task) {
  throw new Error(`Task ${id} not found`);
}
```

---

### Step 4：修复 tsconfig 严格模式问题

这些是全局性问题，逐类修复：

**4a. `exactOptionalPropertyTypes: true`**

```typescript
// ❌ 错误：undefined 赋值给非可选属性
const task: Task = {
  id: '1',
  name: 'test',
  // ... 其他必填字段
  startedAt: undefined,  // ❌ startedAt 是可选的，但 exactOptionalPropertyTypes 不允许赋 undefined
  completedAt: undefined,
  output: undefined,
  retryCount: undefined
};

// ✅ 正确：可选字段不赋值，或用条件赋值
const task: Task = {
  id: '1',
  name: 'test',
  // ... 其他必填字段
  // startedAt、completedAt 等可选字段不写
};

// 或者用条件赋值
if (someValue) {
  task.startedAt = someValue;
}
```

**4b. `noUncheckedIndexedAccess: true`**

```typescript
// ❌ 错误：Map.get() 返回 T | undefined
const task = this.tasks.get(id);
task.status;  // ❌ task 可能是 undefined

// ✅ 正确：加 null 检查
const task = this.tasks.get(id);
if (!task) throw new Error('Not found');
task.status;  // ✅ 现在 TypeScript 知道 task 不是 undefined

// 或者用非空断言（不推荐，但快速修复时可用）
const task = this.tasks.get(id)!;
```

**4c. `noPropertyAccessFromIndexSignature: true`**

```typescript
// ❌ 错误：用点号访问索引签名属性
const category = task.metadata.category;

// ✅ 正确：用方括号
const category = task.metadata['category'];
```

**4d. `noUnusedLocals: true` / `noUnusedParameters: true`**

```typescript
// ❌ 错误：未使用的变量
const unusedVar = 'hello';

// ✅ 正确：删除或用 _ 前缀
const _unusedVar = 'hello';  // 或直接删除
```

---

### Step 5：逐文件扫尾

按优先级修复剩余文件：

| 优先级 | 文件 | 常见问题 |
|--------|------|---------|
| 🔴 高 | `src/lib/ai-task-decomposer.ts` | 导入路径、Task 类型对齐 |
| 🔴 高 | `src/lib/ai-task-manager.ts` | 实现新 TaskManager 接口的所有方法 |
| 🔴 高 | `src/lib/llm-client.ts` | 类型标注、返回值类型 |
| 🟡 中 | `src/lib/ruleforge-bridge.ts` | 导入路径 |
| 🟡 中 | `src/lib/ruleforge-integration.ts` | 导入路径 |
| 🟡 中 | `src/lib/rule-injector.ts` | 导入路径 |
| 🟡 中 | `src/lib/prd-parser.ts` | 类型标注 |
| 🟡 中 | `src/lib/socket-server.ts` | Socket 服务端类型 |
| 🟢 低 | `src/lib/mock-scheduler.ts` | 与新类型兼容性 |
| 🟢 低 | `src/lib/scheduler-agent-new.ts` | 可能是旧版，考虑删除或合并 |
| 🟢 低 | `src/lib/scheduler-integration.ts` | 集成逻辑 |
| 🟢 低 | `src/lib/task-manager.ts` | 与新 TaskManager 接口冲突 |
| 🟢 低 | `src/lib/task-scheduler.ts` | 调度逻辑 |
| 🟢 低 | `src/lib/task-aggregator.ts` | 聚合逻辑 |
| 🟢 低 | `src/lib/task-rule-bridge.ts` | 规则桥接 |

**每个文件的修复模式**：
1. 检查 import 路径是否指向 `./types/task-types`
2. 检查函数签名是否与新接口匹配
3. 检查 `Map.get()` 是否有 undefined 检查
4. 检查 `Record` 访问是否用方括号
5. 检查是否有未使用的变量/参数

---

### Step 6：验证

```bash
# 1. 编译检查
npx tsc --noEmit

# 2. 如果还有错误，按错误信息逐个修复

# 3. 构建验证
npm run build

# 4. 启动验证
npm run dev
# 打开浏览器访问 http://localhost:3000
# 检查页面是否正常加载，控制台是否有运行时错误
```

---

## 执行顺序

```
Step 1（统一类型）→ Step 2（修scheduler-agent）→ Step 3（修websocket）→ Step 4（修严格模式）→ Step 5（逐文件扫尾）→ Step 6（验证）
```

**关键原则**：
- 先修类型对齐，再修严格模式 — 类型对齐能一次性解决 60% 的错误
- 不要改 tsconfig 降低严格度 — 严格模式是质量保障
- 每修一个文件就跑一次 `npx tsc --noEmit` 确认没有引入新错误
- 如果某个文件错误太多（>50个），考虑重写而不是逐个修
