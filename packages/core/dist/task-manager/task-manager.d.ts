/**
 * NightShift 任务管理器
 * 管理任务生命周期、并发控制、重试机制和事件发布
 */
import { EventEmitter } from 'events';
import { Task, TaskStatus, TaskConfig, TaskPlugin, TaskManager, TaskManagerStats } from './types/task-manager.js';
/**
 * NightShift 任务管理器实现
 */
export declare class NightShiftTaskManager extends EventEmitter implements TaskManager {
    private storage;
    private queue;
    private concurrencyController;
    private stateMachine;
    private timeoutDetector;
    private pluginManager;
    private logger;
    private isInitialized;
    private isShuttingDown;
    constructor(config?: TaskConfig);
    private defaultTimeout;
    private defaultMaxRetries;
    /**
     * 初始化任务管理器
     */
    initialize(): Promise<void>;
    /**
     * 关闭任务管理器
     */
    shutdown(): Promise<void>;
    /**
     * 添加任务
     */
    addTask(taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retryCount'>): Promise<Task>;
    /**
     * 开始执行任务
     */
    startTask(taskId: string): Promise<void>;
    /**
     * 完成任务
     */
    completeTask(taskId: string, output?: any): Promise<void>;
    /**
     * 任务失败
     */
    failTask(taskId: string, error: string): Promise<void>;
    /**
     * 取消任务
     */
    cancelTask(taskId: string): Promise<void>;
    /**
     * 重试任务
     */
    retryTask(taskId: string): Promise<void>;
    /**
     * 获取任务状态
     */
    getTaskStatus(taskId: string): Promise<TaskStatus | null>;
    /**
     * 获取任务详情
     */
    getTask(taskId: string): Promise<Task | null>;
    /**
     * 获取就绪任务
     */
    getReadyTasks(): Promise<Task[]>;
    /**
     * 获取运行中任务
     */
    getRunningTasks(): Promise<Task[]>;
    /**
     * 获取所有任务
     */
    getAllTasks(): Promise<Task[]>;
    /**
     * 获取统计信息
     */
    getStats(): Promise<TaskManagerStats>;
    /**
     * 注册插件
     */
    registerPlugin(plugin: TaskPlugin): Promise<void>;
    /**
     * 注销插件
     */
    unregisterPlugin(pluginName: string): Promise<void>;
    /**
     * 私有方法
     */
    private ensureInitialized;
    private generateTaskId;
    private emitEvent;
    private finalizeTask;
    private processReadyTasks;
    private checkDependenciesCompleted;
    private handleTaskTimeout;
    private getStatusText;
    private calculateAverageExecutionTime;
    private calculateSuccessRate;
    private calculateThroughput;
}
//# sourceMappingURL=task-manager.d.ts.map