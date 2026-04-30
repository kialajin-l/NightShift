// NightShift RuleForge 主入口文件
export { ConversationLogParser } from './parsers/conversation-log-parser';
export { PatternRecognitionEngine } from './engines/pattern-recognition-engine';
export { YAMLGenerator } from './generators/yaml-generator';
export { RuleForgeCore, createRuleForge, defaultRuleForge } from './ruleforge-core';
/**
 * RuleForge 版本信息
 */
export const VERSION = '1.0.0';
/**
 * RuleForge 功能描述
 */
export const DESCRIPTION = 'NightShift RuleForge - 智能代码规则生成引擎';
/**
 * 初始化 RuleForge
 */
export function initializeRuleForge(config) {
    console.log(`🚀 初始化 NightShift RuleForge v${VERSION}`);
    console.log(`📝 ${DESCRIPTION}`);
    const ruleForge = createRuleForge(config);
    console.log('✅ RuleForge 初始化完成');
    console.log('💡 功能特性:');
    console.log('   • 智能会话日志解析');
    console.log('   • 模式识别与检测');
    console.log('   • 自动规则生成');
    console.log('   • YAML 格式输出');
    console.log('   • 批量处理支持');
    return ruleForge;
}
/**
 * 快速处理会话日志
 */
export async function quickProcess(log) {
    const ruleForge = initializeRuleForge();
    return await ruleForge.processConversationLog(log);
}
/**
 * 验证规则 YAML
 */
export function validateRuleYAML(yamlString) {
    const generator = new YAMLGenerator();
    try {
        const rule = generator.deserializeFromYAML(yamlString);
        return generator.validateRuleYAML(rule);
    }
    catch (error) {
        return {
            isValid: false,
            errors: [`YAML 解析失败: ${error instanceof Error ? error.message : String(error)}`],
            warnings: []
        };
    }
}
/**
 * 示例用法
 */
export const exampleUsage = `
// 基本用法示例
import { initializeRuleForge, ConversationLog } from './types/ruleforge-core-mock';

// 初始化 RuleForge
const ruleForge = initializeRuleForge();

// 创建示例会话日志
const exampleLog: ConversationLog = {
  id: 'example-session-001',
  timestamp: new Date(),
  messages: [
    {
      role: 'user',
      content: '请帮我创建一个 React 组件',
      timestamp: new Date()
    },
    {
      role: 'assistant', 
      content: '好的，我来帮你创建一个 React 组件',
      timestamp: new Date(),
      metadata: {
        codeBlocks: [
          {
            language: 'typescript',
            code: 'function MyComponent() {\\n  return <div>Hello World</div>;\\n}'
          }
        ]
      }
    }
  ],
  metadata: {
    projectId: 'example-project',
    userId: 'user-001',
    sessionId: 'session-001'
  }
};

// 处理会话日志
const result = await ruleForge.processConversationLog(exampleLog);

// 输出结果
console.log('检测到的模式:', result.detectedPatterns.length);
console.log('生成的规则:', result.generatedRules.length);
console.log('YAML 输出:', result.yamlOutput);
`;
// 默认导出
const RuleForge = {
    VERSION,
    DESCRIPTION,
    initializeRuleForge,
    quickProcess,
    validateRuleYAML,
    exampleUsage
};
export default RuleForge;
