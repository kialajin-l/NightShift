import { SessionLog, PatternRecognitionResult } from './types';
/**
 * RuleForge 模式识别引擎
 * 负责分析会话日志，识别重复模式，生成规则候选
 */
export declare class PatternRecognizer {
    private sessionLogs;
    private minOccurrences;
    private minConfidence;
    /**
     * 添加会话日志
     */
    addSessionLog(log: SessionLog): void;
    /**
     * 批量添加会话日志
     */
    addSessionLogs(logs: SessionLog[]): void;
    /**
     * 识别模式
     */
    recognizePatterns(): PatternRecognitionResult;
    /**
     * 分析关键词频率
     */
    private analyzeKeywords;
    /**
     * 分析文件类型
     */
    private analyzeFileTypes;
    /**
     * 分析错误模式
     */
    private analyzeErrors;
    /**
     * 分析代码结构
     */
    private analyzeCodeStructure;
    /**
     * 生成规则候选
     */
    private generateRuleCandidates;
    /**
     * 创建规则候选
     */
    private createRuleCandidate;
    /**
     * 提取关键词
     */
    private extractKeywords;
    /**
     * 获取文件类型
     */
    private getFileType;
    /**
     * 分类错误
     */
    private classifyError;
    /**
     * 分析文件结构
     */
    private analyzeFileStructure;
    /**
     * 生成错误解决方案
     */
    private generateErrorSolutions;
    /**
     * 生成规则名称
     */
    private generateRuleName;
    /**
     * 生成规则描述
     */
    private generateRuleDescription;
    /**
     * 生成关键词模板
     */
    private generateKeywordTemplate;
    /**
     * 生成文件模板
     */
    private generateFileTemplate;
    /**
     * 生成结构模板
     */
    private generateStructureTemplate;
    /**
     * 计算总体置信度
     */
    private calculateOverallConfidence;
    /**
     * 清空会话日志
     */
    clearSessionLogs(): void;
    /**
     * 获取会话日志数量
     */
    getSessionCount(): number;
    /**
     * 设置最小出现次数
     */
    setMinOccurrences(count: number): void;
    /**
     * 设置最小置信度
     */
    setMinConfidence(confidence: number): void;
}
//# sourceMappingURL=pattern-recognizer.d.ts.map