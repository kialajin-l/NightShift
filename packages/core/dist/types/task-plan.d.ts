/**
 * 任务状态枚举
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
/**
 * Agent 角色类型
 */
export type AgentRole = 'scheduler' | 'frontend' | 'backend' | 'test';
/**
 * 任务优先级枚举
 */
export declare enum TaskPriority {
    LOW = 1,
    MEDIUM = 5,
    HIGH = 8,
    CRITICAL = 10
}
/**
 * 任务输出类型定义
 */
export interface TaskOutput {
    files?: string[];
    summary?: string;
    artifacts?: {
        type: 'component' | 'api' | 'test' | 'config';
        path: string;
        size?: number;
    }[];
    metrics?: {
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
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    agent: AgentRole;
    dependencies: string[];
    priority: TaskPriority;
    estimatedTime?: number;
    actualTime?: number;
    input?: any;
    output?: TaskOutput;
    error?: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    metadata?: Record<string, any>;
    isValid(): boolean;
    canStart(): boolean;
    getProgress(): number;
}
/**
 * 任务计划状态
 */
export type TaskPlanStatus = 'planning' | 'executing' | 'reviewing' | 'done';
/**
 * 任务计划（完整开发计划）
 */
export interface TaskPlan {
    id: string;
    prompt: string;
    tasks: Task[];
    status: TaskPlanStatus;
    createdAt: Date;
    updatedAt: Date;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalEstimatedTime: number;
    getReadyTasks(): Task[];
    getCompletedCount(): number;
    getTotalProgress(): number;
    getExecutionOrder(): string[];
    validate(): ValidationResult;
}
/**
 * DAG节点定义
 */
export interface DAGNode {
    taskId: string;
    dependencies: string[];
    dependents: string[];
    depth: number;
}
/**
 * DAG图定义
 */
export interface DAG {
    nodes: Map<string, DAGNode>;
    edges: Array<{
        from: string;
        to: string;
    }>;
    addNode(task: Task): void;
    addDependency(from: string, to: string): void;
    detectCycle(): boolean;
    getExecutionOrder(): string[];
    getCriticalPath(): string[];
    getNodeDepth(taskId: string): number;
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
    workspaceRoot: string;
    currentFile?: string;
    dependencies: {
        framework?: string;
        language?: string;
        packageManager?: string;
    };
    constraints: {
        maxFileSize?: number;
        codingStandards?: string[];
        architecture?: string;
    };
}
/**
 * 任务工厂类 - 创建和管理任务实例
 */
export declare class TaskFactory {
    private static taskCounter;
    /**
     * 创建新任务
     */
    static createTask(title: string, description: string, agent: AgentRole, priority?: TaskPriority): Task;
    /**
     * 从用户需求生成任务计划
     */
    static createTaskPlanFromPrompt(prompt: string): TaskPlan;
}
/**
 * DAG图实现类
 */
export declare class DirectedAcyclicGraph implements DAG {
    nodes: Map<string, DAGNode>;
    edges: Array<{
        from: string;
        to: string;
    }>;
    addNode(task: Task): void;
    addDependency(from: string, to: string): void;
    detectCycle(): boolean;
    getExecutionOrder(): string[];
    getCriticalPath(): string[];
    getNodeDepth(taskId: string): number;
    private _calculateDepths;
}
//# sourceMappingURL=task-plan.d.ts.map