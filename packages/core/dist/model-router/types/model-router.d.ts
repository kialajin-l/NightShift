/**
 * 模型路由系统类型定义
 */
/**
 * 任务接口
 */
export interface Task {
    id: string;
    name: string;
    description: string;
    type: TaskType;
    complexity: TaskComplexity;
    estimatedTokens: number;
    technology?: TechnologyStack;
    constraints?: TaskConstraint[];
    priority: TaskPriority;
}
/**
 * 任务类型
 */
export type TaskType = 'file_rename' | 'syntax_check' | 'type_validation' | 'component_generation' | 'api_development' | 'architecture_design' | 'coordination' | 'code_refactoring' | 'bug_fixing' | 'documentation';
/**
 * 任务复杂度
 */
export type TaskComplexity = 'simple' | 'medium' | 'complex';
/**
 * 技术栈
 */
export interface TechnologyStack {
    frontend?: {
        framework: 'vue' | 'react' | 'angular';
        language: 'typescript' | 'javascript';
    };
    backend?: {
        framework: 'fastapi' | 'express' | 'spring';
        language: 'python' | 'javascript' | 'java';
    };
    database?: 'postgresql' | 'mysql' | 'mongodb';
}
/**
 * 任务约束
 */
export interface TaskConstraint {
    type: 'performance' | 'security' | 'compatibility' | 'budget';
    description: string;
    value?: any;
}
/**
 * 任务优先级
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
/**
 * 模型配置
 */
export interface ModelConfig {
    name: string;
    provider: ModelProvider;
    type: ModelType;
    capabilities: ModelCapability[];
    costPerToken: number;
    maxTokens: number;
    contextLength: number;
    supportedLanguages: string[];
    endpoint?: string;
    apiKey?: string;
    timeout: number;
    fallback?: string;
}
/**
 * 模型提供商
 */
export type ModelProvider = 'local' | 'ollama' | 'openai' | 'anthropic' | 'google' | 'openrouter' | 'azure' | 'custom';
/**
 * 模型类型
 */
export type ModelType = 'program' | 'local_model' | 'cloud_model';
/**
 * 模型能力
 */
export type ModelCapability = 'code_generation' | 'code_analysis' | 'architecture_design' | 'documentation' | 'refactoring' | 'bug_fixing' | 'coordination' | 'planning';
/**
 * 路由规则
 */
export interface RoutingRule {
    id: string;
    name: string;
    conditions: RoutingCondition[];
    actions: RoutingAction[];
    priority: number;
    enabled: boolean;
}
/**
 * 路由条件
 */
export interface RoutingCondition {
    type: 'task_type' | 'complexity' | 'technology' | 'token_estimate' | 'priority';
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
    value: any;
}
/**
 * 路由动作
 */
export interface RoutingAction {
    type: 'select_model' | 'set_parameter' | 'apply_fallback';
    target: string;
    value: any;
}
/**
 * 路由结果
 */
export interface RoutingResult {
    model: ModelConfig;
    confidence: number;
    reasoning: string;
    alternatives: ModelConfig[];
}
/**
 * 执行结果
 */
export interface ExecutionResult {
    success: boolean;
    output: string;
    model: string;
    tokensUsed: number;
    executionTime: number;
    cost: number;
    error?: string;
    fallbackUsed?: boolean;
}
/**
 * 用量统计
 */
export interface UsageStats {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    successRate: number;
    averageLatency: number;
    modelUsage: Map<string, ModelUsage>;
    timeSeries: UsageTimeSeries[];
}
/**
 * 模型使用情况
 */
export interface ModelUsage {
    model: string;
    requests: number;
    tokens: number;
    cost: number;
    successRate: number;
    averageLatency: number;
}
/**
 * 时间序列用量数据
 */
export interface UsageTimeSeries {
    timestamp: number;
    requests: number;
    tokens: number;
    cost: number;
}
/**
 * 降级策略
 */
export interface FallbackStrategy {
    primary: ModelConfig;
    fallbacks: FallbackOption[];
    maxAttempts: number;
    userPromptThreshold: number;
}
/**
 * 降级选项
 */
export interface FallbackOption {
    model: ModelConfig;
    condition: FallbackCondition;
    priority: number;
}
/**
 * 降级条件
 */
export interface FallbackCondition {
    type: 'error_type' | 'cost_threshold' | 'latency_threshold' | 'availability';
    value: any;
}
/**
 * 路由配置
 */
