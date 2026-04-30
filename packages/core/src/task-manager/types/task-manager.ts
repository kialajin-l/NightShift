/**
 * 任务管理器类型定义
 */

import { EventEmitter } from 'events';

/**
 * 任务状态定义
 */
export type TaskStatus = 
  | 'pending'     // 等待执行
  | 'running'      // 执行中
  | 'completed'   // 已完成
  | 'failed'      // 已失败
  | 'cancelled'   // 已取消
  | 'timeout';    // 已超时

/**
 * 任务优先级定义
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * 任务接口
 */
export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  
  // 执行相关
  input?: any;
  output?: any;
  error?: string;
  
  // 重试机制
  retryCount: number;
  maxRetries: number;
  
  // 超时控制
  timeout: number; // 毫秒
  startedAt?: Date;
  completedAt?: Date;
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  
  // 依赖关系
  dependencies: string[];
  
  // 自定义数据
  metadata?: Record<string, any>;
}

/**
 * 任务配置
 */
export interface TaskConfig {
  maxConcurrent?: number;
  defaultTimeout?: number;
  defaultMaxRetries?: number;
  storage?: TaskStorage;
  logger?: TaskLogger;
}

/**
 * 任务存储接口
 */
export interface TaskStorage {
  save(task: Task): Promise<void>;
  get(taskId: string): Promise<Task | null>;
  getAll(): Promise<Task[]>;
  delete(taskId: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * 内存存储实现
 */
export class MemoryStorage implements TaskStorage {
  private tasks = new Map<string, Task>();

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async get(taskId: string): Promise<Task | null> {
    return this.tasks.get(taskId) || null;
  }

  async getAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async delete(taskId: string): Promise<void> {
    this.tasks.delete(taskId);
  }

  async clear(): Promise<void> {
    this.tasks.clear();
  }
}

/**
 * 任务事件类型
 */
export type TaskEvent = 
  | 'task.added'
  | 'task.started'
  | 'task.completed'
  | 'task.failed'
  | 'task.retry'
  | 'task.timeout'
  | 'task.cancelled'
  | 'task.progress';

/**
 * 任务事件数据
 */
export interface TaskEventData {
  task: Task;
  timestamp: Date;
  previousStatus?: TaskStatus;
  data?: any;
}

/**
 * 任务插件接口
 */
export interface TaskPlugin {
  name: string;
  version: string;
  
  // 生命周期钩子
  onInitialize?(manager: TaskManager): Promise<void>;
  onTaskAdded?(task: Task): Promise<void>;
  onTaskStarted?(task: Task): Promise<void>;
  onTaskCompleted?(task: Task): Promise<void>;
  onTaskFailed?(task: Task): Promise<void>;
  onTaskRetry?(task: Task): Promise<void>;
  onShutdown?(): Promise<void>;
}

/**
 * 任务管理器接口
 */
export interface TaskManager {
  // 任务管理
  addTask(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retryCount'>): Promise<Task>;
  startTask(taskId: string): Promise<void>;
  completeTask(taskId: string, output?: any): Promise<void>;
  failTask(taskId: string, error: string): Promise<void>;
  cancelTask(taskId: string): Promise<void>;
  retryTask(taskId: string): Promise<void>;
  
  // 查询接口
  getTaskStatus(taskId: string): Promise<TaskStatus | null>;
  getTask(taskId: string): Promise<Task | null>;
  getReadyTasks(): Promise<Task[]>;
  getRunningTasks(): Promise<Task[]>;
  getAllTasks(): Promise<Task[]>;
  
  // 统计信息
  getStats(): Promise<TaskManagerStats>;
  
  // 插件管理
  registerPlugin(plugin: TaskPlugin): Promise<void>;
  unregisterPlugin(pluginName: string): Promise<void>;
  
  // 生命周期
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * 任务管理器统计信息
 */
export interface TaskManagerStats {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  timeoutTasks: number;
  
  averageExecutionTime: number;
  successRate: number;
  throughput: number;
  
  concurrentLimit: number;
  currentConcurrency: number;
}

/**
 * 任务执行器接口
 */
export interface TaskExecutor {
  execute(task: Task): Promise<any>;
}

/**
 * 任务记录器接口
 */
export interface TaskLogger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
}

/**
 * 控制台日志记录器
 */
export class ConsoleLogger implements TaskLogger {
  private readonly name: string;
  
  constructor(name: string = 'TaskManager') {
    this.name = name;
  }
  
  debug(message: string, data?: any): void {
    console.debug(`[${this.name}] ${message}`, data || '');
  }
  
  info(message: string, data?: any): void {
    console.info(`[${this.name}] ${message}`, data || '');
  }
  
  warn(message: string, data?: any): void {
    console.warn(`[${this.name}] ${message}`, data || '');
  }
  
  error(message: string, data?: any): void {
    console.error(`[${this.name}] ${message}`, data || '');
  }
}

/**
 * 任务队列接口
 */
export interface TaskQueue {
  enqueue(task: Task): Promise<void>;
  dequeue(): Promise<Task | null>;
  peek(): Promise<Task | null>;
  size(): Promise<number>;
  isEmpty(): Promise<boolean>;
  clear(): Promise<void>;
}

/**
 * 基于优先级的任务队列
 */
export class PriorityQueue implements TaskQueue {
  private tasks: Task[] = [];
  
  private readonly priorityWeights = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };
  
  async enqueue(task: Task): Promise<void> {
    this.tasks.push(task);
    this.tasks.sort((a, b) => {
      const weightA = this.priorityWeights[a.priority];
      const weightB = this.priorityWeights[b.priority];
      return weightB - weightA; // 高优先级在前
    });
  }
  
  async dequeue(): Promise<Task | null> {
    return this.tasks.shift() || null;
  }
  
  async peek(): Promise<Task | null> {
    return this.tasks[0] || null;
  }
  
  async size(): Promise<number> {
    return this.tasks.length;
  }
  
  async isEmpty(): Promise<boolean> {
    return this.tasks.length === 0;
  }
  
  async clear(): Promise<void> {
    this.tasks = [];
  }
}

/**
 * 并发控制器接口
 */
export interface ConcurrencyController {
  acquire(): Promise<boolean>;
  release(): void;
  getCurrentConcurrency(): number;
  getMaxConcurrency(): number;
}

/**
 * 基于信号量的并发控制器
 */
export class SemaphoreConcurrencyController implements ConcurrencyController {
  private current = 0;
  private waiting: Array<() => void> = [];
  
  constructor(private readonly max: number) {}
  
  async acquire(): Promise<boolean> {
    if (this.current < this.max) {
      this.current++;
      return true;
    }
    
    return new Promise<boolean>((resolve) => {
      this.waiting.push(() => {
        this.current++;
        resolve(true);
      });
    });
  }
  
  release(): void {
    this.current--;
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      next?.();
    }
  }
  
  getCurrentConcurrency(): number {
    return this.current;
  }
  
  getMaxConcurrency(): number {
    return this.max;
  }
}