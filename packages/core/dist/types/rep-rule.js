/**
 * REP v0.1 Schema 类型定义和验证器
 */
import { z } from 'zod';
/**
 * REP v0.1 规则 Schema
 */
export const RepRuleSchema = z.object({
    meta: z.object({
        id: z.string().min(1, 'ID 不能为空'),
        name: z.string().min(1, '名称不能为空'),
        version: z.string().regex(/^\d+\.\d+\.\d+$/, '版本号必须符合语义版本格式'),
        description: z.string().min(10, '描述至少需要10个字符'),
        authors: z.array(z.string()).min(1, '至少需要一个作者'),
        license: z.string().min(1, '许可证不能为空'),
        tags: z.array(z.string()).optional(),
        created_at: z.string().datetime().optional(),
    }),
    rule: z.object({
        trigger: z.object({
            keywords: z.array(z.string(), { message: '触发关键词不能为空' }),
            file_pattern: z.string().min(1, '文件匹配模式不能为空'),
            language: z.string().min(1, '编程语言不能为空'),
        }),
        condition: z.string().min(1, '检查条件不能为空'),
        suggestion: z.string().min(1, '修复建议不能为空'),
    }),
    compatibility: z.object({
        frameworks: z.record(z.string(), { message: '框架版本约束不能为空' }),
        languages: z.record(z.string(), { message: '语言版本约束不能为空' }),
        rep_version: z.string().min(1, '协议版本不能为空'),
    }),
});
//# sourceMappingURL=rep-rule.js.map