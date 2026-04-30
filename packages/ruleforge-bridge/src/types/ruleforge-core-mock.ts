// 临时类型定义 - 替代 @ruleforge/core 的功能

/**
 * 规则提取器接口
 */
export interface RuleExtractor {
  extractRules(conversationLog: ConversationLog): Promise<RuleExtractionResult>;
}

/**
 * 规则验证器接口
 */
export interface RuleValidator {
  validateRule(rule: Rule): Promise<ValidationResult>;
}

/**
 * 对话日志接口
 */
export interface ConversationLog {
  id: string;
  timestamp: Date;
  messages: Message[];
  metadata?: Record<string, any>;
}

/**
 * 消息接口
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * 规则接口
 */
export interface Rule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  action: string;
  metadata?: Record<string, any>;
}

/**
 * 规则提取结果
 */
export interface RuleExtractionResult {
  success: boolean;
  rules: Rule[];
  errors?: string[];
  metadata?: Record<string, any>;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 初始化 RuleForge 的模拟函数
 */
export function initializeRuleForge(): RuleForgeInstance {
  return {
    processConversationLog: async (log: ConversationLog) => ({
      detectedPatterns: [],
      generatedRules: [],
      yamlOutput: '',
      metadata: {}
    })
  };
}

/**
 * RuleForge 实例接口
 */
export interface RuleForgeInstance {
  processConversationLog(log: ConversationLog): Promise<RuleProcessingResult>;
}

/**
 * 规则处理结果
 */
export interface RuleProcessingResult {
  detectedPatterns: Pattern[];
  generatedRules: Rule[];
  yamlOutput: string;
  metadata: Record<string, any>;
}

/**
 * 模式接口
 */
export interface Pattern {
  id: string;
  name: string;
  description: string;
  confidence: number;
  metadata?: Record<string, any>;
}