/**
 * NightShift 模型路由系统
 * 智能分配模型给任务，支持三级路由策略和降级机制
 */

import {
  ModelRouter,
  Task,
  ModelConfig,
  RoutingResult,
  ExecutionResult,
  RouterConfig,
  UsageStats,
  RoutingRule,
  HealthStatus,
  RouterError,
  TaskComplexity,
  ModelType,
  ModelProvider,
  RoutingContext,
  ModelPerformance
} from './types/model-router.js';

import { 
  DEFAULT_ROUTER_CONFIG, 
  RouterConfigManager,
  RouterConfigValidator 
} from './config/router-config.js';

/**
 * 模型路由系统实现
 */
export class SmartModelRouter implements ModelRouter {
  private configManager: RouterConfigManager;
  private config: RouterConfig;
  private usageStats: UsageStats;
  private performanceHistory: Map<string, ModelPerformance> = new Map();
  private availableModels: Map<string, ModelConfig> = new Map();
  private routingRules: Map<string, RoutingRule> = new Map();
  private isInitialized = false;

  constructor(config?: Partial<RouterConfig>) {
    // 使用配置管理器
    this.configManager = new RouterConfigManager(config ? { ...DEFAULT_ROUTER_CONFIG, ...config } : undefined);
    this.config = this.configManager.getConfig();
    
    // 初始化用量统计
    this.usageStats = this.initializeUsageStats();
    
    // 注册配置中的模型和规则
    this.registerModelsFromConfig();
    this.registerRulesFromConfig();
    
    this.isInitialized = true;
    
    console.log('模型路由系统初始化完成');
  }

  /**
   * 路由任务到合适的模型
   */
  async route(task: Task): Promise<RoutingResult> {
    this.ensureInitialized();
    
    try {
      // 验证任务
      this.validateTask(task);
      
      // 分类任务复杂度
      const classification = this.classifyTask(task);
      
      // 创建路由上下文
      const context: RoutingContext = {
        task,
        availableModels: this.getAvailableModels(),
        currentUsage: this.usageStats,
        performanceHistory: Array.from(this.performanceHistory.values()),
        constraints: this.getRoutingConstraints(task)
      };
      
      // 应用路由规则
      const ruleBasedResult = this.applyRoutingRules(context);
      if (ruleBasedResult) {
        return ruleBasedResult;
      }
      
      // 智能路由决策
      return this.makeIntelligentRoutingDecision(context, classification);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new RouterError('invalid_task', `任务路由失败: ${errorMessage}`, error);
    }
  }

