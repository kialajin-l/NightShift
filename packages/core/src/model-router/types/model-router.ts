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
export type TaskType = 
  | 'file_rename'          // 文件重命名
  | 'syntax_check'         // 语法检查
  | 'type_validation'      // 类型验证
  | 'component_generation' // 组件生成
  | 'api_development'      // API开发
  | 'architecture_design'  // 架构设计
  | 'coordination'         // 跨模块协调
  | 'code_refactoring'     // 代码重构
  | 'bug_fixing'          // Bug修复
  | 'documentation';       // 文档生成

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
  costPerToken: number; // 每 token 成本（美元）
  maxTokens: number;
  contextLength: number;
  supportedLanguages: string[];
  endpoint?: string;    // API 端点
  apiKey?: string;      // API 密钥
  timeout: number;      // 超时时间（毫秒）
  fallback?: string;    // 降级模型
}

/**
 * 模型提供商
 */
export type ModelProvider = 
  | 'local'           // 本地程序
  | 'ollama'          // Ollama 本地模型
  | 'openai'          // OpenAI
  | 'anthropic'       // Anthropic
  | 'google'          // Google
  | 'openrouter'      // OpenRouter
  | 'azure'           // Azure OpenAI
  | 'custom';         // 自定义提供商

/**
 * 模型类型
 */
export type ModelType = 
  | 'program'         // 本地程序（0 token）
  | 'local_model'     // 本地模型
  | 'cloud_model';    // 云端模型

/**
 * 模型能力
 */
export type ModelCapability = 
  | 'code_generation'     // 代码生成
  | 'code_analysis'       // 代码分析
  | 'architecture_design' // 架构设计
  | 'documentation'       // 文档生成
  | 'refactoring'         // 代码重构
  | 'bug_fixing'         // Bug修复
  | 'coordination'        // 协调沟通
  | 'planning';          // 规划制定

/**
 * 路由规则
 */
export interface RoutingRule {
  id: string;
  name: string;
  conditions: RoutingCondition[];
  actions: RoutingAction[];
  priority: number; // 优先级（数值越大优先级越高）
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
  confidence: number; // 置信度 0-1
  reasoning: string;  // 路由理由
  alternatives: ModelConfig[]; // 备选模型
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
  userPromptThreshold: number; // 用户提示阈值（成本或失败次数）
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
  // 模型配置
  models: ModelConfig[];
  
  // 路由规则
  rules: RoutingRule[];
  
  // 降级策略
  fallback: FallbackStrategy;
  
  // 用量限制
  limits: {
    dailyTokenLimit: number;
    monthlyCostLimit: number;
    maxRequestPerMinute: number;
  };
  
  // 监控配置
  monitoring: {
    enableUsageTracking: boolean;
    enablePerformanceMonitoring: boolean;
    alertThresholds: AlertThreshold[];
  };
  
  // 日志配置
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
  // 核心路由功能
  route(task: Task): Promise<RoutingResult>;
  execute(prompt: string, model: ModelConfig): Promise<ExecutionResult>;
  
  // 用量统计
  trackUsage(model: string, tokens: number): void;
  getUsageStats(): UsageStats;
  resetUsageStats(): void;
  
  // 配置管理
  updateConfig(config: Partial<RouterConfig>): void;
  getConfig(): RouterConfig;
  
  // 模型管理
  registerModel(model: ModelConfig): void;
  unregisterModel(modelName: string): void;
  getAvailableModels(): ModelConfig[];
  
  // 规则管理
  addRule(rule: RoutingRule): void;
  removeRule(ruleId: string): void;
  updateRule(ruleId: string, updates: Partial<RoutingRule>): void;
  
  // 健康检查
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
  quotaUsage: number; // 配额使用率 0-1
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
export type RouterErrorType = 
  | 'no_available_models'
  | 'model_unavailable'
  | 'quota_exceeded'
  | 'invalid_task'
  | 'execution_timeout'
  | 'network_error';

/**
 * 路由错误类
 */
export class RouterError extends Error {
  constructor(
    public type: RouterErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'RouterError';
  }
}

/**
 * 本地程序执行器配置
 */
export interface ProgramExecutorConfig {
  // 文件重命名
  fileRename: {
    command: string;
    args: string[];
  };
  
  // 语法检查
  syntaxCheck: {
    command: string;
    args: string[];
  };
  
  // 类型验证
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
  costEfficiency: number; // 成本效率指标
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