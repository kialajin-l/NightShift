/**
 * RuleForge YAML 格式化器
 * 将 Pattern 转换为符合 REP v0.1 标准的 YAML 格式
 */

import { RepRuleSchema, RepRule, Pattern, RuleForgeConfig, ValidationResult, CodeExample } from '../types/rep-rule.js';

/**
 * RuleForge YAML 格式化器
 */
export class RuleYamlFormatter {
  private readonly config: Required<RuleForgeConfig>;

  /**
   * 构造函数
   * @param config - 格式化器配置
   */
  constructor(config: RuleForgeConfig = {}) {
    this.config = {
      minConfidence: config.minConfidence ?? 0.7,
      enableRedaction: config.enableRedaction ?? true,
      codeExampleMaxLines: config.codeExampleMaxLines ?? 15,
      includeTimestamps: config.includeTimestamps ?? false,
      customValidators: config.customValidators ?? [],
    };
  }

  /**
   * 将 Pattern 转换为 YAML 字符串
   * @param pattern - 要转换的模式
   * @returns 符合 REP v0.1 标准的 YAML 字符串
   */
  async toYAML(pattern: Pattern): Promise<string> {
    // 验证模式
    const validationResult = this.validatePattern(pattern);
    if (!validationResult.success) {
      throw new Error(`模式验证失败: ${validationResult.errors.join(', ')}`);
    }

    // 生成 REP v0.1 规则对象
    const repRule = this.patternToRepRule(pattern);
    
    // 验证 REP v0.1 规则
    const repValidation = RepRuleSchema.safeParse(repRule);
    if (!repValidation.success) {
      const errors = repValidation.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      throw new Error(`REP v0.1 验证失败: ${errors.join(', ')}`);
    }

    // 格式化 YAML
    return this.formatYAML(repRule);
  }

  /**
   * 验证模式是否符合转换要求
   * @param pattern - 要验证的模式
   * @returns 验证结果
   */
  private validatePattern(pattern: Pattern): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基本验证
    if (!pattern.id) {
      errors.push('模式 ID 不能为空');
    }

    if (!pattern.trigger.keywords || pattern.trigger.keywords.length === 0) {
      errors.push('触发关键词不能为空');
    }

    if (!pattern.trigger.filePattern) {
      errors.push('文件匹配模式不能为空');
    }

    if (!pattern.solution.description) {
      errors.push('解决方案描述不能为空');
    }

    if (pattern.confidence < this.config.minConfidence) {
      warnings.push(`置信度 ${pattern.confidence} 低于阈值 ${this.config.minConfidence}`);
    }

