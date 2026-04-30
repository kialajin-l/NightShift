// 调度器模块的模拟实现，用于测试

/**
 * 任务分解器模拟实现
 */
export class TaskDecomposer {
  async decompose(input: string) {
    return {
      tasks: [],
      totalEstimatedTime: 0,
      dependencies: []
    };
  }
}

/**
 * 任务管理器模拟实现
 */
export class TaskManager {
  private handlers: Map<string, Function> = new Map();
  private tasks: Map<string, any> = new Map();

  async addTask(task: any) {
    this.tasks.set(task.id, task);
    return { id: 'mock-task-id', status: 'pending' };
  }
  
  async getTask(id: string) {
    return this.tasks.get(id) || { id, status: 'completed' };
  }
  
  async updateTask(id: string, updates: any) {
    const task = this.tasks.get(id) || { id };
    const updated = { ...task, ...updates };
    this.tasks.set(id, updated);
    return updated;
  }

  async getTasks() {
    return Array.from(this.tasks.values());
  }

  async reset() {
    this.tasks.clear();
    this.handlers.clear();
  }

  registerHandler(type: string, handler: Function) {
    this.handlers.set(type, handler);
  }

  async executeTask(task: any) {
    const handler = this.handlers.get(task.type);
    if (handler) {
      return await handler(task);
    }
    return { status: 'no_handler' };
  }

  async getTaskStatus(id: string) {
    return { id, status: 'completed', progress: 100 };
  }

  async cancelTask(id: string) {
    return { id, status: 'cancelled' };
  }
}

/**
 * 任务类型定义
 */
export interface Task {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  type?: string;
  estimatedTime?: number;
  dependencies?: string[];
  status?: string;
  createdAt?: Date;
  priority?: string;
  requiredSkills?: string[];
  estimatedEffort?: number;
  riskLevel?: string;
  deliverables?: string[];
}

export interface TaskDAG {
  tasks: Task[];
  dependencies: [string, string][];
}

export interface TaskDecompositionResult {
  tasks: Task[];
  totalEstimatedTime: number;
  dependencies: [string, string][];
}

export interface TaskAgent {
  id: string;
  type: string;
  capabilities: string[];
}