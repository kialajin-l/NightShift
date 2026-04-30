import { BaseAgent } from './base-agent';
import { Task, AgentStatus } from './types/agent';
/**
 * 前端 Agent - 负责生成前端组件和界面
 */
export declare class FrontendAgent extends BaseAgent {
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
     * 生成前端代码
     */
    private generateFrontendCode;
    /**
     * 生成登录表单组件
     */
    private generateLoginForm;
    /**
     * 生成注册表单组件
     */
    private generateRegisterForm;
    /**
     * 生成基础组件
     */
    private generateBaseComponent;
    /**
     * 获取 Agent 信息
     */
    getStatus(): AgentStatus;
}
//# sourceMappingURL=frontend-agent.d.ts.map