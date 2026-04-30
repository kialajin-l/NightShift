/**
 * RuleForge YAML 格式化器
 * 将 Pattern 转换为符合 REP v0.1 标准的 YAML 格式
 */
import { Pattern, RuleForgeConfig } from '../types/rep-rule.js';
/**
 * RuleForge YAML 格式化器
 */
export declare class RuleYamlFormatter {
    private readonly config;
    /**
     * 构造函数
     * @param config - 格式化器配置
     */
    constructor(config?: RuleForgeConfig);
    /**
     * 将 Pattern 转换为 YAML 字符串
     * @param pattern - 要转换的模式
     * @returns 符合 REP v0.1 标准的 YAML 字符串
     */
    toYAML(pattern: Pattern): Promise<string>;
    /**
     * 验证模式是否符合转换要求
     * @param pattern - 要验证的模式
     * @returns 验证结果
     */
    private validatePattern;
    /**
     * 将 Pattern 转换为 REP v0.1 规则
     * @param pattern - 要转换的模式
     * @returns REP v0.1 规则对象
     */
    private patternToRepRule;
    /**
     * 生成规则名称
     * @param pattern - 模式
     * @returns 人类可读的规则名称
     */
    private generateRuleName;
    /**
     * 生成检查条件
     * @param pattern - 模式
     * @returns 自然语言检查条件
     */
    private generateCondition;
    /**
     * 生成框架兼容性信息
     * @param pattern - 模式
     * @returns 框架版本约束
     */
    private generateFrameworkCompatibility;
    /**
     * 敏感信息脱敏
     * @param content - 原始内容
     * @returns 脱敏后的内容
     */
    private redactSensitiveInfo;
    /**
     * 生成代码示例
     * @param pattern - 模式
     * @returns 代码示例对象
     */
    private generateCodeExample;
    /**
     * 提取问题代码
     * @param pattern - 模式
     * @returns 问题代码片段
     */
    private extractBeforeCode;
    /**
     * 提取修复代码
     * @param pattern - 模式
     * @returns 修复代码片段
     */
    private extractAfterCode;
    /**
     * 截断代码
     * @param code - 原始代码
     * @param maxLines - 最大行数
     * @returns 截断后的代码
     */
    private truncateCode;
    /**
     * 格式化 YAML
     * @param obj - 要格式化的对象
     * @param indent - 缩进级别
     * @returns 格式化的 YAML 字符串
     */
    private formatYAML;
    /**
     * 转义 YAML 值
     * @param value - 要转义的值
     * @returns 转义后的字符串
     */
    private escapeYAML;
}
//# sourceMappingURL=yaml-formatter.d.ts.map