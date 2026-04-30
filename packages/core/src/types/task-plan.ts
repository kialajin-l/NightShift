/**
 * 任务状态枚举
 */
export type TaskStatus =
  | 'pending'     // 待执行
  | 'running'     // 执行中
  | 'completed'   // 已完成
  | 'failed'      // 失败
  | 'cancelled';  // 已取消

/**
 * Agent 角色类型
 */
export type AgentRole = 
  | 'scheduler'   // 任务拆解专家
  | 'frontend'    // 前端开发专家
  | 'backend'     // 后端开发专家
  | 'test';       // 测试生成专家

/**
 * 任务优先级枚举
 */
export enum TaskPriority {
  LOW = 1,
  MEDIUM = 5,
  HIGH = 8,
  CRITICAL = 10
}

/**
 * 任务输出类型定义
 */
export interface TaskOutput {
  files?: string[];            // 生成的文件路径
  summary?: string;            // 代码摘要
  artifacts?: {                // 构建产物
    type: 'component' | 'api' | 'test' | 'config';
    path: string;
    size?: number;
  }[];
  metrics?: {                  // 执行指标
    linesAdded?: number;
    linesModified?: number;
    filesTouched?: number;
    complexityScore?: number;
  };
}

/**
 * 单个任务定义
 */
export interface Task {
  id: string;                    // 唯一ID，如 "task-001"
  title: string;                 // 任务标题
  description: string;           // 详细描述
  status: TaskStatus;            // 当前状态
  agent: AgentRole;              // 负责的Agent角色
  dependencies: string[];        // 依赖的任务ID列表
  priority: TaskPriority;        // 优先级 (1-10, 10最高)
  estimatedTime?: number;        // 预估时间（分钟）
  actualTime?: number;           // 实际耗时（分钟）
  input?: any;                   // 任务输入（PRD片段等）
  output?: TaskOutput;           // 任务输出
  error?: string;                // 错误信息（如果失败）
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>; // 扩展元数据
  
  // 验证方法
  isValid(): boolean;
  canStart(): boolean;
  getProgress(): number;
}

/**
 * 任务计划状态
 */
export type TaskPlanStatus = 
  | 'planning'    // 计划中
  | 'executing'   // 执行中
  | 'reviewing'   // 评审中
  | 'done';       // 已完成

/**
 * 任务计划（完整开发计划）
 */
export interface TaskPlan {
  id: string;                    // 计划ID
  prompt: string;                // 用户原始需求
  tasks: Task[];                 // 任务列表
  status: TaskPlanStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // 统计信息
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalEstimatedTime: number;
  
  // 辅助方法
  getReadyTasks(): Task[];       // 获取可执行的任务（依赖已满足）
  getCompletedCount(): number;   // 已完成任务数
  getTotalProgress(): number;    // 总进度百分比
  getExecutionOrder(): string[]; // 获取任务执行顺序
  validate(): ValidationResult;  // 验证计划完整性
}

/**
 * DAG节点定义
 */
export interface DAGNode {
  taskId: string;
  dependencies: string[];
  dependents: string[];  // 被哪些任务依赖
  depth: number;         // 节点深度（用于排序）
}

/**
 * DAG图定义
 */
export interface DAG {
  nodes: Map<string, DAGNode>;
  edges: Array<{ from: string; to: string }>;
  
  // 核心方法
  addNode(task: Task): void;
  addDependency(from: string, to: string): void;
  detectCycle(): boolean;
  getExecutionOrder(): string[];  // 拓扑排序
  getCriticalPath(): string[];    // 关键路径
  getNodeDepth(taskId: string): number; // 获取节点深度
}

/**
 * 验证结果类型
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 任务执行上下文
 */
export interface TaskExecutionContext {
  workspaceRoot: string;          // 工作区根目录
  currentFile?: string;           // 当前编辑的文件
  dependencies: {                 // 项目依赖信息
    framework?: string;           // 框架类型
    language?: string;            // 编程语言
    packageManager?: string;      // 包管理器
  };
  constraints: {                  // 约束条件
    maxFileSize?: number;         // 最大文件大小
    codingStandards?: string[];   // 编码规范
    architecture?: string;        // 架构约束
  };
}

