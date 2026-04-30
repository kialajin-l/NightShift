import { BaseAgent } from './base-agent';
import { Task, AgentStatus } from './types/agent';
/**
 * 后端 Agent - 负责生成 API 接口和业务逻辑
 */
export declare class BackendAgent extends BaseAgent {
    constructor();
    /**
     * 加载默认技能
     */
    protected loadDefaultSkills(): Promise<void>;
    /**
     * 验证任务是否适合此 Agent
     */
    protected validateTask(task: Task): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * 选择适合任务的技能
     */
    protected selectSkills(task: Task): any[];
    /**
     * 执行任务的核心逻辑
     */
    protected executeWithContext(context: any): Promise<any>;
    /**
     * 生成后端代码
     */
    private generateBackendCode;
    /**
     * 生成认证 API
     */
    private generateAuthAPI;
    /**
     * 生成用户 API
     */
    private generateUserAPI;
    /**
     * 生成基础 API
     */
    private generateBaseAPI;
    /**
     * 获取 Agent 信息
     */
    getStatus(): AgentStatus;
}
//# sourceMappingURL=backend-agent.d.ts.map