/**
 * 任务管理器类型定义
 */
/**
 * 任务状态定义
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
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
    input?: any;
    output?: any;
    error?: string;
    retryCount: number;
    maxRetries: number;
    timeout: number;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    dependencies: string[];
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
export declare class MemoryStorage implements TaskStorage {
    private tasks;
    save(task: Task): Promise<void>;
    get(taskId: string): Promise<Task | null>;
    getAll(): Promise<Task[]>;
    delete(taskId: string): Promise<void>;
    clear(): Promise<void>;
}
/**
 * 任务事件类型
 */
export type TaskEvent = 'task.added' | 'task.started' | 'task.completed' | 'task.failed' | 'task.retry' | 'task.timeout' | 'task.cancelled' | 'task.progress';
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
    addTask(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retryCount'>): Promise<Task>;
    startTask(taskId: string): Promise<void>;
    completeTask(taskId: string, output?: any): Promise<void>;
    failTask(taskId: string, error: string): Promise<void>;
    cancelTask(taskId: string): Promise<void>;
    retryTask(taskId: string): Promise<void>;
    getTaskStatus(taskId: string): Promise<TaskStatus | null>;
    getTask(taskId: string): Promise<Task | null>;
    getReadyTasks(): Promise<Task[]>;
    getRunningTasks(): Promise<Task[]>;
    getAllTasks(): Promise<Task[]>;
    getStats(): Promise<TaskManagerStats>;
    registerPlugin(plugin: TaskPlugin): Promise<void>;
    unregisterPlugin(pluginName: string): Promise<void>;
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
export declare class ConsoleLogger implements TaskLogger {
    private readonly name;
    constructor(name?: string);
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, data?: any): void;
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
export declare class PriorityQueue implements TaskQueue {
    private tasks;
    private readonly priorityWeights;
    enqueue(task: Task): Promise<void>;
    dequeue(): Promise<Task | null>;
    peek(): Promise<Task | null>;
    size(): Promise<number>;
    isEmpty(): Promise<boolean>;
    clear(): Promise<void>;
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
export declare class SemaphoreConcurrencyController implements ConcurrencyController {
    private readonly max;
    private current;
    private waiting;
    constructor(max: number);
    acquire(): Promise<boolean>;
    release(): void;
    getCurrentConcurrency(): number;
    getMaxConcurrency(): number;
}
//# sourceMappingURL=task-manager.d.ts.map