/**
 * 任务工厂类 - 创建和管理任务实例
 */
export class TaskFactory {
  private static taskCounter = 0;
  
  /**
   * 创建新任务
   */
  static createTask(
    title: string,
    description: string,
    agent: AgentRole,
    priority: TaskPriority = TaskPriority.MEDIUM
  ): Task {
    const taskId = `task-${++this.taskCounter}`;
    
    return {
      id: taskId,
      title,
      description,
      status: 'pending',
      agent,
      dependencies: [],
      priority,
      createdAt: new Date(),
      
      isValid(): boolean {
        return !!this.title && !!this.description && !!this.agent;
      },
      
      canStart(): boolean {
        return this.status === 'pending' && this.dependencies.every(depId => {
          // 检查依赖是否已完成（实际实现中需要查询任务状态）
          return true; // 简化实现
        });
      },
      
      getProgress(): number {
        switch (this.status) {
          case 'completed': return 100;
          case 'running': return 50;
          case 'failed': return 0;
          case 'cancelled': return 0;
          default: return 0;
        }
      }
    };
  }
  
  /**
   * 从用户需求生成任务计划
   */
  static createTaskPlanFromPrompt(prompt: string): TaskPlan {
    const planId = `plan-${Date.now()}`;
    const tasks: Task[] = [];
    
    // 根据需求类型自动生成任务（简化实现）
    if (prompt.toLowerCase().includes('前端') || prompt.toLowerCase().includes('ui')) {
      tasks.push(
        this.createTask('创建组件结构', '设计前端组件架构', 'frontend', TaskPriority.HIGH),
        this.createTask('实现样式系统', '设置CSS框架和主题', 'frontend', TaskPriority.MEDIUM),
        this.createTask('添加交互逻辑', '实现用户交互功能', 'frontend', TaskPriority.MEDIUM)
      );
    }
    
    if (prompt.toLowerCase().includes('后端') || prompt.toLowerCase().includes('api')) {
      tasks.push(
        this.createTask('设计API接口', '定义RESTful API规范', 'backend', TaskPriority.HIGH),
        this.createTask('实现业务逻辑', '编写核心业务代码', 'backend', TaskPriority.MEDIUM),
        this.createTask('配置数据库', '设置数据库连接和模型', 'backend', TaskPriority.MEDIUM)
      );
    }
    
    if (prompt.toLowerCase().includes('测试')) {
      tasks.push(
        this.createTask('编写单元测试', '为关键功能添加测试', 'test', TaskPriority.MEDIUM),
        this.createTask('集成测试', '验证模块间协作', 'test', TaskPriority.LOW)
      );
    }
    
    // 如果没有匹配的任务类型，添加通用任务
    if (tasks.length === 0) {
      tasks.push(
        this.createTask('分析需求', '理解用户需求并拆解', 'scheduler', TaskPriority.HIGH),
        this.createTask('技术选型', '选择合适的技术栈', 'scheduler', TaskPriority.MEDIUM)
      );
    }
    
    return {
      id: planId,
      prompt,
      tasks,
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalTasks: tasks.length,
      completedTasks: 0,
      failedTasks: 0,
      totalEstimatedTime: tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0),
      
      getReadyTasks(): Task[] {
        return this.tasks.filter(task => task.canStart());
      },
      
      getCompletedCount(): number {
        return this.tasks.filter(task => task.status === 'completed').length;
      },
      
      getTotalProgress(): number {
        if (this.tasks.length === 0) return 0;
        const completed = this.getCompletedCount();
        return Math.round((completed / this.tasks.length) * 100);
      },
      
      getExecutionOrder(): string[] {
        // 简化实现 - 实际应该使用DAG拓扑排序
        return this.tasks.map(task => task.id);
      },
      
      validate(): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // 验证任务完整性
        this.tasks.forEach((task, index) => {
          if (!task.isValid()) {
            errors.push(`任务 ${index + 1} (${task.title}) 不完整`);
          }
          
          // 检查循环依赖（简化检查）
          if (task.dependencies.includes(task.id)) {
            errors.push(`任务 ${task.title} 存在自依赖`);
          }
        });
        
        // 检查是否有任务没有依赖关系
        const isolatedTasks = this.tasks.filter(task => 
          task.dependencies.length === 0 && 
          !this.tasks.some(t => t.dependencies.includes(task.id))
        );
        
        if (isolatedTasks.length > 0) {
          warnings.push(`发现 ${isolatedTasks.length} 个孤立任务`);
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          warnings
        };
      }
    };
  }
}

