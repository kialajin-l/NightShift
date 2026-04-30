/**
 * RuleForge YAML验证器 - 验证规则文件符合REP v0.1协议
 */

import { z } from 'zod';

// REP v0.1 Schema定义
const RuleMetaSchema = z.object({
  id: z.string().min(1, 'ID不能为空'),
  name: z.string().min(1, '名称不能为空'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, '版本号格式必须为x.y.z'),
  description: z.string().min(10, '描述至少10个字符'),
  author: z.string().min(1, '作者不能为空'),
  created: z.string().datetime('创建时间必须为ISO格式'),
  updated: z.string().datetime('更新时间必须为ISO格式')
});

const TriggerSchema = z.object({
  type: z.enum(['code_pattern', 'file_change', 'commit_message'], {
    errorMap: () => ({ message: '触发器类型必须是code_pattern、file_change或commit_message' })
  }),
  pattern: z.string().min(1, '模式不能为空'),
  language: z.string().min(1, '语言不能为空')
});

const ConstraintSchema = z.object({
  type: z.enum(['file_size', 'complexity', 'dependencies'], {
    errorMap: () => ({ message: '约束类型必须是file_size、complexity或dependencies' })
  }),
  condition: z.string().min(1, '条件不能为空')
});

const ConditionSchema = z.object({
  context: z.array(z.string()).min(1, '至少需要一个上下文'),
  constraints: z.array(ConstraintSchema).default([])
});

const ExampleSchema = z.object({
  before: z.string().min(1, '修改前代码不能为空'),
  after: z.string().min(1, '修改后代码不能为空'),
  explanation: z.string().min(10, '解释至少10个字符')
});

const SuggestionSchema = z.object({
  message: z.string().min(10, '建议消息至少10个字符'),
  fix: z.string().min(1, '修复方案不能为空'),
  examples: z.array(ExampleSchema).max(3, '最多3个示例'),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: '优先级必须是low、medium或high' })
  })
});

const RuleDefinitionSchema = z.object({
  trigger: TriggerSchema,
  condition: ConditionSchema,
  suggestion: SuggestionSchema
});

const CompatibilitySchema = z.object({
  engines: z.array(z.string()).min(1, '至少需要一个引擎'),
  platforms: z.array(z.string()).min(1, '至少需要一个平台'),
  dependencies: z.array(z.string()).default([])
});

const RuleSchema = z.object({
  meta: RuleMetaSchema,
  rule: RuleDefinitionSchema,
  compatibility: CompatibilitySchema
});

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  path: string;
  message: string;
  code: string;
}

interface ValidationWarning {
  path: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export class YAMLValidator {
  private logger: Console;

  constructor() {
    this.logger = console;
  }

  /**
   * 验证规则对象
   */
  validateRule(rule: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // 使用Zod进行严格验证
      RuleSchema.parse(rule);
      
      // 额外的业务逻辑验证
      this.validateBusinessLogic(rule, errors, warnings);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...this.formatZodErrors(error));
      } else {
        errors.push({
          path: 'unknown',
          message: '验证过程出错',
          code: 'VALIDATION_ERROR'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证YAML字符串
   */
  validateYAML(yamlString: string): ValidationResult {
    try {
      // 解析YAML（这里需要YAML解析库，暂时使用JSON模拟）
      const rule = this.parseYAML(yamlString);
      return this.validateRule(rule);
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          path: 'yaml',
          message: 'YAML解析失败',
          code: 'YAML_PARSE_ERROR'
        }],
        warnings: []
      };
    }
  }

  /**
   * 批量验证规则
   */
  validateRules(rules: any[]): {
    valid: any[];
    invalid: Array<{ rule: any; errors: ValidationError[] }>;
    statistics: {
      total: number;
      valid: number;
      invalid: number;
      errorCount: number;
      warningCount: number;
    };
  } {
    const valid: any[] = [];
    const invalid: Array<{ rule: any; errors: ValidationError[] }> = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const rule of rules) {
      const result = this.validateRule(rule);
      
      if (result.isValid) {
        valid.push(rule);
      } else {
        invalid.push({ rule, errors: result.errors });
      }
      
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
    }

