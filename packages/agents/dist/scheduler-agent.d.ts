/**
 * 调度 Agent - 负责任务调度和协调
 */
import { BaseAgent } from './base-agent';
import { Task, ValidationResult, ExecutionContext, ExecutionResult } from './types/agent';
/**
 * 调度 Agent 配置
 */
export interface SchedulerAgentConfig {
    maxConcurrentTasks: number;
    defaultTimeout: number;
    enableRetry: boolean;
    maxRetries: number;
}
/**
 * 调度 Agent
 */
export declare class SchedulerAgent extends BaseAgent {
    private schedulerConfig;
    private taskQueue;
    private runningTasks;
    constructor(config?: Partial<SchedulerAgentConfig>);
    /**
     * 加载默认技能
     */
    protected loadDefaultSkills(): Promise<void>;
    /**
     * 验证任务是否适合此 Agent
     */
    protected validateTask(task: Task): ValidationResult;
    /**
     * 选择适合任务的技能
     */
    protected selectSkills(task: Task): any[];
    /**
     * 执行任务的核心逻辑
     */
    protected executeWithContext(context: ExecutionContext): Promise<ExecutionResult>;
    /**
     * 添加任务到队列
     */
    addTask(task: Task): Promise<string>;
    /**
     * 获取待处理任务
     */
    getPendingTasks(): Task[];
    /**
     * 获取运行中任务
     */
    getRunningTasks(): Task[];
    /**
     * 开始调度
     */
    startScheduling(): Promise<void>;
    /**
     * 处理任务队列
     */
    private processQueue;
    /**
     * 处理任务重试
     */
    private handleRetry;
}
//# sourceMappingURL=scheduler-agent.d.ts.map