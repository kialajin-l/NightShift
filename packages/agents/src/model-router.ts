/**
 * 模型路由器 - 智能选择最适合的LLM模型
 * 基于任务类型、复杂度、成本等因素进行路由决策
 */

import { Task, ModelRouter as IModelRouter, ModelInfo, ModelMetrics } from './types/agent.js';

interface ModelRouterConfig {
  costOptimization?: boolean;
  performanceOptimization?: boolean;
  qualityOptimization?: boolean;
  fallbackModel?: string;
  modelWeights?: Record<string, number>;
}

interface ModelPerformance {
  successRate: number;
  averageExecutionTime: number;
  averageQualityScore: number;
  costPerToken: number;
  usageCount: number;
}

export class ModelRouter implements IModelRouter {
  private config: Required<ModelRouterConfig>;
  private modelRegistry: Map<string, ModelInfo>;
  private performanceTracker: Map<string, ModelPerformance>;
  private _logger: Console;

  constructor(config: ModelRouterConfig = {}) {
    this.config = {
      costOptimization: config.costOptimization ?? true,
      performanceOptimization: config.performanceOptimization ?? true,
      qualityOptimization: config.qualityOptimization ?? true,
      fallbackModel: config.fallbackModel ?? 'gpt-3.5-turbo',
      modelWeights: config.modelWeights ?? {}
    };

    this.modelRegistry = new Map();
    this.performanceTracker = new Map();
    this._logger = console;

    this.initializeDefaultModels();
  }

  /**
   * 路由任务到最适合的模型
   */
  route(task: Task, availableModels: string[]): string {
    if (availableModels.length === 0) {
      return this.config.fallbackModel;
    }

    if (availableModels.length === 1) {
      return availableModels[0];
    }

    // 计算每个模型的得分
    const modelScores = availableModels.map(model => {
      const score = this.calculateModelScore(model, task);
      return { model, score };
    });

    // 选择得分最高的模型
    const bestModel = modelScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    this._logger.debug(`[ModelRouter] 任务路由: ${task.name} -> ${bestModel.model} (得分: ${bestModel.score.toFixed(2)})`);
    
    return bestModel.model;
  }

  /**
   * 获取模型信息
   */
  getModelInfo(model: string): ModelInfo {
    const info = this.modelRegistry.get(model);
    if (!info) {
      throw new Error(`模型未注册: ${model}`);
    }
    return { ...info };
  }

  /**
   * 跟踪模型性能
   */
  trackPerformance(model: string, metrics: ModelMetrics): void {
    if (!this.modelRegistry.has(model)) {
      this._logger.warn(`[ModelRouter] 尝试跟踪未注册的模型: ${model}`);
      return;
    }

    const current = this.performanceTracker.get(model) || this.createDefaultPerformance();
    
    // 更新性能数据
    current.usageCount++;
    current.successRate = ((current.successRate * (current.usageCount - 1)) + (metrics.success ? 1 : 0)) / current.usageCount;
    current.averageExecutionTime = ((current.averageExecutionTime * (current.usageCount - 1)) + metrics.executionTime) / current.usageCount;
    current.averageQualityScore = ((current.averageQualityScore * (current.usageCount - 1)) + metrics.qualityScore) / current.usageCount;

    this.performanceTracker.set(model, current);

    this._logger.debug(`[ModelRouter] 更新模型性能: ${model}, 成功率: ${current.successRate.toFixed(2)}, 质量: ${current.averageQualityScore.toFixed(2)}`);
  }

  /**
   * 注册新模型
   */
  registerModel(model: string, info: ModelInfo): void {
    this.modelRegistry.set(model, info);
    this.performanceTracker.set(model, this.createDefaultPerformance());
    this._logger.info(`[ModelRouter] 注册模型: ${model}`);
  }

  /**
   * 获取所有注册的模型
   */
  getRegisteredModels(): string[] {
    return Array.from(this.modelRegistry.keys());
  }

  /**
   * 获取模型性能统计
   */
  getModelPerformance(model: string): ModelPerformance | null {
    return this.performanceTracker.get(model) || null;
  }

  /**
   * 计算模型得分
   */
  private calculateModelScore(model: string, task: Task): number {
    const modelInfo = this.modelRegistry.get(model);
    if (!modelInfo) {
      return 0;
    }

    const performance = this.performanceTracker.get(model) || this.createDefaultPerformance();
    
    let score = 0;
    let weightSum = 0;

    // 1. 任务类型匹配度
    if (this.config.qualityOptimization) {
      const typeMatchScore = this.calculateTypeMatchScore(modelInfo, task);
      score += typeMatchScore * 0.4;
      weightSum += 0.4;
    }

    // 2. 性能得分
    if (this.config.performanceOptimization) {
      const performanceScore = this.calculatePerformanceScore(performance);
      score += performanceScore * 0.3;
      weightSum += 0.3;
    }

    // 3. 成本得分
    if (this.config.costOptimization) {
      const costScore = this.calculateCostScore(modelInfo, task);
      score += costScore * 0.3;
      weightSum += 0.3;
    }

    // 4. 自定义权重
    const customWeight = this.config.modelWeights[model] || 1.0;
    score *= customWeight;

    return weightSum > 0 ? score / weightSum : 0;
  }

