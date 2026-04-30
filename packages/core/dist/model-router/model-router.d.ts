/**
 * NightShift 模型路由系统
 * 智能分配模型给任务，支持三级路由策略和降级机制
 */
import { ModelRouter, Task, ModelConfig, RoutingResult, ExecutionResult, RouterConfig, UsageStats, RoutingRule, HealthStatus } from './types/model-router.js';
/**
 * 模型路由系统实现
 */
export declare class SmartModelRouter implements ModelRouter {
    private configManager;
    private config;
    private usageStats;
    private performanceHistory;
    private availableModels;
    private routingRules;
    private isInitialized;
    constructor(config?: Partial<RouterConfig>);
    /**
     * 路由任务到合适的模型
     */
    route(task: Task): Promise<RoutingResult>;
    /**
     * 执行模型调用
     */
    execute(prompt: string, model: ModelConfig): Promise<ExecutionResult>;
    /**
     * 记录模型用量
     */
    trackUsage(model: string, tokens: number): void;
    /**
     * 获取用量统计
     */
    getUsageStats(): UsageStats;
    /**
     * 重置用量统计
     */
    resetUsageStats(): void;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<RouterConfig>): void;
    /**
     * 获取配置
     */
    getConfig(): RouterConfig;
    /**
     * 重新加载配置
     */
    reloadConfig(): Promise<void>;
    /**
     * 设置配置文件路径
     */
    setConfigFile(filePath: string): void;
    /**
     * 导出配置
     */
    exportConfig(): string;
    /**
     * 导入配置
     */
    importConfig(configJson: string): void;
    /**
     * 注册模型
     */
    registerModel(model: ModelConfig): void;
    /**
     * 注销模型
     */
    unregisterModel(modelName: string): void;
    /**
     * 获取可用模型
     */
    getAvailableModels(): ModelConfig[];
    /**
     * 添加路由规则
     */
    addRule(rule: RoutingRule): void;
    /**
     * 删除路由规则
     */
    removeRule(ruleId: string): void;
    /**
     * 更新路由规则
     */
    updateRule(ruleId: string, updates: Partial<RoutingRule>): void;
    /**
     * 健康检查
     */
    healthCheck(): HealthStatus;
    /**
     * 私有方法实现
     */
    /**
     * 从配置注册模型
     */
    private registerModelsFromConfig;
    /**
     * 从配置注册路由规则
     */
    private registerRulesFromConfig;
    /**
     * 初始化用量统计
     */
    private initializeUsageStats;
    /**
     * 验证任务
     */
    private validateTask;
    /**
     * 分类任务复杂度
     */
    private classifyTask;
    /**
     * 根据复杂度获取模型类型
     */
    private getModelTypeForComplexity;
    /**
     * 应用路由规则
     */
    private applyRoutingRules;
    /**
     * 检查规则是否匹配
     */
    private ruleMatches;
    /**
     * 检查技术条件
     */
    private checkTechnologyCondition;
    /**
     * 检查数值条件
     */
    private checkNumericCondition;
    /**
     * 从规则获取模型
     */
    private getModelFromRule;
    /**
     * 智能路由决策
     */
    private makeIntelligentRoutingDecision;
    /**
     * 获取适合的模型
     */
    private getSuitableModels;
    /**
     * 检查模型能力
     */
    private modelHasRequiredCapabilities;
    /**
     * 获取任务所需能力
     */
    private getRequiredCapabilitiesForTask;
    /**
     * 检查技术栈支持
     */
    private modelSupportsTechnology;
    /**
     * 检查性能约束
     */
    private modelMeetsPerformanceConstraints;
    /**
     * 选择最佳模型
     */
    private selectBestModel;
    /**
     * 计算模型评分
     */
    private calculateModelScore;
    /**
     * 计算能力匹配度
     */
    private calculateCapabilityMatch;
    /**
     * 计算路由置信度
     */
    private calculateRoutingConfidence;
    /**
     * 生成路由理由
     */
    private generateRoutingReasoning;
    /**
     * 获取备选模型
     */
    private getAlternativeModels;
    /**
     * 获取路由约束
     */
    private getRoutingConstraints;
    /**
     * 检查模型可用性
     */
    private isModelAvailable;
    /**
     * 检查用量限制
     */
    private isLimitExceeded;
    /**
     * 执行本地程序
     */
    private executeLocalProgram;
    /**
     * 执行本地模型
     */
    private executeLocalModel;
    /**
     * 执行云端模型
     */
    private executeCloudModel;
    /**
     * 计算成本
     */
    private calculateCost;
    /**
     * 更新性能指标
     */
    private updatePerformanceMetrics;
    /**
     * 记录失败
     */
    private recordFailure;
    /**
     * 计算健康指标
     */
    private calculateHealthMetrics;
    /**
     * 确保系统已初始化
     */
    private ensureInitialized;
    /**
     * 获取默认降级选项
     */
    private getDefaultFallbackOptions;
}
//# sourceMappingURL=model-router.d.ts.map