/**
 * NightShift 端到端协调器
 * 整合所有模块，实现完整工作流
 */
import { Task } from '../scheduler/types/task.js';
/**
 * 端到端工作流协调器
 */
export declare class NightShiftOrchestrator {
    private decomposer;
    private taskManager;
    private modelRouter;
    private frontendAgent;
    private backendAgent;
    private schedulerAgent;
    private patternRecognizer;
    private taskPanel;
    constructor();
    /**
     * 执行完整工作流
     */
    executeWorkflow(userInput: string): Promise<WorkflowResult>;
    /**
     * 任务分解
     */
    private decomposeTask;
    /**
     * 加载 RuleForge 规则
     */
    private loadRules;
    /**
     * Agent 并发执行
     */
    private executeAgentsConcurrently;
    /**
     * 执行前端 Agent
     */
    private executeFrontendAgent;
    /**
     * 执行后端 Agent
     */
    private executeBackendAgent;
    /**
     * 更新进度面板
     */
    private updateProgressPanel;
    /**
     * 提取新规则
     */
    private extractNewRules;
    /**
     * 获取工作流状态
     */
    getWorkflowStatus(): WorkflowStatus;
    /**
     * 停止工作流
     */
    stopWorkflow(): Promise<void>;
}
/**
 * 工作流结果接口
 */
export interface WorkflowResult {
    success: boolean;
    tasks: Task[];
    generatedFiles: GeneratedFile[];
    extractedRules: any[];
    totalTime: number;
    errors: string[];
}
/**
 * 生成的文件接口
 */
export interface GeneratedFile {
    type: 'frontend' | 'backend' | 'config';
    name: string;
    content: string;
    path: string;
}
/**
 * Agent 执行结果接口
 */
export interface AgentExecutionResult {
    generatedFiles: GeneratedFile[];
    errors: string[];
}
/**
 * 工作流状态接口
 */
export interface WorkflowStatus {
    isRunning: boolean;
    completedTasks: number;
    totalTasks: number;
    progress: number;
}
export default NightShiftOrchestrator;
//# sourceMappingURL=nightshift-orchestrator.d.ts.map