  /**
   * 计算任务类型匹配度
   */
  private calculateTypeMatchScore(modelInfo: ModelInfo, task: Task): number {
    let matchScore = 0;

    // 检查技术栈匹配
    if (task.technology.frontend && modelInfo.supportedLanguages.includes('typescript')) {
      matchScore += 0.3;
    }
    
    if (task.technology.backend && modelInfo.supportedLanguages.includes('python')) {
      matchScore += 0.3;
    }

    // 检查任务类型匹配
    const taskTypeCapabilities = this.mapTaskTypeToCapabilities(task.type);
    const capabilityMatch = taskTypeCapabilities.filter(cap => 
      modelInfo.capabilities.includes(cap)
    ).length / taskTypeCapabilities.length;
    
    matchScore += capabilityMatch * 0.4;

    return Math.min(matchScore, 1.0);
  }

  /**
   * 计算性能得分
   */
  private calculatePerformanceScore(performance: ModelPerformance): number {
    // 成功率权重最高
    const successRateScore = performance.successRate;
    
    // 执行时间（越短越好）
    const timeScore = Math.max(0, 1 - (performance.averageExecutionTime / 60000)); // 1分钟内为满分
    
    // 质量得分
    const qualityScore = performance.averageQualityScore / 100;

    return (successRateScore * 0.5 + timeScore * 0.3 + qualityScore * 0.2);
  }

  /**
   * 计算成本得分
   */
  private calculateCostScore(modelInfo: ModelInfo, task: Task): number {
    // 预估token使用量
    const estimatedTokens = this.estimateTokenUsage(task);
    const estimatedCost = estimatedTokens * modelInfo.costPerToken;
    
    // 成本越低得分越高
    const maxCost = 0.1; // 假设最大成本为0.1美元
    return Math.max(0, 1 - (estimatedCost / maxCost));
  }

  /**
   * 预估token使用量
   */
  private estimateTokenUsage(task: Task): number {
    // 基于任务描述长度和复杂度估算
    const baseTokens = task.description.length / 4; // 粗略估算
    const complexityMultiplier = this.getComplexityMultiplier(task);
    
    return baseTokens * complexityMultiplier;
  }

  /**
   * 获取复杂度乘数
   */
  private getComplexityMultiplier(task: Task): number {
    const _descriptionLength = task.description.length; // 修复未使用变量
    const wordCount = task.description.split(/\s+/).length;
    
    if (wordCount < 50) return 1.0;
    if (wordCount < 200) return 1.5;
    if (wordCount < 500) return 2.0;
    return 3.0;
  }

  /**
   * 映射任务类型到能力需求
   */
  private mapTaskTypeToCapabilities(taskType: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      'component_generation': ['code_generation', 'ui_design', 'frontend'],
      'api_implementation': ['code_generation', 'backend', 'api_design'],
      'database_design': ['database', 'schema_design', 'backend'],
      'authentication_setup': ['security', 'authentication', 'backend'],
      'task_decomposition': ['planning', 'analysis', 'decomposition'],
      'conflict_resolution': ['analysis', 'problem_solving', 'conflict_resolution']
    };

    return capabilityMap[taskType] || ['general'];
  }

  /**
   * 初始化默认模型
   */
  private initializeDefaultModels(): void {
    // GPT系列
    this.registerModel('gpt-4', {
      name: 'GPT-4',
      provider: 'openai',
      capabilities: ['code_generation', 'analysis', 'planning', 'problem_solving'],
      costPerToken: 0.00003,
      maxTokens: 8192,
      supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go', 'rust']
    });

    this.registerModel('gpt-3.5-turbo', {
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      capabilities: ['code_generation', 'analysis'],
      costPerToken: 0.000002,
      maxTokens: 4096,
      supportedLanguages: ['typescript', 'javascript', 'python', 'java']
    });

    // Claude系列
    this.registerModel('claude-3', {
      name: 'Claude 3',
      provider: 'anthropic',
      capabilities: ['code_generation', 'analysis', 'planning', 'long_context'],
      costPerToken: 0.000025,
      maxTokens: 200000,
      supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'rust']
    });

    // CodeLlama
    this.registerModel('codellama', {
      name: 'CodeLlama',
      provider: 'meta',
      capabilities: ['code_generation', 'code_completion'],
      costPerToken: 0.000001,
      maxTokens: 16384,
      supportedLanguages: ['python', 'javascript', 'typescript', 'java', 'cpp']
    });

    // 本地模型
    this.registerModel('local-codellama', {
      name: 'Local CodeLlama',
      provider: 'local',
      capabilities: ['code_generation', 'code_completion'],
      costPerToken: 0.0000001, // 极低成本
      maxTokens: 4096,
      supportedLanguages: ['python', 'javascript', 'typescript']
    });
  }

  /**
   * 创建默认性能数据
   */
  private createDefaultPerformance(): ModelPerformance {
    return {
      successRate: 0.8, // 默认成功率
      averageExecutionTime: 30000, // 默认30秒
      averageQualityScore: 80, // 默认质量分
      costPerToken: 0.00001, // 默认成本
      usageCount: 0
    };
  }
}

// 导出单例实例
export const modelRouter = new ModelRouter();

export default ModelRouter;