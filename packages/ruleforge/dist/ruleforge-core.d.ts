import { ConversationLog, ParseResult } from './parsers/conversation-log-parser';
import { Pattern } from './engines/pattern-recognition-engine';
import { RuleYAML, ValidationResult } from './generators/yaml-generator';
/**
 * RuleForge 配置
 */
export interface RuleForgeConfig {
    parser?: {
        minMessageLength?: number;
        maxMessages?: number;
        enableSentimentAnalysis?: boolean;
        enableComplexityAnalysis?: boolean;
    };
    recognition?: {
        minConfidence?: number;
        minFrequency?: number;
        maxPatterns?: number;
        enableMachineLearning?: boolean;
    };
    generator?: {
        includeMetadata?: boolean;
        includeExamples?: boolean;
        includeTags?: boolean;
        maxExamples?: number;
        defaultAuthor?: string;
    };
    general?: {
        autoSave?: boolean;
        savePath?: string;
        logLevel?: 'debug' | 'info' | 'warn' | 'error';
    };
}
/**
 * RuleForge 处理结果
 */
export interface RuleForgeResult {
    logAnalysis: ParseResult;
    detectedPatterns: Pattern[];
    generatedRules: RuleYAML[];
    yamlOutput: string;
    statistics: {
        totalPatterns: number;
        validRules: number;
        processingTime: number;
        memoryUsage: number;
    };
    errors: string[];
    warnings: string[];
}
/**
 * RuleForge 核心引擎
 */
export declare class RuleForgeCore {
    private parser;
    private recognitionEngine;
    private yamlGenerator;
    private config;
    private processingHistory;
    private errorLog;
    constructor(config?: RuleForgeConfig);
    /**
     * 处理会话日志并生成规则
     */
    processConversationLog(log: ConversationLog): Promise<RuleForgeResult>;
    /**
     * 批量处理会话日志
     */
    processBatchConversationLogs(logs: ConversationLog[]): Promise<RuleForgeResult[]>;
    /**
     * 保存规则到文件
     */
    private saveRules;
    /**
     * 获取内存使用情况
     */
    private getMemoryUsage;
    /**
     * 日志记录
     */
    private log;
    /**
     * 获取处理历史
     */
    getProcessingHistory(): RuleForgeResult[];
    /**
     * 获取错误日志
     */
    getErrorLog(): string[];
    /**
     * 获取统计信息
     */
    getStatistics(): {
        totalProcessed: number;
        successfulProcesses: number;
        totalPatternsDetected: number;
        totalRulesGenerated: number;
        averageProcessingTime: number;
    };
    /**
     * 重置引擎状态
     */
    reset(): void;
    /**
     * 导出模式库
     */
    exportPatternLibrary(): Record<string, Pattern>;
    /**
     * 导入模式库
     */
    importPatternLibrary(library: Record<string, Pattern>): void;
    /**
     * 验证单个规则
     */
    validateRule(rule: RuleYAML): ValidationResult;
    /**
     * 序列化单个规则
     */
    serializeRule(rule: RuleYAML): string;
    /**
     * 反序列化规则
     */
    deserializeRule(yamlString: string): RuleYAML;
    /**
     * 获取配置
     */
    getConfig(): RuleForgeConfig;
    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<RuleForgeConfig>): void;
}
/**
 * 创建 RuleForge 实例的工厂函数
 */
export declare function createRuleForge(config?: RuleForgeConfig): RuleForgeCore;
/**
 * 默认 RuleForge 实例
 */
export declare const defaultRuleForge: RuleForgeCore;
