/**
 * 会话日志数据结构
 */
export interface ConversationLog {
    id: string;
    timestamp: Date;
    messages: Message[];
    metadata: {
        projectId: string;
        userId: string;
        sessionId: string;
        language?: string;
        framework?: string;
        duration?: number;
    };
}
/**
 * 消息数据结构
 */
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: {
        toolCalls?: ToolCall[];
        codeBlocks?: CodeBlock[];
        errors?: Error[];
        sentiment?: 'positive' | 'negative' | 'neutral';
        complexity?: 'simple' | 'medium' | 'complex';
    };
}
/**
 * 工具调用数据结构
 */
export interface ToolCall {
    name: string;
    arguments: Record<string, any>;
    result?: any;
    duration?: number;
    success: boolean;
}
/**
 * 代码块数据结构
 */
export interface CodeBlock {
    language: string;
    code: string;
    filename?: string;
    changes?: CodeChange[];
    metadata?: {
        quality?: number;
        complexity?: number;
        styleScore?: number;
    };
}
/**
 * 代码变更数据结构
 */
export interface CodeChange {
    type: 'add' | 'modify' | 'delete';
    lineNumber: number;
    content: string;
    oldContent?: string;
}
/**
 * 错误数据结构
 */
export interface Error {
    type: string;
    message: string;
    stack?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context?: string;
    solution?: string;
}
/**
 * 解析结果
 */
export interface ParseResult {
    log: ConversationLog;
    statistics: {
        totalMessages: number;
        userMessages: number;
        assistantMessages: number;
        systemMessages: number;
        totalCodeBlocks: number;
        totalErrors: number;
        totalToolCalls: number;
        averageMessageLength: number;
        sentimentScore: number;
        complexityScore: number;
    };
    patterns: {
        repeatedInstructions: string[];
        commonErrors: Error[];
        userPreferences: string[];
        codePatterns: CodePattern[];
    };
    insights: {
        technicalDebt: number;
        learningProgress: number;
        efficiency: number;
        recommendations: string[];
    };
}
/**
 * 代码模式
 */
export interface CodePattern {
    type: 'naming' | 'structure' | 'style' | 'optimization';
    pattern: string;
    frequency: number;
    examples: string[];
    confidence: number;
}
/**
 * 会话日志解析器
 */
export declare class ConversationLogParser {
    /**
     * 解析会话日志
     */
    parse(log: ConversationLog): Promise<ParseResult>;
    /**
     * 计算统计信息
     */
    private calculateStatistics;
    /**
     * 计算情感分数
     */
    private calculateSentimentScore;
    /**
     * 计算复杂度分数
     */
    private calculateComplexityScore;
    /**
     * 检测模式
     */
    private detectPatterns;
    /**
     * 检测重复指令
     */
    private detectRepeatedInstructions;
    /**
     * 检测常见错误
     */
    private detectCommonErrors;
    /**
     * 检测用户偏好
     */
    private detectUserPreferences;
    /**
     * 检测代码模式
     */
    private detectCodePatterns;
    /**
     * 检测命名模式
     */
    private detectNamingPatterns;
    /**
     * 分析变量命名
     */
    private analyzeVariableNaming;
    /**
     * 分析函数命名
     */
    private analyzeFunctionNaming;
    /**
     * 检测结构模式
     */
    private detectStructurePatterns;
    /**
     * 分析导入模式
     */
    private analyzeImportPatterns;
    /**
     * 检测风格模式
     */
    private detectStylePatterns;
    /**
     * 分析缩进风格
     */
    private analyzeIndentation;
    /**
     * 生成洞察
     */
    private generateInsights;
    /**
     * 计算技术债务
     */
    private calculateTechnicalDebt;
    /**
     * 计算学习进度
     */
    private calculateLearningProgress;
    /**
     * 计算效率
     */
    private calculateEfficiency;
    /**
     * 生成建议
     */
    private generateRecommendations;
    /**
     * 批量解析会话日志
     */
    parseBatch(logs: ConversationLog[]): Promise<ParseResult[]>;
    /**
     * 验证会话日志格式
     */
    validateLog(log: ConversationLog): {
        isValid: boolean;
        errors: string[];
    };
}
