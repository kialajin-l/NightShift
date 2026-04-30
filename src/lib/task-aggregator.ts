/**
 * 任务结果聚合器 - 收集、分析和整合多个任务执行结果
 */

import { Task, TaskOutput } from '../../packages/agents/src/types/agent';

interface TaskAggregatorConfig {
  enableQualityScoring?: boolean;
  enableConflictDetection?: boolean;
  maxRetentionDays?: number;
  aggregationStrategies?: AggregationStrategy[];
}

interface AggregationResult {
  success: boolean;
  aggregatedOutput: any;
  qualityScore: number; // 0-100
  conflicts: Conflict[];
  recommendations: Recommendation[];
  metadata: AggregationMetadata;
}

interface Conflict {
  type: 'code' | 'data' | 'logic' | 'dependency';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tasksInvolved: string[];
  resolution?: string;
}

interface Recommendation {
  type: 'optimization' | 'refactoring' | 'security' | 'performance';
  description: string;
  priority: 'low' | 'medium' | 'high';
  impact: string;
}

interface AggregationMetadata {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageQuality: number;
  totalExecutionTime: number;
  aggregationTime: number;
}

interface AggregationStrategy {
  name: string;
  description: string;
  apply: (tasks: Task[], outputs: TaskOutput[]) => Partial<AggregationResult>;
  priority: number;
}

export class TaskAggregator {
  private config: Required<TaskAggregatorConfig>;
  private aggregationStrategies: Map<string, AggregationStrategy>;
  private logger: Console;

  constructor(config: TaskAggregatorConfig = {}) {
    this.config = {
      enableQualityScoring: config.enableQualityScoring ?? true,
      enableConflictDetection: config.enableConflictDetection ?? true,
      maxRetentionDays: config.maxRetentionDays ?? 30,
      aggregationStrategies: config.aggregationStrategies || []
    };

    this.aggregationStrategies = new Map();
    this.logger = console;

    this.initializeDefaultStrategies();
  }

