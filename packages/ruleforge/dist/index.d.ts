export { ConversationLogParser, ConversationLog, ParseResult } from './parsers/conversation-log-parser';
export { PatternRecognitionEngine, Pattern } from './engines/pattern-recognition-engine';
export { YAMLGenerator, RuleYAML, ValidationResult } from './generators/yaml-generator';
export { RuleForgeCore, RuleForgeConfig, RuleForgeResult, createRuleForge, defaultRuleForge } from './ruleforge-core';
/**
 * RuleForge 版本信息
 */
export declare const VERSION = "1.0.0";
/**
 * RuleForge 功能描述
 */
export declare const DESCRIPTION = "NightShift RuleForge - \u667A\u80FD\u4EE3\u7801\u89C4\u5219\u751F\u6210\u5F15\u64CE";
/**
 * 初始化 RuleForge
 */
export declare function initializeRuleForge(config?: RuleForgeConfig): RuleForgeCore;
/**
 * 快速处理会话日志
 */
export declare function quickProcess(log: ConversationLog): Promise<RuleForgeResult>;
/**
 * 验证规则 YAML
 */
export declare function validateRuleYAML(yamlString: string): ValidationResult;
/**
 * 示例用法
 */
export declare const exampleUsage = "\n// \u57FA\u672C\u7528\u6CD5\u793A\u4F8B\nimport { initializeRuleForge, ConversationLog } from './types/ruleforge-core-mock';\n\n// \u521D\u59CB\u5316 RuleForge\nconst ruleForge = initializeRuleForge();\n\n// \u521B\u5EFA\u793A\u4F8B\u4F1A\u8BDD\u65E5\u5FD7\nconst exampleLog: ConversationLog = {\n  id: 'example-session-001',\n  timestamp: new Date(),\n  messages: [\n    {\n      role: 'user',\n      content: '\u8BF7\u5E2E\u6211\u521B\u5EFA\u4E00\u4E2A React \u7EC4\u4EF6',\n      timestamp: new Date()\n    },\n    {\n      role: 'assistant', \n      content: '\u597D\u7684\uFF0C\u6211\u6765\u5E2E\u4F60\u521B\u5EFA\u4E00\u4E2A React \u7EC4\u4EF6',\n      timestamp: new Date(),\n      metadata: {\n        codeBlocks: [\n          {\n            language: 'typescript',\n            code: 'function MyComponent() {\\n  return <div>Hello World</div>;\\n}'\n          }\n        ]\n      }\n    }\n  ],\n  metadata: {\n    projectId: 'example-project',\n    userId: 'user-001',\n    sessionId: 'session-001'\n  }\n};\n\n// \u5904\u7406\u4F1A\u8BDD\u65E5\u5FD7\nconst result = await ruleForge.processConversationLog(exampleLog);\n\n// \u8F93\u51FA\u7ED3\u679C\nconsole.log('\u68C0\u6D4B\u5230\u7684\u6A21\u5F0F:', result.detectedPatterns.length);\nconsole.log('\u751F\u6210\u7684\u89C4\u5219:', result.generatedRules.length);\nconsole.log('YAML \u8F93\u51FA:', result.yamlOutput);\n";
declare const RuleForge: {
    VERSION: string;
    DESCRIPTION: string;
    initializeRuleForge: typeof initializeRuleForge;
    quickProcess: typeof quickProcess;
    validateRuleYAML: typeof validateRuleYAML;
    exampleUsage: string;
};
export default RuleForge;
