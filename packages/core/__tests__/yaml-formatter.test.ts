/**
 * YAML 格式化器单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RuleYamlFormatter, RepRuleSchema } from '../src/formatter/yaml-formatter.js';
import { Pattern, RepRule } from '../src/types/rep-rule.js';

describe('RuleYamlFormatter', () => {
  let formatter: RuleYamlFormatter;
  let samplePattern: Pattern;

  beforeEach(() => {
    formatter = new RuleYamlFormatter();
    
    samplePattern = {
      id: 'vue-props-validation',
      category: 'code_style' as const,
      trigger: {
        keywords: ['props', 'validation', 'required'],
        filePattern: '**/*.vue',
        frequency: 5,
      },
      solution: {
        description: 'Vue 组件 props 验证规则缺失',
        codeExample: {
          before: 'props: [\'title\', \'count\']',
          after: 'props: {\n  title: {\n    type: String,\n    required: true\n  },\n  count: {\n    type: Number,\n    default: 0\n  }\n}',
          language: 'javascript',
        },
      },
      confidence: 0.85,
      applicableScenes: 3,
      evidence: [
        '缺少 props 类型验证',
        '缺少 required 标记',
        '缺少默认值设置',
      ],
      sessions: [
        {
          type: 'error_occurred',
          file: 'src/components/Button.vue',
          content: 'props: [\'title\', \'count\']',
          message: 'Props 缺少类型验证',
          timestamp: '2024-01-01T10:00:00Z',
          codeSnippet: 'props: [\'title\', \'count\']',
        },
        {
          type: 'file_saved',
          file: 'src/components/Button.vue',
          content: 'props: {\n  title: {\n    type: String,\n    required: true\n  },\n  count: {\n    type: Number,\n    default: 0\n  }\n}',
          message: '修复 props 验证',
          timestamp: '2024-01-01T10:05:00Z',
          changes: ['fix'],
          codeSnippet: 'props: {\n  title: {\n    type: String,\n    required: true\n  },\n  count: {\n    type: Number,\n    default: 0\n  }\n}',
        },
      ],
      explanation: 'Vue 组件应该使用对象形式的 props 定义，包含类型验证和默认值',
      language: 'javascript',
    };
  });

  describe('构造函数', () => {
    it('应该使用默认配置', () => {
      const defaultFormatter = new RuleYamlFormatter();
      expect(defaultFormatter).toBeInstanceOf(RuleYamlFormatter);
    });

    it('应该接受自定义配置', () => {
      const customFormatter = new RuleYamlFormatter({
        minConfidence: 0.9,
        enableRedaction: false,
        codeExampleMaxLines: 10,
      });
      expect(customFormatter).toBeInstanceOf(RuleYamlFormatter);
    });
  });

  describe('toYAML 方法', () => {
    it('应该成功生成有效的 YAML', async () => {
      const yaml = await formatter.toYAML(samplePattern);
      
      expect(yaml).toBeDefined();
      expect(typeof yaml).toBe('string');
      expect(yaml.length).toBeGreaterThan(0);
      
      // 验证基本结构
      expect(yaml).toContain('meta:');
      expect(yaml).toContain('rule:');
      expect(yaml).toContain('compatibility:');
      
      // 验证关键字段
      expect(yaml).toContain('id: vue-props-validation');
      expect(yaml).toContain('name: 代码风格: props');
      expect(yaml).toContain('version: 1.0.0');
    });

    it('应该包含正确的触发条件', async () => {
      const yaml = await formatter.toYAML(samplePattern);
      
      expect(yaml).toContain('keywords:');
      expect(yaml).toContain('- props');
      expect(yaml).toContain('- validation');
      expect(yaml).toContain('- required');
      expect(yaml).toContain('file_pattern: \'**/*.vue\'');
      expect(yaml).toContain('language: javascript');
    });

    it('应该包含代码示例', async () => {
      const yaml = await formatter.toYAML(samplePattern);
      
      expect(yaml).toContain('代码示例:');
      expect(yaml).toContain('修复后:');
      expect(yaml).toContain('```javascript');
    });

    it('应该处理没有会话数据的模式', async () => {
      const patternWithoutSessions = { ...samplePattern };
      delete patternWithoutSessions.sessions;
      
      const yaml = await formatter.toYAML(patternWithoutSessions);
      
      expect(yaml).toBeDefined();
      expect(yaml).toContain('suggestion:');
    });

    it('应该验证模式有效性', async () => {
      const invalidPattern = { ...samplePattern };
      invalidPattern.id = ''; // 无效 ID
      
      await expect(formatter.toYAML(invalidPattern)).rejects.toThrow();
    });
  });

  describe('敏感信息脱敏', () => {
    it('应该脱敏 API 密钥', async () => {
      const patternWithSensitiveInfo = {
        ...samplePattern,
        solution: {
          ...samplePattern.solution,
          description: 'API 密钥: sk-abcdefghijklmnopqrstuvwxyz123456',
        },
      };
      
      const yaml = await formatter.toYAML(patternWithSensitiveInfo);
      
      expect(yaml).not.toContain('sk-abcdefghijklmnopqrstuvwxyz123456');
      expect(yaml).toContain('{api_key}');
    });

    it('应该脱敏文件路径', async () => {
      const patternWithPath = {
        ...samplePattern,
        solution: {
          ...samplePattern.solution,
          description: '文件路径: C:\\Users\\john\\project\\src\\main.ts',
        },
      };
      
      const yaml = await formatter.toYAML(patternWithPath);
      
      expect(yaml).not.toContain('C:\\Users\\john\\project\\src\\main.ts');
      expect(yaml).toContain('{user_path}');
    });

    it('可以禁用脱敏功能', async () => {
      const noRedactionFormatter = new RuleYamlFormatter({ enableRedaction: false });
      
      const patternWithSensitiveInfo = {
        ...samplePattern,
        solution: {
          ...samplePattern.solution,
          description: 'API 密钥: sk-test123',
        },
      };
      
      const yaml = await noRedactionFormatter.toYAML(patternWithSensitiveInfo);
      
      expect(yaml).toContain('sk-test123');
      expect(yaml).not.toContain('{api_key}');
    });
  });

  describe('代码示例生成', () => {
    it('应该从会话数据生成代码示例', async () => {
      const yaml = await formatter.toYAML(samplePattern);
      
      expect(yaml).toContain('props: [\'title\', \'count\']');
      expect(yaml).toContain('props: {');
      expect(yaml).toContain('type: String');
      expect(yaml).toContain('required: true');
    });

    it('应该截断过长的代码示例', async () => {
      const longCodeFormatter = new RuleYamlFormatter({ codeExampleMaxLines: 2 });
      
      const patternWithLongCode = {
        ...samplePattern,
        sessions: [
          {
            type: 'error_occurred',
            file: 'test.js',
            codeSnippet: 'line1\nline2\nline3\nline4\nline5',
            timestamp: '2024-01-01T10:00:00Z',
          },
        ],
      };
      
      const yaml = await longCodeFormatter.toYAML(patternWithLongCode);
      
      expect(yaml).toContain('line1');
      expect(yaml).toContain('line2');
      expect(yaml).not.toContain('line3');
      expect(yaml).toContain('(truncated)');
    });
  });

  describe('YAML 格式化', () => {
    it('应该生成有效的 YAML 语法', async () => {
      const yaml = await formatter.toYAML(samplePattern);
      
      // 验证 YAML 基本结构
      const lines = yaml.split('\n');
      expect(lines[0]).toMatch(/^meta:$/);
      
      // 验证缩进
      const metaLines = lines.filter(line => line.startsWith('  '));
      expect(metaLines.length).toBeGreaterThan(0);
      
      // 验证数组格式
      expect(yaml).toMatch(/- props/);
      expect(yaml).toMatch(/- validation/);
      expect(yaml).toMatch(/- required/);
    });

    it('应该正确转义特殊字符', async () => {
      const patternWithSpecialChars = {
        ...samplePattern,
        solution: {
          ...samplePattern.solution,
          description: '包含特殊字符: : # " \' [] {}',
        },
      };
      
      const yaml = await formatter.toYAML(patternWithSpecialChars);
      
      // 特殊字符应该被正确转义
      expect(yaml).toContain('description: "包含特殊字符: : # \" \' [] {}"');
    });
  });

  describe('错误处理', () => {
    it('应该拒绝置信度过低的模式', async () => {
      const lowConfidenceFormatter = new RuleYamlFormatter({ minConfidence: 0.9 });
      const lowConfidencePattern = { ...samplePattern, confidence: 0.6 };
      
      await expect(lowConfidenceFormatter.toYAML(lowConfidencePattern)).rejects.toThrow();
    });

    it('应该处理空关键词数组', async () => {
      const invalidPattern = { ...samplePattern, trigger: { ...samplePattern.trigger, keywords: [] } };
      
      await expect(formatter.toYAML(invalidPattern)).rejects.toThrow();
    });

    it('应该处理空文件模式', async () => {
      const invalidPattern = { ...samplePattern, trigger: { ...samplePattern.trigger, filePattern: '' } };
      
      await expect(formatter.toYAML(invalidPattern)).rejects.toThrow();
    });
  });

  describe('自定义验证器', () => {
    it('应该支持自定义验证逻辑', async () => {
      const customValidator = (pattern: Pattern) => ({
        success: pattern.id.startsWith('custom-'),
        errors: pattern.id.startsWith('custom-') ? [] : ['ID 必须以 custom- 开头'],
        warnings: [],
      });
      
      const customFormatter = new RuleYamlFormatter({
        customValidators: [customValidator],
      });
      
      const validPattern = { ...samplePattern, id: 'custom-test' };
      const invalidPattern = { ...samplePattern, id: 'invalid-test' };
      
      await expect(customFormatter.toYAML(validPattern)).resolves.toBeDefined();
      await expect(customFormatter.toYAML(invalidPattern)).rejects.toThrow();
    });
  });

  describe('REP v0.1 Schema 验证', () => {
    it('应该验证有效的 REP 规则', async () => {
      const validRule: RepRule = {
        meta: {
          id: 'vue-props-validation',
          name: 'Vue Props Validation',
          version: '1.0.0',
          description: 'Always use TypeScript interface for props',
          authors: ['developer@example.com'],
          license: 'MIT',
        },
        rule: {
          trigger: {
            keywords: ['defineProps', 'props'],
            file_pattern: '**/*.vue',
            language: 'typescript',
          },
          condition: 'Props should use TypeScript interface',
          suggestion: 'Use interface Props { title: string }',
        },
        compatibility: {
          frameworks: { vue: '>=3.4' },
          languages: { typescript: '>=5.0' },
          rep_version: '1.0',
        },
      };
      
      const result = RepRuleSchema.safeParse(validRule);
      expect(result.success).toBe(true);
    });

    it('应该拒绝无效的 REP 规则', async () => {
      const invalidRule = {
        meta: {
          id: '', // 错误：空字符串
          name: 'Test',
          version: 'invalid', // 错误：非语义版本
          description: 'Too short', // 错误：少于10字符
          authors: [], // 错误：空数组
          license: 'MIT',
        },
        rule: {
          trigger: {
            keywords: [],
            file_pattern: '',
            language: '',
          },
          condition: '',
          suggestion: '',
        },
        compatibility: {
          frameworks: {},
          languages: {},
          rep_version: '',
        },
      };
      
      const result = RepRuleSchema.safeParse(invalidRule);
      expect(result.success).toBe(false);
      expect(result.error?.errors.length).toBeGreaterThan(0);
    });
  });

  describe('私有方法测试', () => {
    it('应该脱敏敏感信息', async () => {
      const code = `
        const apiKey = 'sk-1234567890abcdefghijklmnop';
        const userPath = '/Users/john/project/src/index.ts';
        const email = 'developer@example.com';
      `;
      
      // 使用类型断言访问私有方法
      const redacted = (formatter as any).redactSensitiveInfo(code);
      
      expect(redacted).toContain('{api_key}');
      expect(redacted).toContain('{user_path}');
      expect(redacted).toContain('{email}');
    });

    it('应该生成代码示例', async () => {
      const pattern = {
        ...samplePattern,
        sessions: [
          {
            type: 'error_occurred' as const,
            message: 'Props type error',
            codeSnippet: `const props = defineProps({ title: String })`,
            timestamp: new Date().toISOString(),
          },
          {
            type: 'file_saved' as const,
            file: 'src/components/Button.vue',
            changes: ['Fixed props type'],
            codeSnippet: `interface Props { title: string }
const props = defineProps<Props>()`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      
      const example = (formatter as any).generateCodeExample(pattern);
      expect(example.before).toContain('defineProps');
      expect(example.after).toContain('interface Props');
    });

    it('应该正确格式化 YAML', async () => {
      const obj = {
        meta: {
          id: 'test-rule',
          name: 'Test Rule',
          tags: ['vue', 'typescript'],
        },
      };
      
      const yaml = (formatter as any).formatYAML(obj);
      expect(yaml).toContain('meta:');
      expect(yaml).toContain('id: test-rule');
      expect(yaml).toContain('- vue');
      expect(yaml).toContain('- typescript');
    });
  });

  describe('完整模式转换', () => {
    it('应该将模式转换为完整的 YAML', async () => {
      const pattern = {
        id: 'vue-props-validation-complete',
        category: 'code_style' as const,
        trigger: {
          keywords: ['props', 'validation', 'interface'],
          filePattern: '**/*.vue',
          frequency: 5,
        },
        solution: {
          description: '使用 TypeScript interface 定义 props，提高类型安全性',
        },
        confidence: 0.9,
        applicableScenes: 5,
        evidence: ['类型安全', '代码可读性'],
        explanation: 'Vue 3 推荐使用 TypeScript interface 定义 props',
        language: 'typescript',
      };
      
      const yaml = await formatter.toYAML(pattern);
      expect(yaml).toContain('meta:');
      expect(yaml).toContain('rule:');
      expect(yaml).toContain('compatibility:');
      expect(yaml).toContain('rep_version:');
    });
  });
});