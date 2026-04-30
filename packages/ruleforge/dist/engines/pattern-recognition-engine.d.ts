import { CodeBlock, Error as ErrorType } from '../parsers/conversation-log-parser';
/**
 * 模式数据结构
 */
export interface Pattern {
    id: string;
    type: 'code-style' | 'architecture' | 'best-practice' | 'error-pattern';
    description: string;
    examples: PatternExample[];
    confidence: number;
    frequency: number;
    firstSeen: Date;
    lastSeen: Date;
    metadata?: {
        severity?: 'low' | 'medium' | 'high' | 'critical';
        impact?: 'performance' | 'security' | 'maintainability' | 'readability';
        category?: string;
        tags?: string[];
    };
}
/**
 * 模式示例
 */
export interface PatternExample {
    context: string;
    code: string;
    explanation: string;
    source: 'conversation' | 'user-feedback' | 'auto-detected';
}
/**
 * 代码风格模式
 */
export interface CodeStylePattern extends Pattern {
    type: 'code-style';
    style: {
        naming?: string;
        indentation?: string;
        spacing?: string;
        comments?: string;
        imports?: string;
    };
}
/**
 * 架构模式
 */
export interface ArchitecturePattern extends Pattern {
    type: 'architecture';
    architecture: {
        pattern: string;
        components: string[];
        relationships: string[];
    };
}
/**
 * 最佳实践模式
 */
export interface BestPracticePattern extends Pattern {
    type: 'best-practice';
    practice: {
        category: string;
        benefits: string[];
        implementation: string;
    };
}
/**
 * 错误模式
 */
export interface ErrorPattern extends Pattern {
    type: 'error-pattern';
    error: {
        type: string;
        causes: string[];
        solutions: string[];
        prevention: string[];
    };
}
/**
 * 识别配置
 */
export interface RecognitionConfig {
    minConfidence: number;
    minFrequency: number;
    maxPatterns: number;
    enableMachineLearning: boolean;
    languageSpecific: boolean;
}
/**
 * 模式识别引擎
 */
export declare class PatternRecognitionEngine {
    private config;
    private detectedPatterns;
    constructor(config?: Partial<RecognitionConfig>);
    /**
     * 分析对话，识别模式
     */
    analyzeConversation(log: any): Promise<Pattern[]>;
    /**
     * 检测代码风格
     */
    detectCodeStyle(codeBlocks: CodeBlock[]): CodeStylePattern[];
    /**
     * 检测命名规范
     */
    private detectNamingConventions;
    /**
     * 分析命名风格
     */
    private analyzeNamingStyle;
    /**
     * 检测缩进风格
     */
    private detectIndentationStyles;
    /**
     * 检测注释风格
     */
    private detectCommentStyles;
    /**
     * 检测导入风格
     */
    private detectImportStyles;
    /**
     * 检测架构模式
     */
    detectArchitecture(codeBlocks: CodeBlock[]): ArchitecturePattern[];
    /**
     * 检测组件化模式
     */
    private detectComponentPatterns;
    /**
     * 检测状态管理模式
     */
    private detectStatePatterns;
    /**
     * 检测最佳实践
     */
    detectBestPractices(codeBlocks: CodeBlock[]): BestPracticePattern[];
    /**
     * 检测错误处理模式
     */
    private detectErrorHandling;
    /**
     * 检测性能优化模式
     */
    private detectPerformanceOptimizations;
    /**
     * 检测错误模式
     */
    detectErrorPatterns(errors: ErrorType[]): ErrorPattern[];
    /**
     * 提取代码块
     */
    private extractCodeBlocks;
    /**
     * 提取错误信息
     */
    private extractErrors;
    /**
     * 查找主导风格
     */
    private findDominantStyle;
    /**
     * 计算置信度
     */
    private calculateConfidence;
    /**
     * 计算错误模式的置信度
     */
    private calculateConfidenceForErrors;
    /**
     * 提取常见原因
     */
    private extractCommonCauses;
    /**
     * 提取常见解决方案
     */
    private extractCommonSolutions;
    /**
     * 生成预防建议
     */
    private generatePreventionTips;
    /**
     * 更新模式库
     */
    private updatePatternLibrary;
    /**
     * 清理模式库
     */
    private cleanupPatternLibrary;
    /**
     * 过滤和排序模式
     */
    private filterAndSortPatterns;
    /**
     * 获取所有检测到的模式
     */
    getAllPatterns(): Pattern[];
    /**
     * 根据类型获取模式
     */
    getPatternsByType(type: Pattern['type']): Pattern[];
    /**
     * 根据置信度获取模式
     */
    getPatternsByConfidence(minConfidence: number): Pattern[];
    /**
     * 重置模式库
     */
    resetPatternLibrary(): void;
    /**
     * 导出模式库
     */
    exportPatternLibrary(): Record<string, Pattern>;
    /**
     * 导入模式库
     */
    importPatternLibrary(library: Record<string, Pattern>): void;
}
