/**
 * NightShift 模拟协调器
 * 用于端到端集成测试的模拟实现
 */
/**
 * 模拟端到端协调器
 */
export declare class MockNightShiftOrchestrator {
    constructor();
    /**
     * 执行完整工作流（模拟实现）
     */
    executeWorkflow(userInput: string): Promise<WorkflowResult>;
    /**
     * 模拟工作流步骤
     */
    private simulateWorkflowSteps;
    /**
     * 生成模拟结果
     */
    private generateMockResult;
    /**
     * 生成模拟任务
     */
    private generateMockTasks;
    /**
     * 生成模拟文件
     */
    private generateMockFiles;
    /**
     * 生成Vue组件内容
     */
    private generateVueComponent;
    /**
     * 生成Python API内容
     */
    private generatePythonAPI;
    /**
     * 生成模拟规则
     */
    private generateMockRules;
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
export default MockNightShiftOrchestrator;
//# sourceMappingURL=mock-orchestrator.d.ts.map