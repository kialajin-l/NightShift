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
 * 初始化 RuleForge 的模拟函数
 */
export declare function initializeRuleForge(): RuleForgeInstance;
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
