/**
 * NightShift 简化协调器
 * 专注于端到端工作流的核心功能
 */
/**
 * 简化端到端协调器
 */
export declare class SimpleNightShiftOrchestrator {
    private modelRouter;
    constructor();
    /**
     * 执行完整工作流
     */
    executeWorkflow(userInput: string): Promise<WorkflowResult>;
    /**
     * 任务分解（模拟实现）
     */
    private decomposeTask;
    /**
     * 任务路由
     */
    private routeTasks;
    /**
     * 代码生成（模拟实现）
     */
    private generateCode;
    /**
     * 生成Vue组件
     */
    private generateVueComponent;
    /**
     * 生成Python API
     */
    private generatePythonAPI;
    /**
     * 规则提取（模拟实现）
     */
    private extractRules;
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
    tasks: any[];
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
 * 工作流状态接口
 */
export interface WorkflowStatus {
    isRunning: boolean;
    completedTasks: number;
    totalTasks: number;
    progress: number;
}
export default SimpleNightShiftOrchestrator;
//# sourceMappingURL=simple-orchestrator.d.ts.map