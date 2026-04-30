import { describe, it, expect } from 'vitest';
import { YAMLGenerator } from '../src/yaml-generator';
import { RuleCandidate } from '../src/types';

// 模拟规则候选数据
const mockRuleCandidates: RuleCandidate[] = [
  {
    id: 'rule-1',
    name: '登录功能规则',
    description: '当用户提到"登录"时，自动应用登录功能模板',
    pattern: '登录',
    confidence: 0.85,
    frequency: 3,
    type: 'keyword',
    metadata: {
      keyword: '登录',
      avgFrequency: 0.75
    },
    trigger: {
      type: 'keyword_match',
      keywords: ['登录']
    },
    condition: {
      type: 'frequency_threshold',
      threshold: 2
    },
    suggestion: {
      type: 'template_suggestion',
      template: '登录功能代码模板'
    }
  },
  {
    id: 'rule-2',
    name: 'TypeScript文件生成规则',
    description: '生成TypeScript文件的标准模板',
    pattern: '生成TypeScript文件',
    confidence: 0.78,
    frequency: 4,
    type: 'file_type',
    metadata: {
      fileType: 'TypeScript',
      exampleFiles: ['src/components/LoginForm.tsx', 'src/api/auth.ts']
    },
    trigger: {
      type: 'file_type_match',
      fileTypes: ['TypeScript']
    },
    condition: {
      type: 'project_structure',
      requiredFiles: ['src/components/', 'src/api/']
    },
    suggestion: {
      type: 'file_template',
      template: 'TypeScript文件模板'
    }
  },
  {
    id: 'rule-3',
    name: '语法错误处理规则',
    description: '处理语法错误的自动修复方案',
    pattern: '语法错误',
    confidence: 0.92,
    frequency: 2,
    type: 'error',
    metadata: {
      errorType: '语法错误',
      solutions: ['检查括号匹配', '验证分号使用']
    },
    trigger: {
      type: 'error_match',
      errorTypes: ['语法错误']
    },
    condition: {
      type: 'error_context',
      context: '代码语法错误'
    },
    suggestion: {
      type: 'error_fix',
      solutions: ['检查括号匹配', '验证分号使用']
    }
  }
];