/**
 * DAG图实现类
 */
export class DirectedAcyclicGraph implements DAG {
  nodes: Map<string, DAGNode> = new Map();
  edges: Array<{ from: string; to: string }> = [];
  
  addNode(task: Task): void {
    if (this.nodes.has(task.id)) {
      throw new Error(`节点 ${task.id} 已存在`);
    }
    
    this.nodes.set(task.id, {
      taskId: task.id,
      dependencies: [...task.dependencies],
      dependents: [],
      depth: 0
    });
    
    // 添加依赖关系
    task.dependencies.forEach(depId => {
      this.addDependency(depId, task.id);
    });
  }
  
  addDependency(from: string, to: string): void {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      throw new Error(`节点 ${from} 或 ${to} 不存在`);
    }
    
    this.edges.push({ from, to });
    
    // 更新依赖关系
    const fromNode = this.nodes.get(from)!;
    const toNode = this.nodes.get(to)!;
    
    if (!toNode.dependencies.includes(from)) {
      toNode.dependencies.push(from);
    }
    
    if (!fromNode.dependents.includes(to)) {
      fromNode.dependents.push(to);
    }
    
    // 重新计算深度
    this._calculateDepths();
  }
  
  detectCycle(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const node = this.nodes.get(nodeId)!;
      for (const depId of node.dependents) {
        if (hasCycle(depId)) return true;
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const nodeId of this.nodes.keys()) {
      if (hasCycle(nodeId)) return true;
    }
    
    return false;
  }
  
  getExecutionOrder(): string[] {
    if (this.detectCycle()) {
      throw new Error('图中存在循环依赖，无法进行拓扑排序');
    }
    
    const result: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();
    
    const visit = (nodeId: string): void => {
      if (temp.has(nodeId)) {
        throw new Error('检测到循环依赖');
      }
      
      if (!visited.has(nodeId)) {
        temp.add(nodeId);
        
        const node = this.nodes.get(nodeId)!;
        node.dependencies.forEach(depId => visit(depId));
        
        temp.delete(nodeId);
        visited.add(nodeId);
        result.push(nodeId);
      }
    };
    
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }
    
    return result.reverse();
  }
  
  getCriticalPath(): string[] {
    // 简化实现 - 实际应该使用最长路径算法
    const executionOrder = this.getExecutionOrder();
    return executionOrder.filter(nodeId => {
      const node = this.nodes.get(nodeId)!;
      return node.dependents.length === 0 || node.dependencies.length === 0;
    });
  }
  
  getNodeDepth(taskId: string): number {
    const node = this.nodes.get(taskId);
    return node ? node.depth : 0;
  }
  
  private _calculateDepths(): void {
    // 重置所有深度
    for (const node of this.nodes.values()) {
      node.depth = 0;
    }
    
    // 计算每个节点的深度
    const calculateDepth = (nodeId: string): number => {
      const node = this.nodes.get(nodeId)!;
      if (node.depth > 0) return node.depth;
      
      if (node.dependencies.length === 0) {
        node.depth = 1;
        return 1;
      }
      
      const maxDepth = Math.max(...node.dependencies.map(calculateDepth));
      node.depth = maxDepth + 1;
      return node.depth;
    };
    
    for (const nodeId of this.nodes.keys()) {
      calculateDepth(nodeId);
    }
  }
}