  /**
   * 聚合多个任务结果
   */
  async aggregateTasks(tasks: Task[], outputs: TaskOutput[]): Promise<AggregationResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`[TaskAggregator] 开始聚合 ${tasks.length} 个任务结果`);

      // 验证输入
      const validation = this.validateInput(tasks, outputs);
      if (!validation.isValid) {
        throw new Error(`输入验证失败: ${validation.errors.join(', ')}`);
      }

      // 应用聚合策略
      const strategyResults = this.applyAggregationStrategies(tasks, outputs);
      
      // 合并结果
      const aggregatedResult = this.mergeStrategyResults(strategyResults);
      
      // 计算质量分数
      const qualityScore = this.calculateOverallQuality(tasks, outputs);
      
      // 检测冲突
      const conflicts = this.config.enableConflictDetection ? 
        this.detectConflicts(tasks, outputs) : [];
      
      // 生成建议
      const recommendations = this.generateRecommendations(tasks, outputs, conflicts);

      const aggregationTime = Date.now() - startTime;

      const result: AggregationResult = {
        success: true,
        aggregatedOutput: aggregatedResult,
        qualityScore,
        conflicts,
        recommendations,
        metadata: {
          totalTasks: tasks.length,
          successfulTasks: outputs.filter(o => o.success).length,
          failedTasks: outputs.filter(o => !o.success).length,
          averageQuality: this.calculateAverageQuality(outputs),
          totalExecutionTime: outputs.reduce((sum, o) => sum + (o.executionTime || 0), 0),
          aggregationTime
        }
      };

      this.logger.log(`[TaskAggregator] 任务聚合完成，质量分数: ${qualityScore}`);

      return result;

    } catch (error) {
      const aggregationTime = Date.now() - startTime;
      this.logger.error('[TaskAggregator] 任务聚合失败:', error);

      return {
        success: false,
        aggregatedOutput: {},
        qualityScore: 0,
        conflicts: [],
        recommendations: [],
        metadata: {
          totalTasks: tasks.length,
          successfulTasks: 0,
          failedTasks: tasks.length,
          averageQuality: 0,
          totalExecutionTime: 0,
          aggregationTime
        }
      };
    }
  }

  /**
   * 添加聚合策略
   */
  addAggregationStrategy(strategy: AggregationStrategy): void {
    this.aggregationStrategies.set(strategy.name, strategy);
    this.logger.log(`[TaskAggregator] 添加聚合策略: ${strategy.name}`);
  }

  /**
   * 移除聚合策略
   */
  removeAggregationStrategy(strategyName: string): boolean {
    const success = this.aggregationStrategies.delete(strategyName);
    if (success) {
      this.logger.log(`[TaskAggregator] 移除聚合策略: ${strategyName}`);
    }
    return success;
  }

  /**
   * 获取所有聚合策略
   */
  getAggregationStrategies(): AggregationStrategy[] {
    return Array.from(this.aggregationStrategies.values());
  }

  /**
   * 验证输入数据
   */
  private validateInput(tasks: Task[], outputs: TaskOutput[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (tasks.length !== outputs.length) {
      errors.push('任务数量和输出数量不匹配');
    }

    if (tasks.length === 0) {
      warnings.push('没有任务需要聚合');
    }

    // 检查任务ID匹配
    const taskIds = new Set(tasks.map(t => t.id));
    const outputTaskRefs = outputs.map(o => o.metadata?.taskId).filter(Boolean);
    
    for (const taskId of outputTaskRefs) {
      if (!taskIds.has(taskId as string)) {
        warnings.push(`输出中引用了未知的任务ID: ${taskId}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 应用聚合策略
   */
  private applyAggregationStrategies(tasks: Task[], outputs: TaskOutput[]): Partial<AggregationResult>[] {
    const results: Partial<AggregationResult>[] = [];
    
    // 按优先级排序策略
    const sortedStrategies = Array.from(this.aggregationStrategies.values())
      .sort((a, b) => b.priority - a.priority);

    for (const strategy of sortedStrategies) {
      try {
        const result = strategy.apply(tasks, outputs);
        results.push(result);
        this.logger.debug(`[TaskAggregator] 应用策略: ${strategy.name}`);
      } catch (error) {
        this.logger.warn(`[TaskAggregator] 策略执行失败: ${strategy.name}`, error);
      }
    }

    return results;
  }

  /**
   * 合并策略结果
   */
  private mergeStrategyResults(strategyResults: Partial<AggregationResult>[]): any {
    if (strategyResults.length === 0) {
      return {};
    }

    // 简单的深度合并策略
    const merged: any = {};
    
    for (const result of strategyResults) {
      if (result.aggregatedOutput) {
        this.deepMerge(merged, result.aggregatedOutput);
      }
    }

    return merged;
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): void {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  /**
   * 计算整体质量分数
   */
  private calculateOverallQuality(tasks: Task[], outputs: TaskOutput[]): number {
    if (outputs.length === 0) return 0;

    let totalScore = 0;
    let weightSum = 0;

    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      const task = tasks[i];
      
      if (output.success) {
        const taskWeight = this.calculateTaskWeight(task);
        const outputQuality = output.analysis?.quality || 80; // 默认质量分
        
        totalScore += outputQuality * taskWeight;
        weightSum += taskWeight;
      }
    }

    return weightSum > 0 ? totalScore / weightSum : 0;
  }

  /**
   * 计算任务权重
   */
  private calculateTaskWeight(task: Task): number {
    const priorityWeights = {
      'critical': 1.5,
      'high': 1.2,
      'medium': 1.0,
      'low': 0.8
    };

    const complexityWeights = {
      'complex': 1.3,
      'medium': 1.0,
      'simple': 0.7
    };

    const priorityWeight = priorityWeights[task.priority] || 1.0;
    const complexityKey = task.analysis?.complexity || 'medium';
    const complexityWeight = complexityKey in complexityWeights ? complexityWeights[complexityKey as keyof typeof complexityWeights] : 1.0;

    return priorityWeight * complexityWeight;
  }

  /**
   * 计算平均质量
   */
  private calculateAverageQuality(outputs: TaskOutput[]): number {
    const successfulOutputs = outputs.filter(o => o.success && o.analysis?.quality);
    
    if (successfulOutputs.length === 0) return 0;
    
    return successfulOutputs.reduce((sum, o) => sum + (o.analysis!.quality || 0), 0) / successfulOutputs.length;
  }

  /**
   * 检测冲突
   */
  private detectConflicts(tasks: Task[], outputs: TaskOutput[]): Conflict[] {
    const conflicts: Conflict[] = [];

    // 检测代码冲突
    const codeConflicts = this.detectCodeConflicts(tasks, outputs);
    conflicts.push(...codeConflicts);

    // 检测数据冲突
    const dataConflicts = this.detectDataConflicts(tasks, outputs);
    conflicts.push(...dataConflicts);

    // 检测逻辑冲突
    const logicConflicts = this.detectLogicConflicts(tasks, outputs);
    conflicts.push(...logicConflicts);

    // 检测依赖冲突
    const dependencyConflicts = this.detectDependencyConflicts(tasks, outputs);
    conflicts.push(...dependencyConflicts);

    return conflicts;
  }

  /**
   * 检测代码冲突
   */
  private detectCodeConflicts(tasks: Task[], outputs: TaskOutput[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const codeBlocks = new Map<string, { taskId: string; code: string }>();

    // 收集所有生成的代码
    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      const task = tasks[i];
      
      if (output.success && output.generatedCode) {
        codeBlocks.set(task.id, {
          taskId: task.id,
          code: output.generatedCode
        });
      }
    }

    // 简化的代码冲突检测（实际应该使用AST分析）
    const functionNames = new Set<string>();
    
    for (const [taskId, codeBlock] of codeBlocks.entries()) {
      const functionMatches = codeBlock.code.match(/function\s+(\w+)/g) || [];
      
      for (const match of functionMatches) {
        const functionName = match.replace('function ', '');
        
        if (functionNames.has(functionName)) {
          conflicts.push({
            type: 'code',
            description: `函数名冲突: ${functionName}`,
            severity: 'medium',
            tasksInvolved: [taskId],
            resolution: '重命名冲突的函数'
          });
        }
        
        functionNames.add(functionName);
      }
    }

    return conflicts;
  }

  /**
   * 检测数据冲突
   */
  private detectDataConflicts(tasks: Task[], outputs: TaskOutput[]): Conflict[] {
    // 简化的数据冲突检测
    const conflicts: Conflict[] = [];
    
    // 这里可以检测数据库表名冲突、字段名冲突等
    // 实际实现应该更复杂
    
    return conflicts;
  }

  /**
   * 检测逻辑冲突
   */
  private detectLogicConflicts(tasks: Task[], outputs: TaskOutput[]): Conflict[] {
    // 简化的逻辑冲突检测
    const conflicts: Conflict[] = [];
    
    // 这里可以检测业务逻辑冲突、流程冲突等
    // 实际实现应该更复杂
    
    return conflicts;
  }

  /**
   * 检测依赖冲突
   */
  private detectDependencyConflicts(tasks: Task[], outputs: TaskOutput[]): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // 检测循环依赖
    for (const task of tasks) {
      const visited = new Set<string>();
      const hasCycle = this.detectCycle(task, tasks, visited, new Set<string>());
      
      if (hasCycle) {
        conflicts.push({
          type: 'dependency',
          description: `检测到循环依赖: ${task.name}`,
          severity: 'high',
          tasksInvolved: Array.from(visited),
          resolution: '重新设计任务依赖关系'
        });
      }
    }

    return conflicts;
  }

  /**
   * 检测循环依赖
   */
  private detectCycle(
    task: Task, 
    allTasks: Task[], 
    visited: Set<string>, 
    recursionStack: Set<string>
  ): boolean {
    if (recursionStack.has(task.id)) {
      return true; // 发现循环
    }

    if (visited.has(task.id)) {
      return false; // 已经访问过，无循环
    }

    visited.add(task.id);
    recursionStack.add(task.id);

    for (const depId of task.dependencies) {
      const depTask = allTasks.find(t => t.id === depId);
      if (depTask && this.detectCycle(depTask, allTasks, visited, recursionStack)) {
        return true;
      }
    }

    recursionStack.delete(task.id);
    return false;
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    tasks: Task[], 
    outputs: TaskOutput[], 
    conflicts: Conflict[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 基于质量分数生成建议
    const avgQuality = this.calculateAverageQuality(outputs);
    if (avgQuality < 70) {
      recommendations.push({
        type: 'optimization',
        description: '整体代码质量较低，建议进行代码审查和优化',
        priority: 'high',
        impact: '提高代码质量和可维护性'
      });
    }

    // 基于冲突生成建议
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical' || c.severity === 'high');
    if (criticalConflicts.length > 0) {
      recommendations.push({
        type: 'refactoring',
        description: `发现 ${criticalConflicts.length} 个严重冲突，需要重构`, 
        priority: 'high',
        impact: '解决系统冲突，提高稳定性'
      });
    }

    // 基于性能数据生成建议
    const totalExecutionTime = outputs.reduce((sum, o) => sum + (o.executionTime || 0), 0);
    if (totalExecutionTime > 300000) { // 5分钟
      recommendations.push({
        type: 'performance',
        description: '任务执行时间较长，建议优化性能',
        priority: 'medium',
        impact: '提高系统响应速度'
      });
    }

    return recommendations;
  }

  /**
   * 初始化默认策略
   */
  private initializeDefaultStrategies(): void {
    // 代码合并策略
    this.addAggregationStrategy({
      name: 'code-merging',
      description: '合并多个任务生成的代码',
      priority: 10,
      apply: (tasks, outputs) => {
        const generatedCode = outputs
          .filter(o => o.success && o.generatedCode)
          .map(o => o.generatedCode)
          .join('\n\n');

        return {
          aggregatedOutput: {
            code: generatedCode,
            fileCount: outputs.filter(o => o.success && o.generatedCode).length
          }
        };
      }
    });

    // 文档合并策略
    this.addAggregationStrategy({
      name: 'documentation-merging',
      description: '合并任务生成的文档',
      priority: 8,
      apply: (tasks, outputs) => {
        const documentation = outputs
          .filter(o => o.success && o.documentation)
          .map(o => o.documentation)
          .join('\n\n');

        return {
          aggregatedOutput: {
            documentation,
            sections: outputs.filter(o => o.success && o.documentation).length
          }
        };
      }
    });

    // 测试用例合并策略
    this.addAggregationStrategy({
      name: 'test-case-merging',
      description: '合并测试用例',
      priority: 7,
      apply: (tasks, outputs) => {
        const testCases = outputs
          .filter(o => o.success && o.testCases)
          .flatMap(o => o.testCases || []);

        return {
          aggregatedOutput: {
            testCases,
            totalTestCases: testCases.length
          }
        };
      }
    });
  }

  /**
   * 获取聚合器配置
   */
  getConfig(): TaskAggregatorConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<TaskAggregatorConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log('[TaskAggregator] 配置已更新');
  }

  /**
   * 获取聚合器状态
   */
  getStatus(): {
    totalStrategies: number;
    config: TaskAggregatorConfig;
  } {
    return {
      totalStrategies: this.aggregationStrategies.size,
      config: this.getConfig()
    };
  }
}

// 导出单例实例
export const taskAggregator = new TaskAggregator();

export default TaskAggregator;