    return {
      valid,
      invalid,
      statistics: {
        total: rules.length,
        valid: valid.length,
        invalid: invalid.length,
        errorCount: totalErrors,
        warningCount: totalWarnings
      }
    };
  }

  /**
   * 格式化Zod错误
   */
  private formatZodErrors(error: z.ZodError): ValidationError[] {
    return error.errors.map(zodError => ({
      path: zodError.path.join('.'),
      message: zodError.message,
      code: zodError.code || 'ZOD_VALIDATION_ERROR'
    }));
  }

  /**
   * 业务逻辑验证
   */
  private validateBusinessLogic(
    rule: any, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // 验证ID唯一性
    if (!this.isValidRuleId(rule.meta.id)) {
      warnings.push({
        path: 'meta.id',
        message: '建议使用更具描述性的规则ID',
        severity: 'low'
      });
    }

    // 验证版本号
    if (!this.isValidVersion(rule.meta.version)) {
      warnings.push({
        path: 'meta.version',
        message: '建议使用语义化版本号',
        severity: 'medium'
      });
    }

    // 验证时间戳
    if (!this.isValidTimestamp(rule.meta.created) || !this.isValidTimestamp(rule.meta.updated)) {
      warnings.push({
        path: 'meta',
        message: '时间戳格式建议使用ISO 8601',
        severity: 'low'
      });
    }

    // 验证代码示例
    this.validateExamples(rule.rule.suggestion.examples, warnings);

    // 验证模式复杂度
    this.validatePatternComplexity(rule.rule.trigger.pattern, warnings);

    // 验证平台兼容性
    this.validatePlatformCompatibility(rule.compatibility.platforms, warnings);
  }

  /**
   * 验证规则ID
   */
  private isValidRuleId(id: string): boolean {
    // ID应该具有描述性，不只是数字
    return !/^\d+$/.test(id) && id.length >= 3;
  }

  /**
   * 验证版本号
   */
  private isValidVersion(version: string): boolean {
    // 简单的语义化版本验证
    const parts = version.split('.');
    return parts.length === 3 && parts.every(part => /^\d+$/.test(part));
  }

  /**
   * 验证时间戳
   */
  private isValidTimestamp(timestamp: string): boolean {
    try {
      const date = new Date(timestamp);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }

  /**
   * 验证代码示例
   */
  private validateExamples(examples: any[], warnings: ValidationWarning[]): void {
    examples.forEach((example, index) => {
      const beforeLines = example.before.split('\n').length;
      const afterLines = example.after.split('\n').length;
      
      if (beforeLines > 15 || afterLines > 15) {
        warnings.push({
          path: `rule.suggestion.examples[${index}]`,
          message: '代码示例建议不超过15行',
          severity: 'low'
        });
      }
      
      if (example.explanation.length < 20) {
        warnings.push({
          path: `rule.suggestion.examples[${index}]`,
          message: '示例解释可以更详细',
          severity: 'medium'
        });
      }
    });
  }

  /**
   * 验证模式复杂度
   */
  private validatePatternComplexity(pattern: string, warnings: ValidationWarning[]): void {
    // 检查模式是否过于复杂
    const complexity = this.calculatePatternComplexity(pattern);
    
    if (complexity > 0.8) {
      warnings.push({
        path: 'rule.trigger.pattern',
        message: '模式可能过于复杂，建议简化',
        severity: 'medium'
      });
    }
    
    if (complexity < 0.2) {
      warnings.push({
        path: 'rule.trigger.pattern',
        message: '模式可能过于简单，可能匹配过多内容',
        severity: 'low'
      });
    }
  }

  /**
   * 计算模式复杂度
   */
  private calculatePatternComplexity(pattern: string): number {
    let score = 0;
    
    // 基于正则表达式特性计算复杂度
    if (pattern.includes('*')) score += 0.2;
    if (pattern.includes('+')) score += 0.2;
    if (pattern.includes('?')) score += 0.1;
    if (pattern.includes('|')) score += 0.3;
    if (pattern.includes('(') && pattern.includes(')')) score += 0.2;
    if (pattern.includes('[') && pattern.includes(']')) score += 0.1;
    
    // 基于长度
    const lengthFactor = Math.min(pattern.length / 100, 1.0);
    score += lengthFactor * 0.3;
    
    return Math.min(score, 1.0);
  }

  /**
   * 验证平台兼容性
   */
  private validatePlatformCompatibility(platforms: string[], warnings: ValidationWarning[]): void {
    const validPlatforms = ['node', 'browser', 'mobile', 'desktop', 'server'];
    const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p));
    
    if (invalidPlatforms.length > 0) {
      warnings.push({
        path: 'compatibility.platforms',
        message: `发现不支持的平台: ${invalidPlatforms.join(', ')}`,
        severity: 'low'
      });
    }
    
    if (platforms.length === 0) {
      warnings.push({
        path: 'compatibility.platforms',
        message: '建议指定适用的平台',
        severity: 'medium'
      });
    }
  }

  /**
   * 解析YAML（模拟实现）
   */
  private parseYAML(yamlString: string): any {
    // 这里应该使用YAML解析库
    // 暂时使用JSON模拟
    try {
      return JSON.parse(yamlString);
    } catch {
      // 如果JSON解析失败，尝试简单的YAML解析
      return this.simpleYAMLParser(yamlString);
    }
  }

  /**
   * 简单的YAML解析器（用于演示）
   */
  private simpleYAMLParser(yamlString: string): any {
    const lines = yamlString.split('\n');
    const result: any = {};
    let currentPath: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const match = trimmed.match(/^(\s*)(\w+):\s*(.+)$/);
      if (match) {
        const indent = match[1].length;
        const key = match[2];
        const value = match[3].trim();
        
        // 简单的缩进处理
        currentPath = currentPath.slice(0, Math.floor(indent / 2));
        currentPath.push(key);
        
        this.setNestedValue(result, currentPath, this.parseValue(value));
      }
    }
    
    return result;
  }

  /**
   * 设置嵌套对象值
   */
  private setNestedValue(obj: any, path: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
  }

  /**
   * 解析YAML值
   */
  private parseValue(value: string): any {
    // 尝试解析为数字
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    
    // 尝试解析为布尔值
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // 尝试解析为数组
    if (value.startsWith('[') && value.endsWith(']')) {
      return value.slice(1, -1).split(',').map(v => this.parseValue(v.trim()));
    }
    
    // 默认返回字符串
    return value.replace(/^['"]|['"]$/g, ''); // 去除引号
  }

  /**
   * 生成验证报告
   */
  generateValidationReport(validationResult: ValidationResult): string {
    const report: string[] = [];
    
    report.push('# RuleForge YAML验证报告');
    report.push(`验证结果: ${validationResult.isValid ? '✅ 通过' : '❌ 失败'}`);
    report.push('');
    
    if (validationResult.errors.length > 0) {
      report.push('## 错误信息');
      validationResult.errors.forEach(error => {
        report.push(`- **${error.path}**: ${error.message} (${error.code})`);
      });
      report.push('');
    }
    
    if (validationResult.warnings.length > 0) {
      report.push('## 警告信息');
      validationResult.warnings.forEach(warning => {
        const severityIcon = warning.severity === 'high' ? '⚠️' : warning.severity === 'medium' ? 'ℹ️' : '💡';
        report.push(`- ${severityIcon} **${warning.path}**: ${warning.message}`);
      });
    }
    
    return report.join('\n');
  }
}

// 导出单例实例
export const yamlValidator = new YAMLValidator();

export default YAMLValidator;