    // 运行自定义验证器
    for (const validator of this.config.customValidators) {
      const result = validator(pattern);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 将 Pattern 转换为 REP v0.1 规则
   * @param pattern - 要转换的模式
   * @returns REP v0.1 规则对象
   */
  private patternToRepRule(pattern: Pattern): RepRule {
    // 生成代码示例
    const codeExample = this.generateCodeExample(pattern);
    
    // 构建建议文本
    let suggestion = pattern.solution.description;
    if (codeExample) {
      suggestion += `\n\n代码示例:\n\`\`\`${codeExample.language}\n${codeExample.before}\n\`\`\`\n\n修复后:\n\`\`\`${codeExample.language}\n${codeExample.after}\n\`\`\``;
    }

    // 脱敏处理
    if (this.config.enableRedaction) {
      suggestion = this.redactSensitiveInfo(suggestion);
    }

    return {
      meta: {
        id: pattern.id,
        name: this.generateRuleName(pattern),
        version: '1.0.0',
        description: pattern.solution.description,
        authors: ['RuleForge Auto-Generated'],
        license: 'MIT',
        tags: [pattern.category],
        created_at: this.config.includeTimestamps ? new Date().toISOString() : undefined,
      },
      rule: {
        trigger: {
          keywords: pattern.trigger.keywords,
          file_pattern: pattern.trigger.filePattern,
          language: pattern.language || 'typescript',
        },
        condition: this.generateCondition(pattern),
        suggestion,
      },
      compatibility: {
        frameworks: this.generateFrameworkCompatibility(pattern),
        languages: {
          [pattern.language || 'typescript']: '>=1.0.0',
        },
        rep_version: '0.1',
      },
    };
  }

  /**
   * 生成规则名称
   * @param pattern - 模式
   * @returns 人类可读的规则名称
   */
  private generateRuleName(pattern: Pattern): string {
    const categoryMap = {
      'code_style': '代码风格',
      'error_fix': '错误修复',
      'test_pattern': '测试模式',
      'api_design': 'API 设计',
    };

    const categoryName = categoryMap[pattern.category] || pattern.category;
    const mainKeyword = pattern.trigger.keywords[0] || '规则';
    
    return `${categoryName}: ${mainKeyword}`;
  }

  /**
   * 生成检查条件
   * @param pattern - 模式
   * @returns 自然语言检查条件
   */
  private generateCondition(pattern: Pattern): string {
    const conditions: string[] = [];

    if (pattern.trigger.keywords.length > 0) {
      conditions.push(`代码中包含关键词: ${pattern.trigger.keywords.join(', ')}`);
    }

    if (pattern.trigger.filePattern) {
      conditions.push(`文件路径匹配: ${pattern.trigger.filePattern}`);
    }

    if (pattern.evidence.length > 0) {
      conditions.push(`存在以下问题: ${pattern.evidence.slice(0, 3).join(', ')}`);
    }

    return conditions.join('; ');
  }

  /**
   * 生成框架兼容性信息
   * @param pattern - 模式
   * @returns 框架版本约束
   */
  private generateFrameworkCompatibility(pattern: Pattern): Record<string, string> {
    const frameworks: Record<string, string> = {};

    // 根据模式类别推断框架兼容性
    if (pattern.trigger.filePattern.includes('.vue')) {
      frameworks.vue = '>=3.0.0';
    }

    if (pattern.trigger.filePattern.includes('fastapi')) {
      frameworks.fastapi = '>=0.100.0';
    }

    if (pattern.trigger.filePattern.includes('test') || pattern.category === 'test_pattern') {
      frameworks.vitest = '>=1.0.0';
      frameworks.jest = '>=29.0.0';
    }

    return frameworks;
  }

  /**
   * 敏感信息脱敏
   * @param content - 原始内容
   * @returns 脱敏后的内容
   */
  private redactSensitiveInfo(content: string): string {
    const redactionRules = [
      // API Keys
      { pattern: /sk-[a-zA-Z0-9]{20,}/g, replacement: '{api_key}' },
      { pattern: /ghp_[a-zA-Z0-9]{36}/g, replacement: '{github_token}' },
      // 文件路径
      { pattern: /\/Users\/[a-zA-Z0-9]+\/[^\s"]+/g, replacement: '{user_path}' },
      { pattern: /C:\\Users\\[a-zA-Z0-9]+\\[^\s"]+/g, replacement: '{user_path}' },
      // 密码/密钥
      { pattern: /password[\"\s:]+[^\s"]+/gi, replacement: 'password: "{password}"' },
      // 邮箱
      { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '{email}' },
      // IP 地址
      { pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, replacement: '{ip_address}' },
      // 数据库连接字符串
      { pattern: /(postgresql|mysql|mongodb):\/\/[^\s"]+/g, replacement: '{database_url}' },
    ];

    let redacted = content;
    for (const rule of redactionRules) {
      redacted = redacted.replace(rule.pattern, rule.replacement);
    }

    return redacted;
  }

  /**
   * 生成代码示例
   * @param pattern - 模式
   * @returns 代码示例对象
   */
  private generateCodeExample(pattern: Pattern): CodeExample | null {
    if (!pattern.sessions || pattern.sessions.length === 0) {
      return null;
    }

    const beforeCode = this.extractBeforeCode(pattern);
    const afterCode = this.extractAfterCode(pattern);

    if (!beforeCode && !afterCode) {
      return null;
    }

    return {
      before: beforeCode || '// 问题代码示例',
      after: afterCode || '// 修复后代码示例',
      explanation: pattern.explanation || pattern.solution.description,
      language: pattern.language || 'typescript',
    };
  }

  /**
   * 提取问题代码
   * @param pattern - 模式
   * @returns 问题代码片段
   */
  private extractBeforeCode(pattern: Pattern): string {
    if (!pattern.sessions) return '';

    const problematicCode = pattern.sessions
      .filter(s => s.type === 'error_occurred' && s.codeSnippet)
      .map(s => s.codeSnippet!)
      .join('\n');

    return this.truncateCode(problematicCode, this.config.codeExampleMaxLines);
  }

  /**
   * 提取修复代码
   * @param pattern - 模式
   * @returns 修复代码片段
   */
  private extractAfterCode(pattern: Pattern): string {
    if (!pattern.sessions) return '';

    const fixedCode = pattern.sessions
      .filter(s => s.type === 'file_saved' && s.changes?.includes('fix') && s.codeSnippet)
      .map(s => s.codeSnippet!)
      .join('\n');

    return this.truncateCode(fixedCode, this.config.codeExampleMaxLines);
  }

  /**
   * 截断代码
   * @param code - 原始代码
   * @param maxLines - 最大行数
   * @returns 截断后的代码
   */
  private truncateCode(code: string, maxLines: number): string {
    if (!code) return '';

    const lines = code.split('\n');
    if (lines.length <= maxLines) return code;

    return lines.slice(0, maxLines).join('\n') + '\n// ... (truncated)';
  }

  /**
   * 格式化 YAML
   * @param obj - 要格式化的对象
   * @param indent - 缩进级别
   * @returns 格式化的 YAML 字符串
   */
  private formatYAML(obj: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    const lines: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        lines.push(`${spaces}${key}:`);
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            lines.push(`${spaces}  -`);
            lines.push(this.formatYAML(item, indent + 2));
          } else {
            lines.push(`${spaces}  - ${this.escapeYAML(item)}`);
          }
        }
      } else if (typeof value === 'object') {
        lines.push(`${spaces}${key}:`);
        lines.push(this.formatYAML(value, indent + 1));
      } else {
        lines.push(`${spaces}${key}: ${this.escapeYAML(value)}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 转义 YAML 值
   * @param value - 要转义的值
   * @returns 转义后的字符串
   */
  private escapeYAML(value: any): string {
    if (typeof value !== 'string') return String(value);

    // 需要引号的情况
    const needsQuotes = [
      value.includes(':'),
      value.includes('#'),
      value.includes('"'),
      value.includes('\''),
      value.includes('['),
      value.includes(']'),
      value.includes('{'),
      value.includes('}'),
      value.includes('*'),
      value.includes('&'),
      value.includes('!'),
      value.includes('|'),
      value.includes('>'),
      value.includes('<'),
      value.includes('`'),
      value.trim() !== value,
      value.includes('\n'),
      value === 'true',
      value === 'false',
      value === 'null',
      value === 'yes',
      value === 'no',
      value === 'on',
      value === 'off',
      /^\d+$/.test(value),
      /^[-+]?\d*\.?\d+$/.test(value),
    ].some(Boolean);

    if (needsQuotes) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }

    return value;
  }
}