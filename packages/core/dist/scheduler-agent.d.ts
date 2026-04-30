import { Task, Agent } from './types';
/**
 * 调度 Agent - 负责任务拆解和依赖关系管理
 */
export declare class SchedulerAgent {
    private name;
    private role;
    private model;
    private skills;
    /**
     * 解析用户需求并生成任务计划
     */
    parseRequirements(userInput: string): Promise<{
        tasks: Task[];
        dependencies: Map<string, string[]>;
        estimatedTime: number;
    }>;
    /**
     * 需求分析
     */
    private analyzeRequirements;
    /**
     * 提取主要目标
     */
    private extractMainGoal;
    /**
     * 提取功能特性
     */
    private extractFeatures;
    /**
     * 从关键词推断功能
     */
    private inferFeaturesFromKeywords;
    /**
     * 提取技术要求
     */
    private extractTechnicalRequirements;
    /**
     * 提取约束条件
     */
    private extractConstraints;
    /**
     * 确定优先级
     */
    private determinePriority;
    /**
     * 任务拆解
     */
    private decomposeTasks;
    /**
     * 确定任务类型
     */
    private determineTaskType;
    /**
     * 分配 Agent
     */
    private assignAgent;
    /**
     * 分配模型
     */
    private assignModel;
    /**
     * 生成任务名称
     */
    private generateTaskName;
    /**
     * 生成任务描述
     */
    private generateTaskDescription;
    /**
     * 估算任务时间
     */
    private estimateTaskTime;
    /**
     * 估算复杂度
     */
    private estimateComplexity;
    /**
     * 分析依赖关系
     */
    private analyzeDependencies;
    /**
     * 生成 DAG（有向无环图）
     */
    private generateDAG;
    /**
     * 估算总时间
     */
    private estimateTime;
    /**
     * 获取 Agent 信息
     */
    getAgentInfo(): Agent;
    /**
     * 验证任务计划
     */
    validateTaskPlan(tasks: Task[], dependencies: Map<string, string[]>): string[];
    /**
     * 检查循环依赖
     */
    private checkCyclicDependencies;
    /**
     * 生成执行计划报告
     */
    generateExecutionReport(tasks: Task[], dependencies: Map<string, string[]>, estimatedTime: number): string;
    /**
     * 计算并行度
     */
    private calculateParallelism;
    /**
     * 获取执行顺序
     */
    private getExecutionOrder;
}
//# sourceMappingURL=scheduler-agent.d.ts.map