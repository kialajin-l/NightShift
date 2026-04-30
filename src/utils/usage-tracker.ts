// 用量统计跟踪器

import { UsageStats, ModelUsage, ProviderUsage, DailyUsage } from '@/types';
import { storage } from './index';

/**
 * 用量统计跟踪器类
 */
export class UsageTracker {
  private static instance: UsageTracker;
  private stats: UsageStats;
  private isInitialized = false;

  private constructor() {
    this.stats = this.initializeStats();
    this.loadStats();
    this.isInitialized = true;
  }

  /**
   * 获取单例实例
   */
  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  /**
   * 初始化统计数据结构
   */
  private initializeStats(): UsageStats {
    return {
      totalTokens: 0,
      totalCost: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      byProvider: {},
      byModel: {},
      byDate: {}
    };
  }

  /**
   * 加载统计数据
   */
  private loadStats(): void {
    try {
      const savedStats = storage.get<UsageStats>('nightshift-usage-stats');
      if (savedStats) {
        this.stats = { ...this.initializeStats(), ...savedStats };
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  }

  /**
   * 保存统计数据
   */
  private saveStats(): void {
    try {
      storage.set('nightshift-usage-stats', this.stats);
    } catch (error) {
      console.error('Failed to save usage stats:', error);
    }
  }

  /**
   * 记录API调用
   */
  recordApiCall(
    providerId: string,
    modelName: string,
    tokens: number,
    cost: number,
    success: boolean = true
  ): void {
    if (!this.isInitialized) return;

    const today = new Date().toISOString().split('T')[0];
    
    // 更新总体统计
    this.stats.totalTokens += tokens;
    this.stats.totalCost += cost;
    this.stats.totalRequests += 1;
    
    if (success) {
      this.stats.successfulRequests += 1;
    } else {
      this.stats.failedRequests += 1;
    }
    
    // 更新提供商统计
    this.updateProviderStats(providerId, tokens, cost);
    
    // 更新模型统计
    this.updateModelStats(providerId, modelName, tokens, cost);
    
    // 更新日期统计
    if (today) {
      this.updateDateStats(today, tokens, cost);
    }
    
    // 保存统计
    this.saveStats();
  }

  /**
   * 更新提供商统计
   */
  private updateProviderStats(providerId: string, tokens: number, cost: number): void {
    if (!this.stats.byProvider[providerId]) {
      this.stats.byProvider[providerId] = {
        providerId,
        tokens: 0,
        cost: 0,
        requests: 0
      };
    }
    
    this.stats.byProvider[providerId].tokens += tokens;
    this.stats.byProvider[providerId].cost += cost;
    this.stats.byProvider[providerId].requests += 1;
  }

  /**
   * 更新模型统计
   */
  private updateModelStats(providerId: string, modelName: string, tokens: number, cost: number): void {
    const modelKey = `${providerId}:${modelName}`;
    
    if (!this.stats.byModel[modelKey]) {
      this.stats.byModel[modelKey] = {
        modelName,
        tokens: 0,
        cost: 0,
        requests: 0
      };
    }
    
    this.stats.byModel[modelKey].tokens += tokens;
    this.stats.byModel[modelKey].cost += cost;
    this.stats.byModel[modelKey].requests += 1;
  }

  /**
   * 更新日期统计
   */
  private updateDateStats(date: string, tokens: number, cost: number): void {
    if (!this.stats.byDate[date]) {
      this.stats.byDate[date] = {
        date,
        tokens: 0,
        cost: 0,
        requests: 0
      };
    }
    
    this.stats.byDate[date].tokens += tokens;
    this.stats.byDate[date].cost += cost;
    this.stats.byDate[date].requests += 1;
  }

  /**
   * 获取总体统计
   */
  getOverallStats(): {
    totalTokens: number;
    totalCost: number;
    totalRequests: number;
    successRate: number;
    averageTokensPerRequest: number;
    averageCostPerRequest: number;
  } {
    const successRate = this.stats.totalRequests > 0 
      ? (this.stats.successfulRequests / this.stats.totalRequests) * 100 
      : 0;
    
    const averageTokensPerRequest = this.stats.totalRequests > 0 
      ? this.stats.totalTokens / this.stats.totalRequests 
      : 0;
    
    const averageCostPerRequest = this.stats.totalRequests > 0 
      ? this.stats.totalCost / this.stats.totalRequests 
      : 0;
    
    return {
      totalTokens: this.stats.totalTokens,
      totalCost: this.stats.totalCost,
      totalRequests: this.stats.totalRequests,
      successRate: Math.round(successRate * 100) / 100,
      averageTokensPerRequest: Math.round(averageTokensPerRequest),
      averageCostPerRequest: Math.round(averageCostPerRequest * 100000) / 100000
    };
  }

  /**
   * 获取提供商统计
   */
  getProviderStats(): ProviderUsage[] {
    return Object.values(this.stats.byProvider).sort((a, b) => b.tokens - a.tokens);
  }

  /**
   * 获取模型统计
   */
  getModelStats(): ModelUsage[] {
    return Object.values(this.stats.byModel).sort((a, b) => b.tokens - a.tokens);
  }

  /**
   * 获取日期统计
   */
  getDateStats(): DailyUsage[] {
    return Object.values(this.stats.byDate).sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * 获取最近N天的统计
   */
  getRecentStats(days: number = 7): DailyUsage[] {
    const allDates = this.getDateStats();
    return allDates.slice(0, days);
  }

  /**
   * 获取成本趋势
   */
  getCostTrend(days: number = 7): { date: string; cost: number }[] {
    const recentStats = this.getRecentStats(days);
    return recentStats.map(stat => ({
      date: stat.date,
      cost: stat.cost
    }));
  }

  /**
   * 获取用量趋势
   */
  getUsageTrend(days: number = 7): { date: string; tokens: number; requests: number }[] {
    const recentStats = this.getRecentStats(days);
    return recentStats.map(stat => ({
      date: stat.date,
      tokens: stat.tokens,
      requests: stat.requests
    }));
  }

  /**
   * 获取最常用的模型
   */
  getTopModels(limit: number = 5): ModelUsage[] {
    return this.getModelStats().slice(0, limit);
  }

  /**
   * 获取最活跃的提供商
   */
  getTopProviders(limit: number = 5): ProviderUsage[] {
    return this.getProviderStats().slice(0, limit);
  }

  /**
   * 估算月度成本
   */
  estimateMonthlyCost(): number {
    const recentStats = this.getRecentStats(30);
    const totalCost = recentStats.reduce((sum, stat) => sum + stat.cost, 0);
    const daysWithData = recentStats.length;
    
    if (daysWithData === 0) return 0;
    
    // 基于已有数据估算月度成本
    const averageDailyCost = totalCost / daysWithData;
    return averageDailyCost * 30;
  }

  /**
   * 检查是否超过预算限制
   */
  checkBudgetLimit(monthlyLimit: number): {
    isOverLimit: boolean;
    currentCost: number;
    estimatedMonthlyCost: number;
    remainingBudget: number;
  } {
    const estimatedMonthlyCost = this.estimateMonthlyCost();
    const currentCost = this.stats.totalCost;
    const remainingBudget = monthlyLimit - estimatedMonthlyCost;
    
    return {
      isOverLimit: estimatedMonthlyCost > monthlyLimit,
      currentCost,
      estimatedMonthlyCost,
      remainingBudget
    };
  }

  /**
   * 生成用量报告
   */
  generateReport(): string {
    const overall = this.getOverallStats();
    const topModels = this.getTopModels(3);
    const topProviders = this.getTopProviders(3);
    const monthlyEstimate = this.estimateMonthlyCost();
    
    let report = `# NightShift 用量报告\n\n`;
    report += `## 总体统计\n`;
    report += `- 总Token用量: ${overall.totalTokens.toLocaleString()}\n`;
    report += `- 总成本: $${overall.totalCost.toFixed(4)}\n`;
    report += `- 总请求数: ${overall.totalRequests}\n`;
    report += `- 成功率: ${overall.successRate}%\n`;
    report += `- 平均Token/请求: ${overall.averageTokensPerRequest.toLocaleString()}\n`;
    report += `- 平均成本/请求: $${overall.averageCostPerRequest}\n\n`;
    
    report += `## 最常用模型\n`;
    topModels.forEach((model, index) => {
      report += `${index + 1}. ${model.modelName}: ${model.tokens.toLocaleString()} tokens, $${model.cost.toFixed(4)}\n`;
    });
    report += `\n`;
    
    report += `## 最活跃提供商\n`;
    topProviders.forEach((provider, index) => {
      report += `${index + 1}. ${provider.providerId}: ${provider.tokens.toLocaleString()} tokens, $${provider.cost.toFixed(4)}\n`;
    });
    report += `\n`;
    
    report += `## 成本估算\n`;
    report += `- 月度成本估算: $${monthlyEstimate.toFixed(4)}\n`;
    
    return report;
  }

  /**
   * 导出统计数据
   */
  exportData(): UsageStats {
    return { ...this.stats };
  }

  /**
   * 导入统计数据
   */
  importData(data: UsageStats): void {
    this.stats = { ...this.initializeStats(), ...data };
    this.saveStats();
  }

  /**
   * 重置统计数据
   */
  reset(): void {
    this.stats = this.initializeStats();
    this.saveStats();
  }

  /**
   * 销毁跟踪器
   */
  destroy(): void {
    this.stats = this.initializeStats();
    this.isInitialized = false;
  }
}

// 导出单例实例
export const usageTracker = UsageTracker.getInstance();