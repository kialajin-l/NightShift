import { RuleCandidate, YAMLGeneratorConfig } from './types';
/**
 * RuleForge YAML 生成器
 * 负责将规则候选转换为符合 REP v0.1 标准的 YAML 文件
 */
export declare class YAMLGenerator {
    private config;
    constructor(config?: Partial<YAMLGeneratorConfig>);
    /**
     * 生成单个规则的 YAML
     */
    generateRuleYAML(candidate: RuleCandidate): string;
    /**
     * 批量生成规则 YAML
     */
    generateRulesYAML(candidates: RuleCandidate[]): Record<string, string>;
    /**
     * 转换为 REP v0.1 规则格式
     */
    private convertToREPRule;
    /**
     * 映射触发器类型
     */
    private mapTriggerType;
    /**
     * 映射条件类型
     */
    private mapConditionType;
    /**
     * 映射建议类型
     */
    private mapSuggestionType;
    /**
     * 生成默认模板
     */
    private generateDefaultTemplate;
    /**
     * 生成代码示例
     */
    private generateCodeExample;
    /**
     * 创建代码示例
     */
    private createCodeExample;
    /**
     * 创建关键词示例
     */
    private createKeywordExample;
    /**
     * 创建文件类型示例
     */
    private createFileTypeExample;
    /**
     * 创建错误示例
     */
    private createErrorExample;
    /**
     * 创建结构示例
     */
    private createStructureExample;
    /**
     * 生成建议描述
     */
    private generateSuggestionDescription;
    /**
     * 检测支持的语言
     */
    private detectLanguages;
    /**
     * 检测支持的框架
     */
    private detectFrameworks;
    /**
     * 检测支持的工具
     */
    private detectTools;
    /**
     * 清理代码
     */
    private sanitizeCode;
    /**
     * 验证 REP Schema
     */
    private validateREPSchema;
    /**
     * 格式化 YAML
     */
    private formatYAML;
    /**
     * 生成文件名
     */
    private generateFilename;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<YAMLGeneratorConfig>): void;
    /**
     * 获取当前配置
     */
    getConfig(): YAMLGeneratorConfig;
}
//# sourceMappingURL=yaml-generator.d.ts.map