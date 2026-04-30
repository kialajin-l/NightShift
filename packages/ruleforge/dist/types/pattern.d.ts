/**
 * 模式识别引擎类型定义
 */
/**
 * 解析后的事件类型
 */
export interface ParsedEvent {
    type: 'file_saved' | 'error_occurred' | 'error_fixed' | 'test_run' | 'terminal_command' | 'debug_start' | 'extension_change';
    file?: string;
    content?: string;
    message?: string;
    timestamp: string;
    metadata?: Record<string, any>;
}
/**
 * 解析后的会话数据
 */
export interface ParsedSession {
    sessionId: string;
    events: ParsedEvent[];
    metadata: {
        projectType: 'vue' | 'react' | 'fastapi' | 'node';
        language: 'typescript' | 'python' | 'javascript';
    };
}
/**
 * 候选模式接口
 */
export interface CandidatePattern {
    id: string;
    category: 'code_style' | 'error_fix' | 'test_pattern' | 'api_design';
    trigger: {
        keywords: string[];
        filePattern: string;
        frequency: number;
    };
    solution: {
        description: string;
        codeExample?: {
            before: string;
            after: string;
            language: string;
        };
    };
    confidence: number;
    applicableScenes: number;
    evidence: string[];
}
/**
 * 模式模板接口
 */
export interface PatternTemplate {
    id: string;
    category: CandidatePattern['category'];
    keywords: string[];
    filePattern: string;
    condition: (events: ParsedEvent[]) => boolean;
    minConfidence: number;
    solution: CandidatePattern['solution'];
}
/**
 * 关键词统计结果
 */
export interface KeywordStats {
    keyword: string;
    count: number;
    contexts: string[];
    weightedScore: number;
}
/**
 * 事件聚类结果
 */
export interface EventCluster {
    category: string;
    pattern: string;
    events: ParsedEvent[];
    keywordStats: Map<string, KeywordStats>;
}
/**
 * 识别器配置
 */
export interface RecognizerConfig {
    minConfidence: number;
    minFrequency: number;
    maxPatterns: number;
    excludePatterns: string[];
    customTemplates?: PatternTemplate[];
}
/**
 * 关键词分析配置
 */
export interface KeywordAnalysisConfig {
    minFrequency: number;
    excludeCommon: boolean;
    weightByContext: boolean;
}
/**
 * 文件模式聚类配置
 */
export interface FilePatternClusterConfig {
    patterns: Array<{
        pattern: string;
        category: string;
    }>;
}
/**
 * 置信度计算因子权重
 */
export interface ConfidenceWeights {
    keywordScore: number;
    fileScore: number;
    conditionScore: number;
    evidenceScore: number;
}
/**
 * 模式识别结果
 */
export interface RecognitionResult {
    patterns: CandidatePattern[];
    stats: {
        totalEvents: number;
        totalKeywords: number;
        clusters: number;
        processingTime: number;
    };
}
