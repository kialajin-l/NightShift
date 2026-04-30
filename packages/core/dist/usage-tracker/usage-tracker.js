import { EventEmitter } from 'eventemitter3';
import * as fs from 'fs/promises';
import * as path from 'path';
/**
 * 用量统计器 - 记录和分析 AI 模型使用情况
 */
export class UsageTracker extends EventEmitter {
    events = [];
    costLimits;
    storagePath;
    isPersistenceEnabled;
    constructor(config = {}) {
        super();
        this.costLimits = {
            dailyLimit: 10,
            monthlyLimit: 100,
            alertThreshold: 0.8,
            autoStop: true,
            ...config.costLimits
        };
        this.storagePath = config.storagePath || path.join(process.cwd(), '.nightshift', 'usage');
        this.isPersistenceEnabled = config.persistenceEnabled ?? true;
        this.initialize();
    }
    /**
     * 初始化用量统计器
     */
    async initialize() {
        if (this.isPersistenceEnabled) {
            await this.ensureStorageDirectory();
            await this.loadHistoricalData();
        }
        // 设置定时保存
        setInterval(() => {
            this.saveData().catch(error => {
                console.error('保存用量数据失败:', error);
            });
        }, 60000); // 每分钟保存一次
        this.emit('initialized');
    }
    /**
     * 确保存储目录存在
     */
    async ensureStorageDirectory() {
        try {
            await fs.mkdir(this.storagePath, { recursive: true });
        }
        catch (error) {
            console.error('创建用量存储目录失败:', error);
        }
    }
    /**
     * 加载历史数据
     */
    async loadHistoricalData() {
        try {
            const todayFile = this.getTodayFilePath();
            const data = await fs.readFile(todayFile, 'utf-8');
            const events = JSON.parse(data);
            // 转换日期字符串为 Date 对象
            this.events = events.map(event => ({
                ...event,
                timestamp: new Date(event.timestamp)
            }));
            this.emit('dataLoaded', this.events.length);
        }
        catch (error) {
            // 文件不存在是正常情况
            if (error.code !== 'ENOENT') {
                console.error('加载历史用量数据失败:', error);
            }
        }
    }
    /**
     * 记录用量事件
     */
    async recordUsage(event) {
        const fullEvent = {
            ...event,
            timestamp: new Date()
        };
        this.events.push(fullEvent);
        // 检查成本限制
        await this.checkCostLimits(fullEvent);
        this.emit('usageRecorded', fullEvent);
        // 立即保存重要事件（错误或高成本）
        if (!event.success || event.cost > 0.1) {
            await this.saveData();
        }
    }
    /**
     * 检查成本限制
     */
    async checkCostLimits(event) {
        const todaySummary = this.getDailySummary();
        const monthlySummary = this.getMonthlySummary();
        // 检查每日限额
        if (todaySummary.totalCost >= this.costLimits.dailyLimit) {
            this.emit('dailyLimitExceeded', {
                limit: this.costLimits.dailyLimit,
                actual: todaySummary.totalCost,
                event
            });
            if (this.costLimits.autoStop) {
                this.emit('usageBlocked', '每日限额已超');
            }
        }
        // 检查每月限额
        if (monthlySummary.totalCost >= this.costLimits.monthlyLimit) {
            this.emit('monthlyLimitExceeded', {
                limit: this.costLimits.monthlyLimit,
                actual: monthlySummary.totalCost,
                event
            });
            if (this.costLimits.autoStop) {
                this.emit('usageBlocked', '每月限额已超');
            }
        }
        // 检查预警阈值
        const dailyUsageRatio = todaySummary.totalCost / this.costLimits.dailyLimit;
        const monthlyUsageRatio = monthlySummary.totalCost / this.costLimits.monthlyLimit;
        if (dailyUsageRatio >= this.costLimits.alertThreshold) {
            this.emit('dailyLimitWarning', {
                threshold: this.costLimits.alertThreshold,
                usageRatio: dailyUsageRatio,
                remaining: this.costLimits.dailyLimit - todaySummary.totalCost
            });
        }
        if (monthlyUsageRatio >= this.costLimits.alertThreshold) {
            this.emit('monthlyLimitWarning', {
                threshold: this.costLimits.alertThreshold,
                usageRatio: monthlyUsageRatio,
                remaining: this.costLimits.monthlyLimit - monthlySummary.totalCost
            });
        }
    }
    /**
     * 获取今日用量摘要
     */
    getDailySummary(date = new Date()) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return this.getSummary(startOfDay, endOfDay);
    }
    /**
     * 获取本月用量摘要
     */
    getMonthlySummary(date = new Date()) {
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        return this.getSummary(startOfMonth, endOfMonth);
    }
    /**
     * 获取指定时间范围的用量摘要
     */
    getSummary(startTime, endTime) {
        const filteredEvents = this.events.filter(event => event.timestamp >= startTime && event.timestamp <= endTime);
        const byProvider = {};
        const byTaskType = {};
        let totalTokens = 0;
        let totalCost = 0;
        let totalRequests = filteredEvents.length;
        let totalErrors = 0;
        let totalDuration = 0;
        for (const event of filteredEvents) {
            // 统计总量
            totalTokens += event.tokens.total;
            totalCost += event.cost;
            totalDuration += event.duration;
            if (!event.success)
                totalErrors++;
            // 按提供商统计
            if (!byProvider[event.providerId]) {
                byProvider[event.providerId] = {
                    tokens: 0,
                    cost: 0,
                    requests: 0,
                    errors: 0
                };
            }
            byProvider[event.providerId].tokens += event.tokens.total;
            byProvider[event.providerId].cost += event.cost;
            byProvider[event.providerId].requests++;
            if (!event.success)
                byProvider[event.providerId].errors++;
            // 按任务类型统计
            if (!byTaskType[event.taskType]) {
                byTaskType[event.taskType] = {
                    tokens: 0,
                    cost: 0,
                    requests: 0
                };
            }
            byTaskType[event.taskType].tokens += event.tokens.total;
            byTaskType[event.taskType].cost += event.cost;
            byTaskType[event.taskType].requests++;
        }
        return {
            totalTokens,
            totalCost,
            totalRequests,
            errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
            averageLatency: totalRequests > 0 ? totalDuration / totalRequests : 0,
            byProvider,
            byTaskType,
            timeRange: { start: startTime, end: endTime }
        };
    }
    /**
     * 获取成本趋势数据
     */
    getCostTrend(days = 30) {
        const trends = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const summary = this.getDailySummary(date);
            trends.push({
                date: date.toISOString().split('T')[0],
                cost: summary.totalCost
            });
        }
        return trends;
    }
    /**
     * 获取提供商性能报告
     */
    getProviderPerformanceReport() {
        const monthlySummary = this.getMonthlySummary();
        const report = [];
        for (const [providerId, stats] of Object.entries(monthlySummary.byProvider)) {
            const successRate = stats.requests > 0 ? 1 - (stats.errors / stats.requests) : 0;
            const costPerToken = stats.tokens > 0 ? stats.cost / stats.tokens : 0;
            report.push({
                providerId,
                totalCost: stats.cost,
                totalTokens: stats.tokens,
                successRate,
                averageLatency: 0, // 需要额外计算
                costPerToken
            });
        }
        return report.sort((a, b) => b.successRate - a.successRate);
    }
    /**
     * 导出用量数据
     */
    async exportData(format = 'json') {
        const data = {
            events: this.events,
            summary: this.getMonthlySummary(),
            exportedAt: new Date().toISOString()
        };
        if (format === 'csv') {
            return this.convertToCSV(data);
        }
        return JSON.stringify(data, null, 2);
    }
    /**
     * 转换为 CSV 格式
     */
    convertToCSV(data) {
        const headers = [
            'timestamp', 'providerId', 'modelName', 'taskType',
            'promptTokens', 'completionTokens', 'totalTokens',
            'cost', 'duration', 'success', 'error'
        ];
        const rows = data.events.map((event) => [
            event.timestamp.toISOString(),
            event.providerId,
            event.modelName,
            event.taskType,
            event.tokens.prompt,
            event.tokens.completion,
            event.tokens.total,
            event.cost.toFixed(6),
            event.duration,
            event.success,
            event.error || ''
        ]);
        return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    }
    /**
     * 保存数据到文件
     */
    async saveData() {
        if (!this.isPersistenceEnabled)
            return;
        try {
            const todayFile = this.getTodayFilePath();
            const data = JSON.stringify(this.events, null, 2);
            await fs.writeFile(todayFile, data, 'utf-8');
        }
        catch (error) {
            console.error('保存用量数据失败:', error);
        }
    }
    /**
     * 获取今日文件路径
     */
    getTodayFilePath() {
        const today = new Date().toISOString().split('T')[0];
        return path.join(this.storagePath, `usage-${today}.json`);
    }
    /**
     * 清理旧数据
     */
    async cleanupOldData(maxAgeDays = 90) {
        if (!this.isPersistenceEnabled)
            return;
        try {
            const files = await fs.readdir(this.storagePath);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
            for (const file of files) {
                if (file.startsWith('usage-') && file.endsWith('.json')) {
                    const dateStr = file.replace('usage-', '').replace('.json', '');
                    const fileDate = new Date(dateStr);
                    if (fileDate < cutoffDate) {
                        await fs.unlink(path.join(this.storagePath, file));
                    }
                }
            }
            this.emit('dataCleaned', maxAgeDays);
        }
        catch (error) {
            console.error('清理旧数据失败:', error);
        }
    }
    /**
     * 更新成本限制配置
     */
    updateCostLimits(newLimits) {
        this.costLimits = { ...this.costLimits, ...newLimits };
        this.emit('costLimitsUpdated', this.costLimits);
    }
    /**
     * 获取当前成本限制配置
     */
    getCostLimits() {
        return { ...this.costLimits };
    }
    /**
     * 重置用量统计
     */
    reset() {
        this.events = [];
        this.emit('dataReset');
    }
    /**
     * 销毁用量统计器
     */
    async destroy() {
        await this.saveData();
        this.removeAllListeners();
    }
}
//# sourceMappingURL=usage-tracker.js.map