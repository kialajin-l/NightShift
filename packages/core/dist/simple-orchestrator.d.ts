import { WorkflowResult } from './types';
/**
 * 简化的 NightShift 协调器 - 用于端到端工作流测试
 */
export declare class SimpleNightShiftOrchestrator {
    private scheduler;
    private taskManager;
    private frontendAgent;
    private backendAgent;
    private patternRecognizer;
    constructor();
    /**
     * 执行完整的工作流
     */
    executeWorkflow(userInput: string): Promise<WorkflowResult>;
    /**
     * 执行任务
     */
    private executeTasks;
    /**
     * 执行单个任务
     */
    private executeSingleTask;
    /**
     * 获取工作流统计信息
     */
    getWorkflowStats(): {
        scheduler: any;
        taskManager: any;
        frontendAgent: any;
        backendAgent: any;
        patternRecognizer: {
            sessionCount: any;
        };
    };
    /**
     * 重置工作流状态
     */
    reset(): void;
}
//# sourceMappingURL=simple-orchestrator.d.ts.map