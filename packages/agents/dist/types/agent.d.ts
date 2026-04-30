/**
 * Agent 执行器类型定义
 */
/**
 * 任务输入接口
 */
export interface Task {
    id: string;
    name: string;
    description: string;
    type: TaskType;
    input: TaskInput;
    technology: TechnologyStack;
    constraints: TaskConstraint[];
    priority: TaskPriority;
    estimatedTime: number;
    dependencies: string[];
    context: TaskContext;
}
/**
 * 任务类型
 */
export type TaskType = 'component_generation' | 'api_implementation' | 'database_design' | 'authentication_setup' | 'task_decomposition' | 'conflict_resolution';
/**
 * 任务输入数据
 */
export interface TaskInput {
    requirements: string;
    examples?: any[];
    specifications?: Record<string, any>;
    existingCode?: string;
    dataModels?: DataModel[];
}
/**
 * 技术栈配置
 */
export interface TechnologyStack {
    frontend?: {
        framework: 'vue' | 'react' | 'angular';
        language: 'typescript' | 'javascript';
        styling: 'tailwind' | 'css' | 'scss';
        stateManagement?: 'pinia' | 'redux' | 'vuex';
    };
    backend?: {
        framework: 'fastapi' | 'express' | 'spring';
        language: 'python' | 'javascript' | 'java';
        database: 'postgresql' | 'mysql' | 'mongodb';
        authentication?: 'jwt' | 'oauth' | 'session';
    };
}
/**
 * 数据模型
 */
export interface DataModel {
    name: string;
    fields: ModelField[];
    relationships?: ModelRelationship[];
}
export interface ModelField {
    name: string;
    type: string;
    required: boolean;
    constraints?: string[];
}
export interface ModelRelationship {
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    target: string;
    foreignKey?: string;
}
/**
 * 任务约束
 */
export interface TaskConstraint {
    type: 'performance' | 'security' | 'compatibility' | 'style';
    description: string;
    level: 'required' | 'recommended' | 'optional';
}
/**
 * 任务优先级
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
/**
 * 任务上下文
 */
export interface TaskContext {
    project: {
        name: string;
        type: string;
        architecture: string;
    };
    team: {
        size: number;
        skills: string[];
    };
    environment: {
        deployment: 'cloud' | 'on-premise';
        scaling: 'horizontal' | 'vertical';
    };
}
/**
 * 任务输出
 */
export interface TaskOutput {
    success: boolean;
    generatedCode?: string;
    documentation?: string;
    testCases?: string[];
    analysis?: TaskAnalysis;
    recommendations?: string[];
    executionTime: number;
    tokensUsed?: number;
    model: string;
    error?: string;
    errorDetails?: any;
}
/**
 * 任务分析
 */
export interface TaskAnalysis {
    complexity: 'simple' | 'medium' | 'complex';
    quality: number;
    risks: RiskAssessment[];
    improvements: string[];
}
/**
 * 风险评估
 */
export interface RiskAssessment {
    type: 'security' | 'performance' | 'maintainability';
    level: 'low' | 'medium' | 'high';
    description: string;
    mitigation: string;
}
/**
 * Skill 技能接口
 */
export interface Skill {
    id: string;
    name: string;
    description: string;
    version: string;
    capabilities: string[];
    supportedTechnologies: string[];
    execute(input: SkillInput, context: SkillContext): Promise<SkillOutput>;
    validate(input: SkillInput): ValidationResult;
    config?: Record<string, any>;
}
/**
 * Skill 输入
 */
export interface SkillInput {
    task: Task;
    requirements: string;
    context: Record<string, any>;
}
/**
 * Skill 上下文
 */
export interface SkillContext {
    agent: Agent;
    project: ProjectContext;
    availableModels: string[];
}
/**
 * Skill 输出
 */
export interface SkillOutput {
    success: boolean;
    result: any;
    metadata: SkillMetadata;
    error?: string;
}
/**
 * Skill 元数据
 */
export interface SkillMetadata {
    executionTime: number;
    tokensUsed?: number;
    model?: string;
    qualityScore?: number;
}
/**
 * 验证结果
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Agent 接口
 */
export interface Agent {
    id: string;
    name: string;
    role: string;
    model: string;
    skills: Skill[];
    execute(task: Task): Promise<TaskOutput>;
    loadRules(rules: Rule[]): void;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    getStatus(): AgentStatus;
    getCapabilities(): string[];
    updateConfig(config: AgentConfig): void;
    getConfig(): AgentConfig;
}
/**
 * Agent 状态
 */