describe('YAMLGenerator', () => {
  let generator: YAMLGenerator;

  beforeEach(() => {
    generator = new YAMLGenerator();
  });

  describe('基础功能', () => {
    it('应该正确初始化', () => {
      expect(generator).toBeDefined();
      const config = generator.getConfig();
      expect(config.autoSanitize).toBe(true);
      expect(config.includeExamples).toBe(true);
    });

    it('应该能够更新配置', () => {
      generator.updateConfig({
        autoSanitize: false,
        maxExampleLines: 10
      });
      
      const config = generator.getConfig();
      expect(config.autoSanitize).toBe(false);
      expect(config.maxExampleLines).toBe(10);
    });
  });

  describe('单个规则生成', () => {
    it('应该生成有效的YAML内容', () => {
      const candidate = mockRuleCandidates[0];
      const yamlContent = generator.generateRuleYAML(candidate);
      
      expect(yamlContent).toBeDefined();
      expect(yamlContent).toContain('meta:');
      expect(yamlContent).toContain('rule:');
      expect(yamlContent).toContain('compatibility:');
      expect(yamlContent).toContain('登录功能规则');
    });

    it('应该包含REP v0.1标准字段', () => {
      const candidate = mockRuleCandidates[0];
      const yamlContent = generator.generateRuleYAML(candidate);
      
      expect(yamlContent).toContain('id: rule-1');
      expect(yamlContent).toContain('version: 1.0.0');
      expect(yamlContent).toContain('author: RuleForge Auto-Generated');
      expect(yamlContent).toContain('trigger:');
      expect(yamlContent).toContain('condition:');
      expect(yamlContent).toContain('suggestion:');
    });

    it('应该生成文件头注释', () => {
      const candidate = mockRuleCandidates[0];
      const yamlContent = generator.generateRuleYAML(candidate);
      
      expect(yamlContent).toContain('# RuleForge 自动生成的规则文件');
      expect(yamlContent).toContain('# 符合 REP v0.1 标准');
      expect(yamlContent).toContain('# 生成时间:');
    });

    it('应该根据配置包含代码示例', () => {
      const candidate = mockRuleCandidates[0];
      const yamlContent = generator.generateRuleYAML(candidate);
      
      expect(yamlContent).toContain('code:');
      expect(yamlContent).toContain('// 登录功能示例');
    });

    it('应该能够禁用代码示例', () => {
      generator.updateConfig({ includeExamples: false });
      const candidate = mockRuleCandidates[0];
      const yamlContent = generator.generateRuleYAML(candidate);
      
      expect(yamlContent).not.toContain('code:');
    });
  });

  describe('批量规则生成', () => {
    it('应该生成多个规则文件', () => {
      const results = generator.generateRulesYAML(mockRuleCandidates);
      
      expect(Object.keys(results)).toHaveLength(3);
      expect(results['登录功能规则.rule.yaml']).toBeDefined();
      expect(results['typescript文件生成规则.rule.yaml']).toBeDefined();
      expect(results['语法错误处理规则.rule.yaml']).toBeDefined();
    });

    it('应该根据置信度过滤规则', () => {
      const lowConfidenceCandidate: RuleCandidate = {
        ...mockRuleCandidates[0],
        confidence: 0.5
      };
      
      const candidates = [...mockRuleCandidates, lowConfidenceCandidate];
      const results = generator.generateRulesYAML(candidates);
      
      // 低置信度规则应该被过滤掉
      expect(Object.keys(results)).toHaveLength(3);
    });
  });

  describe('代码清理功能', () => {
    it('应该清理敏感信息', () => {
      generator.updateConfig({ autoSanitize: true });
      
      const candidateWithSensitiveInfo: RuleCandidate = {
        ...mockRuleCandidates[0],
        metadata: {
          ...mockRuleCandidates[0].metadata,
          exampleCode: `const apiKey = 'secret-key-123';
const password = 'mypassword';
const token = 'bearer-token';
fetch('http://localhost:3000/api');`
        }
      };
      
      const yamlContent = generator.generateRuleYAML(candidateWithSensitiveInfo);
      
      expect(yamlContent).not.toContain('secret-key-123');
      expect(yamlContent).not.toContain('mypassword');
      expect(yamlContent).not.toContain('bearer-token');
      expect(yamlContent).toContain('YOUR_API_KEY');
      expect(yamlContent).toContain('YOUR_PASSWORD');
      expect(yamlContent).toContain('YOUR_TOKEN');
      expect(yamlContent).toContain('{project_name}');
    });

    it('应该限制代码行数', () => {
      generator.updateConfig({ maxExampleLines: 5 });
      
      const candidateWithLongCode: RuleCandidate = {
        ...mockRuleCandidates[0],
        metadata: {
          ...mockRuleCandidates[0].metadata,
          exampleCode: 'line1\nline2\nline3\nline4\nline5\nline6\nline7'
        }
      };
      
      const yamlContent = generator.generateRuleYAML(candidateWithLongCode);
      
      expect(yamlContent).toContain('line5');
      expect(yamlContent).not.toContain('line6');
      expect(yamlContent).toContain('// ...');
    });
  });

  describe('Schema验证', () => {
    it('应该验证REP Schema', () => {
      const invalidCandidate: RuleCandidate = {
        id: '',
        name: '',
        description: '',
        pattern: '',
        confidence: 0,
        frequency: 0,
        type: 'keyword',
        metadata: {}
      };
      
      expect(() => {
        generator.generateRuleYAML(invalidCandidate);
      }).toThrow('REP Schema 验证失败');
    });

    it('应该能够禁用Schema验证', () => {
      generator.updateConfig({ validateSchema: false });
      
      const invalidCandidate: RuleCandidate = {
        id: '',
        name: '',
        description: '',
        pattern: '',
        confidence: 0,
        frequency: 0,
        type: 'keyword',
        metadata: {}
      };
      
      expect(() => {
        generator.generateRuleYAML(invalidCandidate);
      }).not.toThrow();
    });
  });

  describe('文件名生成', () => {
    it('应该生成安全的文件名', () => {
      const candidate = mockRuleCandidates[0];
      const yamlFiles = generator.generateRulesYAML([candidate]);
      const filename = Object.keys(yamlFiles)[0];
      
      expect(filename).toBe('登录功能规则.rule.yaml');
      expect(filename).toMatch(/^[a-z0-9\-\u4e00-\u9fa5]+\.rule\.yaml$/);
    });

    it('应该处理特殊字符', () => {
      const candidateWithSpecialChars: RuleCandidate = {
        ...mockRuleCandidates[0],
        name: 'Test/Rule:Name*With?Special<Chars>'
      };
      
      const yamlFiles = generator.generateRulesYAML([candidateWithSpecialChars]);
      const filename = Object.keys(yamlFiles)[0];
      
      expect(filename).toBe('test-rule-name-with-special-chars.rule.yaml');
    });
  });

  describe('兼容性检测', () => {
    it('应该检测支持的语言', () => {
      const candidate = mockRuleCandidates[0];
      const yamlContent = generator.generateRuleYAML(candidate);
      
      expect(yamlContent).toContain('languages:');
      expect(yamlContent).toContain('- typescript');
      expect(yamlContent).toContain('- javascript');
    });

    it('应该检测支持的框架', () => {
      const candidateWithReact: RuleCandidate = {
        ...mockRuleCandidates[0],
        metadata: {
          ...mockRuleCandidates[0].metadata,
          contexts: ['React component', 'useState hook']
        }
      };
      
      const yamlContent = generator.generateRuleYAML(candidateWithReact);
      
      expect(yamlContent).toContain('frameworks:');
      expect(yamlContent).toContain('- react');
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的YAML生成', () => {
      const invalidCandidate: RuleCandidate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        pattern: 'test',
        confidence: 0.8,
        frequency: 1,
        type: 'keyword',
        metadata: {},
        trigger: {
          type: 'keyword_match' as any,
          keywords: ['test']
        }
      };
      
      expect(() => {
        generator.generateRuleYAML(invalidCandidate);
      }).not.toThrow();
    });
  });
});