export interface RouterConfig {
    models: ModelConfig[];
    rules: RoutingRule[];
    fallback: FallbackStrategy;
    limits: {
        dailyTokenLimit: number;
        monthlyCostLimit: number;
        maxRequestPerMinute: number;
    };
    monitoring: {
        enableUsageTracking: boolean;
        enablePerformanceMonitoring: boolean;
        alertThresholds: AlertThreshold[];
    };
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
        enableRequestLogging: boolean;
        enableResponseLogging: boolean;
    };
}
/**
 * 告警阈值
 */
export interface AlertThreshold {
    metric: 'cost' | 'tokens' | 'error_rate' | 'latency';
    threshold: number;
    severity: 'low' | 'medium' | 'high';
    action: 'log' | 'alert' | 'throttle';
}
/**
 * 模型路由接口
 */
export interface ModelRouter {
    route(task: Task): Promise<RoutingResult>;
    execute(prompt: string, model: ModelConfig): Promise<ExecutionResult>;
    trackUsage(model: string, tokens: number): void;
    getUsageStats(): UsageStats;
    resetUsageStats(): void;
    updateConfig(config: Partial<RouterConfig>): void;
    getConfig(): RouterConfig;
    registerModel(model: ModelConfig): void;
    unregisterModel(modelName: string): void;
    getAvailableModels(): ModelConfig[];
    addRule(rule: RoutingRule): void;
    removeRule(ruleId: string): void;
    updateRule(ruleId: string, updates: Partial<RoutingRule>): void;
    healthCheck(): HealthStatus;
}
/**
 * 健康状态
 */
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: HealthIssue[];
    metrics: HealthMetrics;
}
/**
 * 健康问题
 */
export interface HealthIssue {
    type: 'model_unavailable' | 'high_error_rate' | 'high_latency' | 'quota_exceeded';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
}
/**
 * 健康指标
 */
export interface HealthMetrics {
    totalModels: number;
    availableModels: number;
    averageLatency: number;
    errorRate: number;
    quotaUsage: number;
}
/**
 * 任务分类结果
 */
export interface TaskClassification {
    complexity: TaskComplexity;
    estimatedTokens: number;
    recommendedModelType: ModelType;
    confidence: number;
    features: ClassificationFeature[];
}
/**
 * 分类特征
 */
export interface ClassificationFeature {
    name: string;
    value: any;
    weight: number;
}
/**
 * 模型执行器接口
 */
export interface ModelExecutor {
    execute(model: ModelConfig, prompt: string): Promise<ExecutionResult>;
    isAvailable(model: ModelConfig): Promise<boolean>;
    getLatency(model: ModelConfig): Promise<number>;
}
/**
 * 用量追踪器接口
 */
export interface UsageTracker {
    trackRequest(model: string, tokens: number, cost: number, success: boolean, latency: number): void;
    getStats(): UsageStats;
    reset(): void;
    isLimitExceeded(): boolean;
}
/**
 * 降级管理器接口
 */
export interface FallbackManager {
    getFallbackOptions(primaryModel: ModelConfig, error?: Error): FallbackOption[];
    shouldPromptUser(attempts: number, totalCost: number): boolean;
    recordFailure(model: string, error: Error): void;
}
/**
 * 路由错误类型
 */
export type RouterErrorType = 'no_available_models' | 'model_unavailable' | 'quota_exceeded' | 'invalid_task' | 'execution_timeout' | 'network_error';
/**
 * 路由错误类
 */
export declare class RouterError extends Error {
    type: RouterErrorType;
    details?: any | undefined;
    constructor(type: RouterErrorType, message: string, details?: any | undefined);
}
/**
 * 本地程序执行器配置
 */
export interface ProgramExecutorConfig {
    fileRename: {
        command: string;
        args: string[];
    };
    syntaxCheck: {
        command: string;
        args: string[];
    };
    typeValidation: {
        command: string;
        args: string[];
    };
}
/**
 * 模型性能指标
 */
export interface ModelPerformance {
    model: string;
    totalRequests: number;
    successfulRequests: number;
    totalTokens: number;
    averageLatency: number;
    errorRate: number;
    lastUsed: number;
    costEfficiency: number;
}
/**
 * 路由决策上下文
 */
export interface RoutingContext {
    task: Task;
    availableModels: ModelConfig[];
    currentUsage: UsageStats;
    performanceHistory: ModelPerformance[];
    constraints: RoutingConstraint[];
}
/**
 * 路由约束
 */
export interface RoutingConstraint {
    type: 'cost' | 'latency' | 'availability' | 'privacy';
    value: any;
    priority: number;
}
//# sourceMappingURL=model-router.d.ts.map