  /**
   * 执行模型调用
   */
  async execute(prompt: string, model: ModelConfig): Promise<ExecutionResult> {
    this.ensureInitialized();
    
    const startTime = Date.now();
    
    try {
      // 检查模型可用性
      if (!await this.isModelAvailable(model)) {
        throw new RouterError('model_unavailable', `模型不可用: ${model.name}`);
      }
      
      // 检查用量限制
      if (this.isLimitExceeded()) {
        throw new RouterError('quota_exceeded', '用量限制已超出');
      }
      
      // 执行模型调用
      let result: ExecutionResult;
      
      if (model.type === 'program') {
        // 0 token 本地程序执行
        result = await this.executeLocalProgram(model, prompt);
      } else if (model.type === 'local_model') {
        // 本地模型执行
        result = await this.executeLocalModel(model, prompt);
      } else {
        // 云端模型执行
        result = await this.executeCloudModel(model, prompt);
      }
      
      // 记录用量
      this.trackUsage(model.name, result.tokensUsed);
      
      // 更新性能指标
      this.updatePerformanceMetrics(model.name, result);
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // 记录失败
      this.recordFailure(model.name, error as Error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new RouterError('execution_timeout', `模型执行失败: ${errorMessage}`, {
        model: model.name,
        executionTime,
        error: errorMessage
      });
    }
  }

  /**
   * 记录模型用量
   */
  trackUsage(model: string, tokens: number): void {
    const cost = this.calculateCost(model, tokens);
    
    // 更新总用量
    this.usageStats.totalRequests++;
    this.usageStats.totalTokens += tokens;
    this.usageStats.totalCost += cost;
    
    // 更新模型用量
    const modelUsage = this.usageStats.modelUsage.get(model) || {
      model,
      requests: 0,
      tokens: 0,
      cost: 0,
      successRate: 0,
      averageLatency: 0
    };
    
    modelUsage.requests++;
    modelUsage.tokens += tokens;
    modelUsage.cost += cost;
    
    this.usageStats.modelUsage.set(model, modelUsage);
    
    // 更新时间序列
    const now = Date.now();
    const currentHour = Math.floor(now / (60 * 60 * 1000)) * 60 * 60 * 1000;
    
    let timeSeries = this.usageStats.timeSeries.find(ts => ts.timestamp === currentHour);
    if (!timeSeries) {
      timeSeries = {
        timestamp: currentHour,
        requests: 0,
        tokens: 0,
        cost: 0
      };
      this.usageStats.timeSeries.push(timeSeries);
    }
    
    timeSeries.requests++;
    timeSeries.tokens += tokens;
    timeSeries.cost += cost;
    
    // 清理旧的时间序列数据（保留最近24小时）
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    this.usageStats.timeSeries = this.usageStats.timeSeries.filter(
      ts => ts.timestamp >= twentyFourHoursAgo
    );
    
    console.log(`用量记录: ${model} - ${tokens} tokens, 成本: $${cost.toFixed(4)}`);
  }

  /**
   * 获取用量统计
   */
  getUsageStats(): UsageStats {
    return { ...this.usageStats };
  }

  /**
   * 重置用量统计
   */
  resetUsageStats(): void {
    this.usageStats = this.initializeUsageStats();
    console.log('用量统计已重置');
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RouterConfig>): void {
    this.configManager.updateConfig(config);
    this.config = this.configManager.getConfig();
    
    // 重新注册模型和规则
    this.registerModelsFromConfig();
    this.registerRulesFromConfig();
    
    console.log('路由配置已更新');
  }

  /**
   * 获取配置
   */
  getConfig(): RouterConfig {
    return this.configManager.getConfig();
  }

  /**
   * 重新加载配置
   */
  async reloadConfig(): Promise<void> {
    await this.configManager.reloadConfig();
    this.config = this.configManager.getConfig();
    
    // 重新注册模型和规则
    this.registerModelsFromConfig();
    this.registerRulesFromConfig();
    
    console.log('路由配置已重新加载');
  }

  /**
   * 设置配置文件路径
   */
  setConfigFile(filePath: string): void {
    this.configManager.setConfigFile(filePath);
  }

  /**
   * 导出配置
   */
  exportConfig(): string {
    return this.configManager.exportConfig();
  }

  /**
   * 导入配置
   */
  importConfig(configJson: string): void {
    this.configManager.importConfig(configJson);
    this.config = this.configManager.getConfig();
    
    // 重新注册模型和规则
    this.registerModelsFromConfig();
    this.registerRulesFromConfig();
  }

  /**
   * 注册模型
   */
  registerModel(model: ModelConfig): void {
    this.availableModels.set(model.name, model);
    console.log(`模型已注册: ${model.name}`);
  }

  /**
   * 注销模型
   */
  unregisterModel(modelName: string): void {
    this.availableModels.delete(modelName);
    console.log(`模型已注销: ${modelName}`);
  }

  /**
   * 获取可用模型
   */
  getAvailableModels(): ModelConfig[] {
    return Array.from(this.availableModels.values());
  }

  /**
   * 添加路由规则
   */
  addRule(rule: RoutingRule): void {
    this.routingRules.set(rule.id, rule);
    console.log(`路由规则已添加: ${rule.name}`);
  }

  /**
   * 删除路由规则
   */
  removeRule(ruleId: string): void {
    this.routingRules.delete(ruleId);
    console.log(`路由规则已删除: ${ruleId}`);
  }

  /**
   * 更新路由规则
   */
  updateRule(ruleId: string, updates: Partial<RoutingRule>): void {
    const rule = this.routingRules.get(ruleId);
    if (rule) {
      const updatedRule = { ...rule, ...updates };
      this.routingRules.set(ruleId, updatedRule);
      console.log(`路由规则已更新: ${ruleId}`);
    }
  }

  /**
   * 健康检查
   */
  healthCheck(): HealthStatus {
    const issues: any[] = [];
    const metrics = this.calculateHealthMetrics();
    
    // 检查模型可用性
    const availableModels = this.getAvailableModels().filter(model => 
      this.isModelAvailable(model)
    );
    
    if (availableModels.length === 0) {
      issues.push({
        type: 'model_unavailable',
        severity: 'high',
        description: '没有可用的模型',
        recommendation: '检查模型配置和网络连接'
      });
    }
    
    // 检查错误率
    if (metrics.errorRate > 0.1) { // 10% 错误率阈值
      issues.push({
        type: 'high_error_rate',
        severity: 'medium',
        description: `错误率过高: ${(metrics.errorRate * 100).toFixed(1)}%`,
        recommendation: '检查模型服务和网络连接'
      });
    }
    
    // 检查配额使用
    if (metrics.quotaUsage > 0.8) { // 80% 配额使用阈值
      issues.push({
        type: 'quota_exceeded',
        severity: 'medium',
        description: `配额使用率过高: ${(metrics.quotaUsage * 100).toFixed(1)}%`,
        recommendation: '考虑增加配额或优化用量'
      });
    }
    
    const status = issues.length === 0 ? 'healthy' : 
                  issues.some(issue => issue.severity === 'high') ? 'unhealthy' : 'degraded';
    
    return {
      status,
      issues,
      metrics
    };
  }

  /**
   * 私有方法实现
   */
  
  /**
   * 从配置注册模型
   */
  private registerModelsFromConfig(): void {
    // 清空现有模型
    this.availableModels.clear();
    
    // 注册配置中的所有模型
    this.config.models.forEach(model => {
      this.availableModels.set(model.name, model);
    });
    
    console.log(`从配置注册了 ${this.config.models.length} 个模型`);
  }
  
  /**
   * 从配置注册路由规则
   */
  private registerRulesFromConfig(): void {
    // 清空现有规则
    this.routingRules.clear();
    
    // 注册配置中的所有规则
    this.config.rules.forEach(rule => {
      this.routingRules.set(rule.id, rule);
    });
    
    console.log(`从配置注册了 ${this.config.rules.length} 个路由规则`);
  }

  /**
   * 初始化用量统计
   */
  private initializeUsageStats(): UsageStats {
    return {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      successRate: 1.0,
      averageLatency: 0,
      modelUsage: new Map(),
      timeSeries: []
    };
  }





  /**
   * 验证任务
   */
  private validateTask(task: Task): void {
    if (!task.id || !task.name || !task.description) {
      throw new Error('任务缺少必需字段');
    }
    
    if (task.estimatedTokens < 0) {
      throw new Error('预估 token 数不能为负数');
    }
    
    if (!['simple', 'medium', 'complex'].includes(task.complexity)) {
      throw new Error('无效的任务复杂度');
    }
  }

  /**
   * 分类任务复杂度
   */
  private classifyTask(task: Task): any {
    // 基于任务类型和描述的简单分类算法
    let complexity: TaskComplexity = 'simple';
    let estimatedTokens = task.estimatedTokens;
    let confidence = 0.8;
    
    // 根据任务类型调整复杂度
    switch (task.type) {
      case 'file_rename':
      case 'syntax_check':
      case 'type_validation':
        complexity = 'simple';
        estimatedTokens = 0;
        confidence = 0.95;
        break;
        
      case 'component_generation':
      case 'api_development':
      case 'bug_fixing':
      case 'documentation':
        complexity = 'medium';
        estimatedTokens = Math.max(estimatedTokens, 500);
        confidence = 0.85;
        break;
        
      case 'architecture_design':
      case 'coordination':
      case 'code_refactoring':
        complexity = 'complex';
        estimatedTokens = Math.max(estimatedTokens, 2000);
        confidence = 0.75;
        break;
    }
    
    // 根据描述长度调整复杂度
    const descriptionLength = task.description.length;
    if (descriptionLength > 500 && complexity === 'simple') {
      complexity = 'medium';
      confidence *= 0.9;
    }
    
    if (descriptionLength > 1000 && complexity === 'medium') {
      complexity = 'complex';
      confidence *= 0.8;
    }
    
    return {
      complexity,
      estimatedTokens,
      confidence,
      recommendedModelType: this.getModelTypeForComplexity(complexity)
    };
  }

  /**
   * 根据复杂度获取模型类型
   */
  private getModelTypeForComplexity(complexity: TaskComplexity): ModelType {
    switch (complexity) {
      case 'simple': return 'program';
      case 'medium': return 'local_model';
      case 'complex': return 'cloud_model';
      default: return 'local_model';
    }
  }

  /**
   * 应用路由规则
   */
  private applyRoutingRules(context: RoutingContext): RoutingResult | null {
    const enabledRules = Array.from(this.routingRules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);
    
    for (const rule of enabledRules) {
      if (this.ruleMatches(rule, context)) {
        const model = this.getModelFromRule(rule);
        if (model) {
          return {
            model,
            confidence: 0.9,
            reasoning: `匹配路由规则: ${rule.name}`,
            alternatives: this.getAlternativeModels(model, context)
          };
        }
      }
    }
    
    return null;
  }

  /**
   * 检查规则是否匹配
   */
  private ruleMatches(rule: RoutingRule, context: RoutingContext): boolean {
    return rule.conditions.every(condition => {
      switch (condition.type) {
        case 'task_type':
          return context.task.type === condition.value;
        case 'complexity':
          return context.task.complexity === condition.value;
        case 'technology':
          return this.checkTechnologyCondition(condition, context.task.technology);
        case 'token_estimate':
          return this.checkNumericCondition(context.task.estimatedTokens, condition);
        case 'priority':
          return context.task.priority === condition.value;
        default:
          return false;
      }
    });
  }

  /**
   * 检查技术条件
   */
  private checkTechnologyCondition(condition: any, technology?: any): boolean {
    if (!technology) return false;
    
    const techStack = JSON.stringify(technology);
    return techStack.includes(condition.value);
  }

  /**
   * 检查数值条件
   */
  private checkNumericCondition(value: number, condition: any): boolean {
    switch (condition.operator) {
      case 'equals': return value === condition.value;
      case 'greater_than': return value > condition.value;
      case 'less_than': return value < condition.value;
      default: return false;
    }
  }

  /**
   * 从规则获取模型
   */
  private getModelFromRule(rule: RoutingRule): ModelConfig | null {
    const modelAction = rule.actions.find(action => action.type === 'select_model');
    if (modelAction) {
      return this.availableModels.get(modelAction.value as string) || null;
    }
    return null;
  }

  /**
   * 智能路由决策
   */
  private makeIntelligentRoutingDecision(context: RoutingContext, classification: any): RoutingResult {
    const { complexity, estimatedTokens } = classification;
    
    // 获取适合的模型列表
    const suitableModels = this.getSuitableModels(context, complexity);
    
    if (suitableModels.length === 0) {
      throw new RouterError('no_available_models', '没有适合的可用模型');
    }
    
    // 选择最佳模型
    const bestModel = this.selectBestModel(suitableModels, context, estimatedTokens);
    
    return {
      model: bestModel,
      confidence: this.calculateRoutingConfidence(bestModel, context),
      reasoning: this.generateRoutingReasoning(bestModel, context, classification),
      alternatives: suitableModels.filter(model => model.name !== bestModel.name)
    };
  }

  /**
   * 获取适合的模型
   */
  private getSuitableModels(context: RoutingContext, complexity: TaskComplexity): ModelConfig[] {
    const targetType = this.getModelTypeForComplexity(complexity);
    
    return Array.from(this.availableModels.values()).filter(model => {
      // 检查模型类型
      if (model.type !== targetType) return false;
      
      // 检查能力匹配
      if (!this.modelHasRequiredCapabilities(model, context.task)) return false;
      
      // 检查技术栈支持
      if (!this.modelSupportsTechnology(model, context.task.technology)) return false;
      
      // 检查性能约束
      if (!this.modelMeetsPerformanceConstraints(model, context.constraints)) return false;
      
      return true;
    });
  }

  /**
   * 检查模型能力
   */
  private modelHasRequiredCapabilities(model: ModelConfig, task: Task): boolean {
    // 根据任务类型确定所需能力
    const requiredCapabilities = this.getRequiredCapabilitiesForTask(task.type);
    return requiredCapabilities.every(capability => 
      model.capabilities.includes(capability as any)
    );
  }

  /**
   * 获取任务所需能力
   */
  private getRequiredCapabilitiesForTask(taskType: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      'file_rename': ['code_analysis'],
      'syntax_check': ['code_analysis'],
      'type_validation': ['code_analysis'],
      'component_generation': ['code_generation'],
      'api_development': ['code_generation'],
      'architecture_design': ['architecture_design', 'planning'],
      'coordination': ['coordination'],
      'code_refactoring': ['refactoring'],
      'bug_fixing': ['bug_fixing'],
      'documentation': ['documentation']
    };
    
    return capabilityMap[taskType] || ['code_generation'];
  }

