import { Task } from './types';
/**
 * 任务管理器 - 负责任务队列、状态机和重试机制
 */
export declare class TaskManager {
    private tasks;
    private taskQueue;
    private executingTasks;
    private completedTasks;
    private failedTasks;
    private maxRetries;
    private retryDelays;
    /**
     * 添加任务到管理器
     */
    addTasks(tasks: Task[]): void;
    /**
     * 获取可执行任务
     */
    getExecutableTasks(dependencies: Map<string, string[]>): Task[];
    /**
     * 标记任务开始执行
     */
    markTaskStarted(taskId: string): void;
    /**
     * 标记任务完成
     */
    markTaskCompleted(taskId: string): void;
    /**
     * 标记任务失败
     */
    markTaskFailed(taskId: string, error: string): void;
    /**
     * 检查是否所有任务完成
     */
    isAllTasksCompleted(): boolean;
    /**
     * 获取任务进度
     */
    getProgress(): {
        completed: number;
        total: number;
        progress: number;
    };
    /**
     * 获取失败任务
     */
    getFailedTasks(): Task[];
    /**
     * 重试失败任务
     */
    retryFailedTasks(): Task[];
    /**
     * 获取任务执行统计
     */
    getStatistics(): {
        total: number;
        completed: number;
        failed: number;
        executing: number;
        pending: number;
    };
    /**
     * 清空任务管理器
     */
    clear(): void;
}
//# sourceMappingURL=task-manager.d.ts.map