## 📘 NightShift 版本规划（最终版）

### **v1.0（当前）：基于 CodePilot 快速原型**
- ✅ **接受 BUSL-1.1 限制**（个人/学术使用）
- ✅ **直接复用 CodePilot 代码**（多服务商、用量统计等）
- ✅ **快速验证 MVP**（1-2周完成）
- ⚠️ **不能商用/开源为 MIT**

**核心目标**：快速做出能用的多Agent编辑器，验证概念

---

### **v2.0（下一阶段）：清洁室重写（MIT 许可证）**

#### 🎯 **核心思路**
```
不复制 CodePilot 任何代码，而是：
1. 参考其架构思想（多服务商、用量统计设计）
2. 从零独立实现所有功能
3. 保持 MIT 许可证，可商用/开源
```

#### 📋 **重构规划（4-6周）**

**阶段 1：编辑器基础框架（2周）**
```typescript
// 从零实现 VSCode 插件基础
packages/editor/
├── src/
│   ├── providers/
│   │   ├── chat-provider.ts      # 聊天界面（参考 CodePilot 交互，独立实现）
│   │   ├── code-completion.ts    # 代码补全（独立实现）
│   │   └── file-manager.ts       # 文件管理（独立实现）
│   ├── services/
│   │   ├── model-provider.ts     # 多服务商（参考架构，独立代码）
│   │   └── usage-tracker.ts      # 用量统计（参考逻辑，独立代码）
│   └── extension.ts              # 插件入口
```

**阶段 2：核心功能重写（2周）**
```typescript
// 独立实现核心模块
packages/core/
├── src/
│   ├── model-router/
│   │   ├── model-router.ts       # 模型路由（独立实现）
│   │   ├── provider-factory.ts   # 服务商工厂（独立实现）
│   │   └── types.ts              # 类型定义（独立设计）
│   ├── usage-tracker/
│   │   ├── tracker.ts            # 用量追踪（独立实现）
│   │   ├── cost-calculator.ts    # 成本计算（独立实现）
│   │   └── dashboard.ts          # 数据面板（独立实现）
│   └── communication/
│       └── websocket.ts          # WebSocket 通信（独立实现）
```

**阶段 3：NightShift 差异化功能（1-2周）**
```typescript
// 你的核心竞争力（原创）
packages/
├── core/src/scheduler/           # 多Agent调度（原创）
├── ruleforge-bridge/             # RuleForge 集成（原创）
└── editor/src/ui/task-plan-panel/ # 任务计划面板（原创）
```

---

#### 🔍 **v2.0 与 v1.0 对比**

| 模块 | v1.0（基于 CodePilot） | v2.0（清洁室重写） |
|------|----------------------|------------------|
| **许可证** | BUSL-1.1（受限） | MIT（自由） |
| **多服务商** | 复制 CodePilot 代码 | 参考架构，独立实现 |
| **用量统计** | 复制 CodePilot 代码 | 参考逻辑，独立实现 |
| **编辑器UI** | 复制 CodePilot 代码 | 参考交互，独立实现 |
| **多Agent调度** | 原创 | 原创（不变） |
| **RuleForge** | 原创 | 原创（不变） |
| **开发周期** | 1-2周 | 4-6周 |
| **可商用** | ❌ 否 | ✅ 是 |

---

#### 🛠️ **v2.0 开发策略**

**清洁室开发原则**：
```
1. 不查看 CodePilot 源码（避免无意识复制）
2. 只参考其文档/架构图/功能演示
3. 所有代码从零开始写
4. 保留开发日志（证明独立性）
```

**技术选型**：
```typescript
// 参考 CodePilot 的设计思想，但独立实现
// 例如：多服务商架构
interface IModelProvider {
  id: string
  name: string
  config: ProviderConfig
  generate(prompt: string): Promise<string>
  trackUsage(): UsageStats
}

// 独立实现 ProviderFactory
class ProviderFactory {
  private providers: Map<string, IModelProvider>
  
  register(provider: IModelProvider): void
  get(id: string): IModelProvider
  route(task: Task): IModelProvider  // 智能路由
}
```

---

### 📅 **版本路线图**

```
v1.0（现在）
├─ 基于 CodePilot 改造
├─ 验证多Agent并发概念
└─ 个人/学术使用

    ↓ （如果验证成功）

v2.0（4-6周后）
├─ 清洁室重写
├─ MIT 许可证
└─ 可商用/开源

    ↓ （可选）

v3.0（长期）
├─ 社区规则市场
├─ 团队协作功能
└─ 商业化探索
```

---

## ✅ **现在行动（v1.0）**

**立即开始**（基于你上传的 PRD 链接）：

```typescript
/*
Day 1 Prompt：在 CodePilot 基础上添加多Agent调度

当前已有：
- CodePilot 完整编辑器（多服务商/用量统计/聊天界面）
- RuleForge 核心引擎（已链接）

需要新增：
1. packages/core/src/scheduler/
   - task-decomposer.ts（任务拆解器）
   - dag-manager.ts（DAG 管理）
   - task-state-machine.ts（状态机）

2. packages/editor/src/ui/task-plan-panel.ts
   - TODO List 视图
   - 实时更新逻辑

3. 集成 RuleForge
   - 规则自动注入
   - 会话监听

输出：完整 TypeScript 实现
*/
```

---