  /**
   * 检查技术栈支持
   */
  private modelSupportsTechnology(model: ModelConfig, technology?: any): boolean {
    if (!technology || model.supportedLanguages.includes('*')) {
      return true;
    }
    
    // 简化检查：如果模型支持任意相关语言
    const languages = new Set<string>();
    
    if (technology.frontend?.language) {
      languages.add(technology.frontend.language);
    }
    
    if (technology.backend?.language) {
      languages.add(technology.backend.language);
    }
    
    return Array.from(languages).some(lang => model.supportedLanguages.includes(lang));
  }

  /**
   * 检查性能约束
   */
  private modelMeetsPerformanceConstraints(model: ModelConfig, constraints: any[]): boolean {
    // 简化实现
    return true;
  }

  /**
   * 选择最佳模型
   */
  private selectBestModel(models: ModelConfig[], context: RoutingContext, estimatedTokens: number): ModelConfig {
    // 简单的成本效益选择算法
    return models.reduce((best, current) => {
      const bestScore = this.calculateModelScore(best, context, estimatedTokens);
      const currentScore = this.calculateModelScore(current, context, estimatedTokens);
      
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * 计算模型评分
   */
  private calculateModelScore(model: ModelConfig, context: RoutingContext, estimatedTokens: number): number {
    let score = 0;
    
    // 成本因素（越低越好）
    const cost = model.costPerToken * estimatedTokens;
    score += Math.max(0, 1 - cost * 1000); // 成本权重
    
    // 性能因素
      const performance = this.performanceHistory.get(model.name);
      if (performance) {
        const successRate = performance.totalRequests > 0 ? performance.successfulRequests / performance.totalRequests : 0;
        score += successRate * 0.5; // 成功率权重
        score += Math.max(0, 1 - performance.averageLatency / 10000) * 0.3; // 延迟权重
      }
    
    // 能力匹配因素
    const capabilityMatch = this.calculateCapabilityMatch(model, context.task);
    score += capabilityMatch * 0.2;
    
    return score;
  }

  /**
   * 计算能力匹配度
   */
  private calculateCapabilityMatch(model: ModelConfig, task: Task): number {
    const required = this.getRequiredCapabilitiesForTask(task.type);
    const matched = required.filter(cap => model.capabilities.includes(cap as any)).length;
    return matched / required.length;
  }

  /**
   * 计算路由置信度
   */
  private calculateRoutingConfidence(model: ModelConfig, context: RoutingContext): number {
    let confidence = 0.7; // 基础置信度
    
    // 性能历史影响
    const performance = this.performanceHistory.get(model.name);
    if (performance) {
      const successRate = performance.totalRequests > 0 ? performance.successfulRequests / performance.totalRequests : 0;
      confidence += successRate * 0.2;
    }
    
    // 用量影响（避免过度使用单一模型）
    const modelUsage = context.currentUsage.modelUsage.get(model.name);
    if (modelUsage) {
      const usageRatio = modelUsage.requests / context.currentUsage.totalRequests;
      confidence -= Math.min(usageRatio * 0.1, 0.1); // 使用率过高降低置信度
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * 生成路由理由
   */
  private generateRoutingReasoning(model: ModelConfig, context: RoutingContext, classification: any): string {
    const reasons: string[] = [];
    
    reasons.push(`任务复杂度: ${classification.complexity}`);
    reasons.push(`预估token数: ${classification.estimatedTokens}`);
    reasons.push(`模型类型: ${model.type}`);
    reasons.push(`提供商: ${model.provider}`);
    
    if (model.costPerToken > 0) {
      reasons.push(`预估成本: $${(model.costPerToken * classification.estimatedTokens).toFixed(4)}`);
    }
    
    return reasons.join(', ');
  }

  /**
   * 获取备选模型
   */
  private getAlternativeModels(primary: ModelConfig, context: RoutingContext): ModelConfig[] {
    const alternatives = Array.from(this.availableModels.values())
      .filter(model => 
        model.name !== primary.name && 
        model.type === primary.type &&
        this.modelHasRequiredCapabilities(model, context.task)
      )
      .slice(0, 3); // 最多返回3个备选
    
    return alternatives;
  }

  /**
   * 获取路由约束
   */
  private getRoutingConstraints(task: Task): any[] {
    const constraints: any[] = [];
    
    // 预算约束
    if (task.constraints?.some(c => c.type === 'budget')) {
      constraints.push({
        type: 'cost',
        value: task.constraints.find(c => c.type === 'budget')?.value || 10,
        priority: 1
      });
    }
    
    // 性能约束
    if (task.constraints?.some(c => c.type === 'performance')) {
      constraints.push({
        type: 'latency',
        value: 5000, // 5秒延迟阈值
        priority: 2
      });
    }
    
    return constraints;
  }

  /**
   * 检查模型可用性
   */
  private async isModelAvailable(model: ModelConfig): Promise<boolean> {
    // 简化实现：检查模型是否在可用列表中
    return this.availableModels.has(model.name);
  }

  /**
   * 检查用量限制
   */
  private isLimitExceeded(): boolean {
    const { dailyTokenLimit, monthlyCostLimit } = this.config.limits;
    
    // 检查每日token限制
    if (this.usageStats.totalTokens > dailyTokenLimit) {
      return true;
    }
    
    // 检查每月成本限制（简化：假设当前为当月）
    if (this.usageStats.totalCost > monthlyCostLimit) {
      return true;
    }
    
    return false;
  }

  /**
   * 执行本地程序
   */
  private async executeLocalProgram(model: ModelConfig, prompt: string): Promise<ExecutionResult> {
    // 简化实现：模拟本地程序执行
    const startTime = Date.now();
    
    // 模拟执行延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      output: `本地程序执行结果: ${prompt.substring(0, 100)}...`,
      model: model.name,
      tokensUsed: 0,
      executionTime,
      cost: 0
    };
  }

  /**
   * 执行本地模型
   */
  private async executeLocalModel(model: ModelConfig, prompt: string): Promise<ExecutionResult> {
    // 简化实现：模拟本地模型调用
    const startTime = Date.now();
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const executionTime = Date.now() - startTime;
    const tokensUsed = Math.ceil(prompt.length / 4); // 简单估算
    const cost = model.costPerToken * tokensUsed;
    
    return {
      success: true,
      output: `本地模型生成内容: ${prompt.substring(0, 200)}...`,
      model: model.name,
      tokensUsed,
      executionTime,
      cost
    };
  }

  /**
   * 执行云端模型
   */
  private async executeCloudModel(model: ModelConfig, prompt: string): Promise<ExecutionResult> {
    // 简化实现：模拟云端模型调用
    const startTime = Date.now();
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const executionTime = Date.now() - startTime;
    const tokensUsed = Math.ceil(prompt.length / 4); // 简单估算
    const cost = model.costPerToken * tokensUsed;
    
    return {
      success: true,
      output: `云端模型生成内容: ${prompt.substring(0, 300)}...`,
      model: model.name,
      tokensUsed,
      executionTime,
      cost
    };
  }

  /**
   * 计算成本
   */
  private calculateCost(model: string, tokens: number): number {
    const modelConfig = this.availableModels.get(model);
    if (!modelConfig) return 0;
    
    return modelConfig.costPerToken * tokens;
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(model: string, result: ExecutionResult): void {
    const existing = this.performanceHistory.get(model) || {
      model,
      totalRequests: 0,
      successfulRequests: 0,
      totalTokens: 0,
      averageLatency: 0,
      errorRate: 0,
      lastUsed: 0,
      costEfficiency: 0
    };
    
    existing.totalRequests++;
    existing.totalTokens += result.tokensUsed;
    existing.lastUsed = Date.now();
    
    if (result.success) {
      existing.successfulRequests++;
    }
    
    // 更新平均延迟（指数移动平均）
    const alpha = 0.1;
    existing.averageLatency = alpha * result.executionTime + (1 - alpha) * existing.averageLatency;
    
    // 更新错误率
    existing.errorRate = 1 - (existing.successfulRequests / existing.totalRequests);
    
    // 更新成本效率（token/成本）
    if (result.cost > 0) {
      existing.costEfficiency = existing.totalTokens / (existing.totalTokens * result.cost);
    }
    
    this.performanceHistory.set(model, existing);
  }

  /**
   * 记录失败
   */
  private recordFailure(model: string, error: Error): void {
    this.updatePerformanceMetrics(model, {
      success: false,
      output: '',
      model,
      tokensUsed: 0,
      executionTime: 0,
      cost: 0,
      error: error.message
    });
  }

  /**
   * 计算健康指标
   */
  private calculateHealthMetrics(): any {
    const totalModels = this.availableModels.size;
    const availableModels = Array.from(this.availableModels.values())
      .filter(model => this.isModelAvailable(model))
      .length;
    
    const performances = Array.from(this.performanceHistory.values());
    const totalRequests = performances.reduce((sum, p) => sum + p.totalRequests, 0);
    const successfulRequests = performances.reduce((sum, p) => sum + p.successfulRequests, 0);
    const totalLatency = performances.reduce((sum, p) => sum + p.averageLatency * p.totalRequests, 0);
    
    const averageLatency = totalRequests > 0 ? totalLatency / totalRequests : 0;
    const errorRate = totalRequests > 0 ? 1 - (successfulRequests / totalRequests) : 0;
    
    // 简化配额使用率计算
    const quotaUsage = Math.min(this.usageStats.totalCost / this.config.limits.monthlyCostLimit, 1);
    
    return {
      totalModels,
      availableModels,
      averageLatency,
      errorRate,
      quotaUsage
    };
  }



  /**
   * 确保系统已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new RouterError('invalid_task', '模型路由系统未初始化');
    }
  }

  /**
   * 获取默认降级选项
   */
  private getDefaultFallbackOptions(primaryModel: ModelConfig): any[] {
    if (primaryModel.fallback) {
      const fallbackModel = this.availableModels.get(primaryModel.fallback);
      if (fallbackModel) {
        return [{
          model: fallbackModel,
          condition: { type: 'error_type', value: 'any' },
          priority: 1
        }];
      }
    }
    
    // 默认降级到免费模型
    const freeModel = Array.from(this.availableModels.values())
      .find(model => model.costPerToken <= 0.000005);
    
    if (freeModel) {
      return [{
        model: freeModel,
        condition: { type: 'error_type', value: 'any' },
        priority: 1
      }];
    }
    
    return [];
  }
}