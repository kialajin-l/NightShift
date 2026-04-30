// 临时类型定义 - 替代 @ruleforge/core 的功能
/**
 * 初始化 RuleForge 的模拟函数
 */
export function initializeRuleForge() {
    return {
        processConversationLog: async (log) => ({
            detectedPatterns: [],
            generatedRules: [],
            yamlOutput: '',
            metadata: {}
        })
    };
}
