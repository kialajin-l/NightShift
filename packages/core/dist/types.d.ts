/**
 * RuleForge 核心类型定义
 */
export interface SessionLog {
    id: string;
    userInput: string;
    aiResponse: string;
    timestamp: Date;
    generatedFiles?: GeneratedFile[];
    errors?: string[];
    metadata?: Record<string, any>;
}
export interface GeneratedFile {
    path: string;
    content: string;
    language: string;
    size: number;
}
export interface CodePattern {
    type: 'keyword' | 'file_type' | 'error' | 'structure';
    pattern: string;
    frequency: number;
    confidence: number;
    contexts: string[];
    metadata: Record<string, any>;
}
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
export interface RuleTrigger {
    type: 'keyword_match' | 'file_type_match' | 'error_match' | 'code_structure_match';
    keywords?: string[];
    fileTypes?: string[];
    errorTypes?: string[];
    structure?: string;
}
export interface RuleCondition {
    type: 'frequency_threshold' | 'project_structure' | 'error_context' | 'code_pattern';
    threshold?: number;
    requiredFiles?: string[];
    context?: string;
    pattern?: string;
}
export interface RuleSuggestion {
    type: 'template_suggestion' | 'file_template' | 'error_fix' | 'structure_template';
    template?: string;
    solutions?: string[];
}
export interface PatternRecognitionResult {
    patterns: CodePattern[];
    candidates: RuleCandidate[];
    confidence: number;
    totalSessions: number;
}
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
export interface YAMLGeneratorConfig {
    autoSanitize: boolean;
    includeExamples: boolean;
    maxExampleLines: number;
    validateSchema: boolean;
}
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
export interface Agent {
    id: string;
    name: string;
    role: string;
    model: string;
    skills: string[];
    isActive: boolean;
}
export interface Message {
    id: string;
    type: 'request' | 'response' | 'error';
    from: string;
    to: string;
    content: any;
    timestamp: Date;
}
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
export declare class RuleForgeError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
//# sourceMappingURL=types.d.ts.map