export interface AgentStatus {
    isReady: boolean;
    isBusy: boolean;
    currentTask?: string;
    completedTasks: number;
    successRate: number;
    averageExecutionTime: number;
}
/**
 * Agent 配置
 */
export interface AgentConfig {
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
    maxRetries: number;
    qualityThreshold: number;
    codeStyle: CodeStyleConfig;
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
        enablePerformance: boolean;
    };
}
/**
 * 代码风格配置
 */
export interface CodeStyleConfig {
    indent: number;
    quoteStyle: 'single' | 'double';
    trailingComma: boolean;
    semicolons: boolean;
    lineLength: number;
}
/**
 * 规则接口
 */
export interface Rule {
    id: string;
    name: string;
    description: string;
    conditions: RuleCondition[];
    actions: RuleAction[];
    priority: number;
    scope: RuleScope;
}
export interface RuleCondition {
    type: 'task_type' | 'technology' | 'complexity';
    field: string;
    operator: 'equals' | 'contains' | 'greater_than';
    value: any;
}
export interface RuleAction {
    type: 'skill_selection' | 'model_routing' | 'parameter_adjustment';
    target: string;
    parameters: Record<string, any>;
}
export interface RuleScope {
    agents: string[];
    tasks: string[];
    technologies: string[];
}
/**
 * 项目上下文
 */
export interface ProjectContext {
    name: string;
    description: string;
    technologies: string[];
    team: TeamInfo;
    constraints: ProjectConstraint[];
}
export interface TeamInfo {
    size: number;
    skills: string[];
    experience: number;
}
export interface ProjectConstraint {
    type: 'time' | 'budget' | 'quality' | 'security';
    description: string;
    value: any;
}
/**
 * 模型路由配置
 */
export interface ModelRouter {
    route(task: Task, availableModels: string[]): string;
    getModelInfo(model: string): ModelInfo;
    trackPerformance(model: string, metrics: ModelMetrics): void;
}
export interface ModelInfo {
    name: string;
    provider: string;
    capabilities: string[];
    costPerToken: number;
    maxTokens: number;
    supportedLanguages: string[];
}
export interface ModelMetrics {
    executionTime: number;
    tokensUsed: number;
    success: boolean;
    qualityScore: number;
}
/**
 * 技能管理器
 */
export interface SkillManager {
    registerSkill(skill: Skill): void;
    unregisterSkill(skillId: string): void;
    findSkills(capabilities: string[]): Skill[];
    getSkill(skillId: string): Skill | null;
    composeSkills(skillIds: string[]): CompositeSkill;
}
export interface CompositeSkill {
    id: string;
    name: string;
    skills: Skill[];
    execute(input: SkillInput, context: SkillContext): Promise<SkillOutput>;
}
/**
 * Agent 错误类型
 */
export type AgentErrorType = 'invalid_task' | 'skill_not_found' | 'model_unavailable' | 'timeout' | 'validation_failed' | 'execution_error';
/**
 * Agent 错误
 */
export declare class AgentError extends Error {
    type: AgentErrorType;
    details?: any | undefined;
    constructor(type: AgentErrorType, message: string, details?: any | undefined);
}
/**
 * 执行上下文
 */
export interface ExecutionContext {
    agent: Agent;
    task: Task;
    skills: Skill[];
    model: string;
    startTime: Date;
    intermediateResults: Map<string, any>;
    config: ExecutionConfig;
}
export interface ExecutionConfig {
    enableDebug: boolean;
    saveIntermediate: boolean;
    maxIterations: number;
    qualityThreshold: number;
}
/**
 * 执行结果
 */
export interface ExecutionResult {
    success: boolean;
    output: TaskOutput;
    context: ExecutionContext;
    metrics: ExecutionMetrics;
}
export interface ExecutionMetrics {
    totalTime: number;
    skillExecutionCount: number;
    tokensUsed: number;
    qualityScore: number;
    errorCount: number;
}
/**
 * Agent 执行结果
 */
export interface AgentResult {
    success: boolean;
    output: any;
    metadata?: Record<string, any>;
    error?: string;
    errorDetails?: any;
}
//# sourceMappingURL=agent.d.ts.map