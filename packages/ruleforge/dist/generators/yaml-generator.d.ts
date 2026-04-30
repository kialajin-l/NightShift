import { Pattern } from '../engines/pattern-recognition-engine';
/**
 * 规则 YAML 数据结构
 */
export interface RuleYAML {
    rule: {
        id: string;
        name: string;
        description: string;
        type: 'code-style' | 'architecture' | 'best-practice' | 'error-pattern';
        pattern: string | RegExp;
        replacement?: string;
        examples: RuleExample[];
        confidence: number;
        source: string;
        tags: string[];
        metadata: {
            createdAt: Date;
            updatedAt: Date;
            version: string;
            author: string;
        };
    };
}
/**
 * 规则示例
 */
export interface RuleExample {
    before: string;
    after: string;
    explanation: string;
}
/**
 * 验证结果
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * YAML 生成器配置
 */
export interface YAMLGeneratorConfig {
    includeMetadata: boolean;
    includeExamples: boolean;
    includeTags: boolean;
    formatOutput: boolean;
    maxExamples: number;
    defaultAuthor: string;
    defaultVersion: string;
}
/**
 * YAML 生成器
 */
export declare class YAMLGenerator {
    private config;
    constructor(config?: Partial<YAMLGeneratorConfig>);
    /**
     * 从模式生成规则 YAML
     */
    generateRuleYAML(pattern: Pattern): RuleYAML;
    /**
     * 生成规则 ID
     */
    private generateRuleId;
    /**
     * 生成规则名称
     */
    private generateRuleName;
    /**
     * 生成规则描述
     */
    private generateRuleDescription;
    /**
     * 生成规则模式
     */
    private generateRulePattern;
    /**
     * 生成代码风格模式
     */
    private generateCodeStylePattern;
    /**
     * 生成架构模式
     */
    private generateArchitecturePattern;
    /**
     * 生成最佳实践模式
     */
    private generateBestPracticePattern;
    /**
     * 生成错误模式
     */
    private generateErrorPattern;
    /**
     * 生成规则替换
     */
    private generateRuleReplacement;
    /**
     * 生成规则示例
     */
    private generateRuleExamples;
    /**
     * 生成示例的 "before" 部分
     */
    private generateExampleBefore;
    /**
     * 生成示例的 "after" 部分
     */
    private generateExampleAfter;
    /**
     * 生成默认示例
     */
    private generateDefaultExample;
    /**
     * 生成规则标签
     */
    private generateRuleTags;
    /**
     * 批量生成规则
     */
    generateRulesYAML(patterns: Pattern[]): RuleYAML[];
    /**
     * 验证 YAML 格式
     */
    validateRuleYAML(yaml: RuleYAML): ValidationResult;
    /**
     * 序列化为 YAML 字符串
     */
    serializeToYAML(rule: RuleYAML): string;
    /**
     * 从 YAML 反序列化
     */
    deserializeFromYAML(yamlString: string): RuleYAML;
    /**
     * 解析 YAML 值
     */
    private parseYAMLValue;
    /**
     * 转义 YAML 字符串
     */
    private escapeYAMLString;
    /**
     * 批量序列化规则为 YAML 字符串
     */
    serializeRulesToYAML(rules: RuleYAML[]): string;
    /**
     * 批量从 YAML 字符串反序列化规则
     */
    deserializeRulesFromYAML(yamlString: string): RuleYAML[];
}
