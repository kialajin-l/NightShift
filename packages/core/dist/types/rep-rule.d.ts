/**
 * REP v0.1 Schema 类型定义和验证器
 */
import { z } from 'zod';
/**
 * REP v0.1 规则 Schema
 */
export declare const RepRuleSchema: z.ZodObject<{
    meta: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        version: z.ZodString;
        description: z.ZodString;
        authors: z.ZodArray<z.ZodString, "many">;
        license: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        created_at: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        version: string;
        authors: string[];
        license: string;
        tags?: string[] | undefined;
        created_at?: string | undefined;
    }, {
        id: string;
        name: string;
        description: string;
        version: string;
        authors: string[];
        license: string;
        tags?: string[] | undefined;
        created_at?: string | undefined;
    }>;
    rule: z.ZodObject<{
        trigger: z.ZodObject<{
            keywords: z.ZodArray<z.ZodString, "many">;
            file_pattern: z.ZodString;
            language: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            keywords: string[];
            file_pattern: string;
            language: string;
        }, {
            keywords: string[];
            file_pattern: string;
            language: string;
        }>;
        condition: z.ZodString;
        suggestion: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        trigger: {
            keywords: string[];
            file_pattern: string;
            language: string;
        };
        condition: string;
        suggestion: string;
    }, {
        trigger: {
            keywords: string[];
            file_pattern: string;
            language: string;
        };
        condition: string;
        suggestion: string;
    }>;
    compatibility: z.ZodObject<{
        frameworks: z.ZodRecord<z.ZodString, z.ZodString>;
        languages: z.ZodRecord<z.ZodString, z.ZodString>;
        rep_version: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        frameworks: Record<string, string>;
        languages: Record<string, string>;
        rep_version: string;
    }, {
        frameworks: Record<string, string>;
        languages: Record<string, string>;
        rep_version: string;
    }>;
}, "strip", z.ZodTypeAny, {
    meta: {
        id: string;
        name: string;
        description: string;
        version: string;
        authors: string[];
        license: string;
        tags?: string[] | undefined;
        created_at?: string | undefined;
    };
    rule: {
        trigger: {
            keywords: string[];
            file_pattern: string;
            language: string;
        };
        condition: string;
        suggestion: string;
    };
    compatibility: {
        frameworks: Record<string, string>;
        languages: Record<string, string>;
        rep_version: string;
    };
}, {
    meta: {
        id: string;
        name: string;
        description: string;
        version: string;
        authors: string[];
        license: string;
        tags?: string[] | undefined;
        created_at?: string | undefined;
    };
    rule: {
        trigger: {
            keywords: string[];
            file_pattern: string;
            language: string;
        };
        condition: string;
        suggestion: string;
    };
    compatibility: {
        frameworks: Record<string, string>;
        languages: Record<string, string>;
        rep_version: string;
    };
}>;
/**
 * REP v0.1 规则类型
 */
export type RepRule = z.infer<typeof RepRuleSchema>;
/**
 * 验证结果接口
 */
export interface ValidationResult {
    success: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * 代码示例接口
 */
export interface CodeExample {
    before: string;
    after: string;
    explanation: string;
    language: string;
}
/**
 * 模式接口（从 RuleForge 适配）
 */
export interface Pattern {
    id: string;
    category: 'code_style' | 'error_fix' | 'test_pattern' | 'api_design';
    trigger: {
        keywords: string[];
        filePattern: string;
        frequency: number;
    };
    solution: {
        description: string;
        codeExample?: {
            before: string;
            after: string;
            language: string;
        };
    };
    confidence: number;
    applicableScenes: number;
    evidence: string[];
    sessions?: Array<{
        type: string;
        file?: string;
        content?: string;
        message?: string;
        timestamp: string;
        metadata?: Record<string, any>;
        changes?: string[];
        codeSnippet?: string;
    }>;
    explanation?: string;
    language?: string;
}
/**
 * RuleForge 配置接口
 */
export interface RuleForgeConfig {
    minConfidence?: number;
    enableRedaction?: boolean;
    codeExampleMaxLines?: number;
    includeTimestamps?: boolean;
    customValidators?: Array<(pattern: Pattern) => ValidationResult>;
}
//# sourceMappingURL=rep-rule.d.ts.map