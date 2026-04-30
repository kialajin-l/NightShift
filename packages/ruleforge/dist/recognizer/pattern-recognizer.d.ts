import { ParsedSession, RecognizerConfig, RecognitionResult } from '../types/pattern';
/**
 * 模式识别器 - 从开发会话中识别代码模式
 */
export declare class PatternRecognizer {
    private config;
    private weights;
    constructor(config?: Partial<RecognizerConfig>);
    /**
     * 主入口：从解析后的会话中识别候选模式
     */
    recognize(session: ParsedSession): Promise<RecognitionResult>;
    /**
     * 过滤排除的文件事件
     */
    private filterEvents;
    /**
     * 阶段1：关键词频率分析
     */
    private analyzeKeywords;
    /**
     * 阶段2：文件类型聚类
     */
    private clusterEvents;
    /**
     * 阶段3：模式匹配与置信度计算
     */
    private matchTemplates;
    /**
     * 计算模式置信度
     */
    private calculateConfidence;
    /**
     * 计算关键词匹配得分
     */
    private calculateKeywordScore;
    /**
     * 计算文件模式匹配得分
     */
    private calculateFileScore;
    /**
     * 创建候选模式
     */
    private createCandidatePattern;
    /**
     * 生成模式ID
     */
    private generatePatternId;
    /**
     * 匹配文件模式（简化版 glob 匹配）
     */
    private matchFilePattern;
    /**
     * 从文件路径获取语言
     */
    private getLanguageFromFile;
    /**
     * 静态工具方法：提取关键词
     */
    static extractKeywords(code: string, language: string): string[];
    /**
     * 静态工具方法：规范化路径
     */
    static normalizePath(path: string): string;
}
