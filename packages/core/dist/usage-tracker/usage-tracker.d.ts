import { EventEmitter } from 'eventemitter3';
/**
 * 用量统计事件类型
 */
export interface UsageEvent {
    providerId: string;
    modelName: string;
    taskType: string;
    tokens: {
        prompt: number;
        completion: number;
        total: number;
    };
    cost: number;
    duration: number;
    success: boolean;
    error?: string;
    timestamp: Date;
}
/**
 * 用量统计摘要
 */
export interface UsageSummary {
    totalTokens: number;
    totalCost: number;
    totalRequests: number;
    errorRate: number;
    averageLatency: number;
    byProvider: Record<string, {
        tokens: number;
        cost: number;
        requests: number;
        errors: number;
    }>;
    byTaskType: Record<string, {
        tokens: number;
        cost: number;
        requests: number;
    }>;
    timeRange: {
        start: Date;
        end: Date;
    };
}
/**
 * 成本限制配置
 */
export interface CostLimitConfig {
    dailyLimit: number;
    monthlyLimit: number;
    alertThreshold: number;
    autoStop: boolean;
}
/**
 * 用量统计器 - 记录和分析 AI 模型使用情况
 */
export declare class UsageTracker extends EventEmitter {
    private events;
    private costLimits;
    private storagePath;
    private isPersistenceEnabled;
    constructor(config?: {
        costLimits?: Partial<CostLimitConfig>;
        storagePath?: string;
        persistenceEnabled?: boolean;
    });
    /**
     * 初始化用量统计器
     */
    private initialize;
    /**
     * 确保存储目录存在
     */
    private ensureStorageDirectory;
    /**
     * 加载历史数据
     */
    private loadHistoricalData;
    /**
     * 记录用量事件
     */
    recordUsage(event: Omit<UsageEvent, 'timestamp'>): Promise<void>;
    /**
     * 检查成本限制
     */
    private checkCostLimits;
    /**
     * 获取今日用量摘要
     */
    getDailySummary(date?: Date): UsageSummary;
    /**
     * 获取本月用量摘要
     */
    getMonthlySummary(date?: Date): UsageSummary;
    /**
     * 获取指定时间范围的用量摘要
     */
    getSummary(startTime: Date, endTime: Date): UsageSummary;
    /**
     * 获取成本趋势数据
     */
    getCostTrend(days?: number): Array<{
        date: string;
        cost: number;
    }>;
    /**
     * 获取提供商性能报告
     */
    getProviderPerformanceReport(): Array<{
        providerId: string;
        totalCost: number;
        totalTokens: number;
        successRate: number;
        averageLatency: number;
        costPerToken: number;
    }>;
    /**
     * 导出用量数据
     */
    exportData(format?: 'json' | 'csv'): Promise<string>;
    /**
     * 转换为 CSV 格式
     */
    private convertToCSV;
    /**
     * 保存数据到文件
     */
    private saveData;
    /**
     * 获取今日文件路径
     */
    private getTodayFilePath;
    /**
     * 清理旧数据
     */
    cleanupOldData(maxAgeDays?: number): Promise<void>;
    /**
     * 更新成本限制配置
     */
    updateCostLimits(newLimits: Partial<CostLimitConfig>): void;
    /**
     * 获取当前成本限制配置
     */
    getCostLimits(): CostLimitConfig;
    /**
     * 重置用量统计
     */
    reset(): void;
    /**
     * 销毁用量统计器
     */
    destroy(): Promise<void>;
}
//# sourceMappingURL=usage-tracker.d.ts.map