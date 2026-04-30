/**
 * RuleForge 核心类型定义
 */

// 会话日志类型
export interface SessionLog {
  id: string;
  userInput: string;
  aiResponse: string;
  timestamp: Date;
  generatedFiles?: GeneratedFile[];
  errors?: string[];
  metadata?: Record<string, any>;
}

// 生成的文件
export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  size: number;
}

// 代码模式
export interface CodePattern {
  type: 'keyword' | 'file_type' | 'error' | 'structure';
  pattern: string;
  frequency: number;
  confidence: number;
  contexts: string[];
  metadata: Record<string, any>;
}

// 规则候选
export interface RuleCandidate {
  id: string;
  name: string;
  description: string;
  pattern: string;
  confidence: number;
  frequency: number;
  type: string;
  metadata: Record<string, any>;
  trigger?: RuleTrigger;
  condition?: RuleCondition;
  suggestion?: RuleSuggestion;
}

// 规则触发器
export interface RuleTrigger {
  type: 'keyword_match' | 'file_type_match' | 'error_match' | 'code_structure_match';
  keywords?: string[];
  fileTypes?: string[];
  errorTypes?: string[];
  structure?: string;
}

// 规则条件
export interface RuleCondition {
  type: 'frequency_threshold' | 'project_structure' | 'error_context' | 'code_pattern';
  threshold?: number;
  requiredFiles?: string[];
  context?: string;
  pattern?: string;
}

// 规则建议
export interface RuleSuggestion {
  type: 'template_suggestion' | 'file_template' | 'error_fix' | 'structure_template';
  template?: string;
  solutions?: string[];
}

// 模式识别结果
export interface PatternRecognitionResult {
  patterns: CodePattern[];
  candidates: RuleCandidate[];
  confidence: number;
  totalSessions: number;
}

// REP v0.1 规则格式
export interface REPRule {
  meta: {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    created: string;
    updated: string;
  };
  rule: {
    trigger: {
      type: string;
      pattern: string;
      context?: string;
    };
    condition: {
      type: string;
      threshold?: number;
      files?: string[];
    };
    suggestion: {
      type: string;
      template: string;
      code?: string;
      description: string;
    };
  };
  compatibility: {
    languages: string[];
    frameworks: string[];
    tools: string[];
  };
}

// YAML 生成配置
export interface YAMLGeneratorConfig {
  autoSanitize: boolean;
  includeExamples: boolean;
  maxExampleLines: number;
  validateSchema: boolean;
}

// 任务相关类型
export interface Task {
  id: string;
  name: string;
  description: string;
  type: 'frontend' | 'backend' | 'test' | 'documentation';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  estimatedTime?: number;
  dependencies?: string[];
  agent?: string;
  model?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Agent 相关类型
export interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  skills: string[];
  isActive: boolean;
}

// 通信协议类型
export interface Message {
  id: string;
  type: 'request' | 'response' | 'error';
  from: string;
  to: string;
  content: any;
  timestamp: Date;
}

// 模型路由配置
export interface ModelRouterConfig {
  defaultModel: string;
  fallbackModels: string[];
  routingRules: RoutingRule[];
}

export interface RoutingRule {
  condition: string;
  model: string;
  priority: number;
}

// 错误类型
export class RuleForgeError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'RuleForgeError';
  }
}