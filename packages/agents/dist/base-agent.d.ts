/**
 * 基础 Agent 类
 * 提供所有 Agent 的通用功能和生命周期管理
 */
import { Agent, Task, TaskOutput, Rule, AgentStatus, AgentConfig, Skill, SkillInput, SkillContext, SkillOutput, ModelRouter, SkillManager, ProjectContext, ExecutionContext, ExecutionResult, ValidationResult } from './types/agent.js';
/**
 * 基础 Agent 实现
 */
export declare abstract class BaseAgent implements Agent {
    readonly id: string;
    readonly name: string;
    readonly role: string;
    model: string;
    skills: Skill[];
    protected config: AgentConfig;
    protected status: AgentStatus;
    protected rules: Rule[];
    protected skillManager: SkillManager;
    protected modelRouter: ModelRouter;
    protected projectContext?: ProjectContext;
    private isInitialized;
    private currentTask?;
    private taskHistory;
    constructor(id: string, name: string, role: string, model: string, skillManager: SkillManager, modelRouter: ModelRouter, config?: Partial<AgentConfig>);
    /**
     * 初始化 Agent
     */
    initialize(): Promise<void>;
    /**
     * 关闭 Agent
     */
    shutdown(): Promise<void>;
    /**
     * 执行任务
     */
    execute(task: Task): Promise<TaskOutput>;
    /**
     * 加载规则
     */
    loadRules(rules: Rule[]): void;
    /**
     * 获取 Agent 状态
     */
    getStatus(): AgentStatus;
    /**
     * 获取能力列表
     */
    getCapabilities(): string[];
    /**
     * 更新配置
     */
    updateConfig(config: Partial<AgentConfig>): void;
    /**
     * 获取配置
     */
    getConfig(): AgentConfig;
    /**
     * 设置项目上下文
     */
    setProjectContext(context: ProjectContext): void;
    /**
     * 抽象方法 - 子类必须实现
     */
    /**
     * 加载默认技能
     */
    protected abstract loadDefaultSkills(): Promise<void>;
    /**
     * 验证任务是否适合此 Agent
     */
    protected abstract validateTask(task: Task): ValidationResult;
    /**
     * 选择适合任务的技能
     */
    protected abstract selectSkills(task: Task): Skill[];
    /**
     * 执行任务的核心逻辑
     */
    protected abstract executeWithContext(context: ExecutionContext): Promise<ExecutionResult>;
    /**
     * 保护方法
     */
    /**
     * 确保 Agent 已准备就绪
     */
    protected ensureReady(): void;
    /**
     * 设置忙碌状态
     */
    protected setBusy(taskId: string): void;
    /**
     * 设置空闲状态
     */
    protected setIdle(): void;
    /**
     * 选择模型
     */
    protected selectModel(task: Task): string;
    /**
     * 应用模型选择规则
     */
    protected applyModelSelectionRules(task: Task): string | null;
    /**
     * 检查规则是否匹配
     */
    protected ruleMatches(rule: Rule, task: Task): boolean;
    /**
     * 评估条件
     */
    protected evaluateCondition(value: any, condition: any): boolean;
    /**
     * 评估技术条件
     */
    protected evaluateTechnologyCondition(technology: any, condition: any): boolean;
    /**
     * 评估复杂度条件
     */
    protected evaluateComplexityCondition(description: string, condition: any): boolean;
    /**
     * 获取可用模型
     */
    protected getAvailableModels(): string[];
    /**
     * 验证技能配置
     */
    protected validateSkills(): ValidationResult;
    /**
     * 记录执行历史
     */
    protected recordExecution(taskId: string, success: boolean, executionTime: number): void;
    /**
     * 日志记录
     */
    protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void;
    /**
     * 执行单个技能
     */
    protected executeSkill(skill: Skill, input: SkillInput, context: SkillContext): Promise<SkillOutput>;
    /**
     * 组合多个技能的执行结果
     */
    protected combineSkillOutputs(outputs: SkillOutput[]): any;
}
//# sourceMappingURL=base-agent.d.ts.map