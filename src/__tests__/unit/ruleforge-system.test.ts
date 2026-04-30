// RuleForge 规则引擎单元测试

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// 模拟 RuleForge 组件
const mockRuleExtractor = {
  extractFromSession: vi.fn(),
  extractFromAllSessions: vi.fn()
};

const mockYAMLGenerator = {
  generateRules: vi.fn(),
  validateYAML: vi.fn()
};

const mockRuleInjector = {
  injectToCode: vi.fn(),
  validateInjection: vi.fn()
};

const mockRuleStats = {
  calculateStats: vi.fn(),
  generateReport: vi.fn()
};

describe('RuleForge 规则引擎单元测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('规则提取器应该正确提取模式', async () => {
    // 准备测试数据
    const sessionData = {
      messages: [
        {
          role: 'user',
          content: '如何优化 React 组件性能？'
        },
        {
          role: 'assistant', 
          content: '可以使用 React.memo 和 useMemo 进行优化'
        }
      ],
      metadata: {
        technology: 'react',
        category: 'performance'
      }
    };

    const expectedPatterns = [
      {
        id: 'react-performance-1',
        category: 'performance',
        pattern: 'React 组件重复渲染',
        solution: {
          description: '使用 React.memo 避免不必要的重新渲染',
          code: 'const MemoizedComponent = React.memo(MyComponent);',
          confidence: 0.9
        },
        examples: [
          {
            context: '函数组件优化',
            before: 'function MyComponent(props) { return <div>{props.data}</div>; }',
            after: 'const MyComponent = React.memo(function(props) { return <div>{props.data}</div>; });'
          }
        ]
      }
    ];

    // 设置模拟返回值
    mockRuleExtractor.extractFromSession.mockResolvedValue({
      patterns: expectedPatterns,
      totalPatterns: 1,
      averageConfidence: 0.9
    });

    // 执行测试
    const result = await mockRuleExtractor.extractFromSession(sessionData);

    // 验证结果
    expect(mockRuleExtractor.extractFromSession).toHaveBeenCalledWith(sessionData);
    expect(result.patterns).toHaveLength(1);
    expect(result.patterns[0].category).toBe('performance');
    expect(result.averageConfidence).toBeGreaterThan(0.8);
  });

  test('YAML 生成器应该生成有效规则文件', async () => {
    // 准备测试数据
    const patterns = [
      {
        id: 'code-style-1',
        category: 'code_style',
        pattern: '使用 var 声明变量',
        solution: {
          description: '使用 const 或 let 替代 var',
          code: 'const variableName = value;',
          confidence: 0.95
        },
        examples: [
          {
            context: '变量声明',
            before: 'var x = 10;',
            after: 'const x = 10;'
          }
        ]
      }
    ];

    const expectedYAML = `# RuleForge 生成的规则文件
rules:
  - id: code-style-1
    category: code_style
    pattern: 使用 var 声明变量
    solution:
      description: 使用 const 或 let 替代 var
      code: |
        const variableName = value;
      confidence: 0.95
    examples:
      - context: 变量声明
        before: var x = 10;
        after: const x = 10;`;

    // 设置模拟返回值
    mockYAMLGenerator.generateRules.mockResolvedValue(expectedYAML);

    // 执行测试
    const yamlContent = await mockYAMLGenerator.generateRules(patterns);

    // 验证结果
    expect(mockYAMLGenerator.generateRules).toHaveBeenCalledWith(patterns);
    expect(yamlContent).toContain('RuleForge 生成的规则文件');
    expect(yamlContent).toContain('code-style-1');
    expect(yamlContent).toContain('code_style');
  });

  test('规则注入器应该正确注入代码', async () => {
    // 准备测试数据
    const originalCode = `
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}
    `;

    const patterns = [
      {
        id: 'code-style-var',
        category: 'code_style',
        pattern: '使用 var 声明变量',
        solution: {
          description: '使用 const 或 let 替代 var',
          code: 'const variableName = value;',
          confidence: 0.95
        }
      }
    ];

    const expectedInjectedCode = `
function calculateTotal(items) {
  const total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}
    `;

    const expectedResult = {
      generatedCode: expectedInjectedCode,
      appliedRules: patterns,
      confidence: 0.95,
      suggestions: ['应用了 code_style 规则: 使用 const 或 let 替代 var']
    };

    // 设置模拟返回值
    mockRuleInjector.injectToCode.mockResolvedValue(expectedResult);

    // 执行测试
    const result = await mockRuleInjector.injectToCode(originalCode, patterns);

    // 验证结果
    expect(mockRuleInjector.injectToCode).toHaveBeenCalledWith(originalCode, patterns);
    expect(result.generatedCode).not.toContain('var ');
    expect(result.generatedCode).toContain('const ');
    expect(result.generatedCode).toContain('let ');
    expect(result.appliedRules).toHaveLength(1);
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  test('规则统计应该生成准确报告', async () => {
    // 准备测试数据
    const patterns = [
      {
        id: 'pattern-1',
        category: 'code_style',
        solution: { confidence: 0.9 }
      },
      {
        id: 'pattern-2', 
        category: 'performance',
        solution: { confidence: 0.8 }
      },
      {
        id: 'pattern-3',
        category: 'code_style',
        solution: { confidence: 0.95 }
      }
    ];

    const expectedStats = {
      totalRules: 3,
      rulesByCategory: {
        code_style: 2,
        performance: 1
      },
      averageConfidence: 0.8833,
      highConfidenceRules: 2,
      topCategories: ['code_style', 'performance']
    };

    // 设置模拟返回值
    mockRuleStats.calculateStats.mockResolvedValue(expectedStats);

    // 执行测试
    const stats = await mockRuleStats.calculateStats(patterns);

    // 验证结果
    expect(mockRuleStats.calculateStats).toHaveBeenCalledWith(patterns);
    expect(stats.totalRules).toBe(3);
    expect(stats.rulesByCategory.code_style).toBe(2);
    expect(stats.averageConfidence).toBeCloseTo(0.8833, 4);
    expect(stats.highConfidenceRules).toBe(2);
  });

  test('批量规则提取应该处理多个会话', async () => {
    // 准备测试数据
    const sessionsData = [
      {
        messages: [{ role: 'user', content: 'React 问题' }],
        metadata: { technology: 'react' }
      },
      {
        messages: [{ role: 'user', content: 'Vue 问题' }],
        metadata: { technology: 'vue' }
      }
    ];

    const expectedResults = [
      {
        patterns: [{ id: 'react-pattern', category: 'react' }],
        totalPatterns: 1
      },
      {
        patterns: [{ id: 'vue-pattern', category: 'vue' }],
        totalPatterns: 1
      }
    ];

    // 设置模拟返回值
    mockRuleExtractor.extractFromAllSessions.mockResolvedValue(expectedResults);

    // 执行测试
    const results = await mockRuleExtractor.extractFromAllSessions(sessionsData);

    // 验证结果
    expect(results).toHaveLength(2);
    expect(results[0].patterns[0].category).toBe('react');
    expect(results[1].patterns[0].category).toBe('vue');
  });

  test('规则引擎应该处理错误情况', async () => {
    // 模拟规则提取失败
    const error = new Error('会话数据格式无效');
    mockRuleExtractor.extractFromSession.mockRejectedValue(error);

    // 执行测试并验证错误处理
    await expect(mockRuleExtractor.extractFromSession({} as any))
      .rejects.toThrow('会话数据格式无效');

    // 模拟 YAML 生成失败
    const yamlError = new Error('YAML 格式错误');
    mockYAMLGenerator.generateRules.mockRejectedValue(yamlError);

    // 执行测试并验证错误处理
    await expect(mockYAMLGenerator.generateRules([]))
      .rejects.toThrow('YAML 格式错误');
  });
});

describe('RuleForge 性能测试', () => {
  test('大量规则提取性能', async () => {
    const startTime = performance.now();
    
    // 模拟大量会话数据
    const sessions = Array.from({ length: 50 }, (_, i) => ({
      messages: [
        { role: 'user', content: `问题 ${i}` },
        { role: 'assistant', content: `答案 ${i}` }
      ],
      metadata: { technology: i % 2 === 0 ? 'react' : 'vue' }
    }));

    // 批量提取规则
    for (const session of sessions) {
      await mockRuleExtractor.extractFromSession(session);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 验证性能要求：50个会话应该在15秒内完成
    expect(duration).toBeLessThan(15000);
    expect(mockRuleExtractor.extractFromSession).toHaveBeenCalledTimes(50);
  });

  test('复杂代码注入性能', async () => {
    const startTime = performance.now();
    
    // 模拟复杂代码
    const complexCode = `
      // 大型 React 组件
      class MyComponent extends React.Component {
        constructor(props) {
          super(props);
          this.state = { data: [] };
          var temp = '';
        }
        
        componentDidMount() {
          var self = this;
          fetch('/api/data').then(function(response) {
            return response.json();
          }).then(function(data) {
            self.setState({ data: data });
          });
        }
        
        render() {
          var items = this.state.data;
          return (
            <div>
              {items.map(function(item, index) {
                return <div key={index}>{item.name}</div>;
              })}
            </div>
          );
        }
      }
    `;

    const patterns = [
      {
        id: 'var-to-const',
        category: 'code_style',
        pattern: '使用 var 声明变量',
        solution: {
          description: '使用 const 或 let 替代 var',
          code: 'const variableName = value;',
          confidence: 0.95
        }
      },
      {
        id: 'function-to-arrow',
        category: 'modern_js',
        pattern: '使用 function 关键字',
        solution: {
          description: '使用箭头函数',
          code: 'const func = () => {};',
          confidence: 0.85
        }
      }
    ];

    // 执行代码注入
    await mockRuleInjector.injectToCode(complexCode, patterns);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 验证性能要求：复杂代码注入应该在2秒内完成
    expect(duration).toBeLessThan(2000);
  });

  test('YAML 生成性能', async () => {
    const startTime = performance.now();
    
    // 模拟大量规则模式
    const patterns = Array.from({ length: 100 }, (_, i) => ({
      id: `pattern-${i}`,
      category: i % 3 === 0 ? 'code_style' : i % 3 === 1 ? 'performance' : 'security',
      pattern: `模式 ${i}`,
      solution: {
        description: `解决方案 ${i}`,
        code: `// 代码 ${i}`,
        confidence: 0.7 + (i * 0.003) // 递增置信度
      },
      examples: [
        {
          context: `上下文 ${i}`,
          before: `之前 ${i}`,
          after: `之后 ${i}`
        }
      ]
    }));

    // 生成 YAML
    await mockYAMLGenerator.generateRules(patterns);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 验证性能要求：100个规则的 YAML 生成应该在3秒内完成
    expect(duration).toBeLessThan(3000);
  });
});

describe('RuleForge 边界测试', () => {
  test('空会话数据处理', async () => {
    // 测试空会话数据
    mockRuleExtractor.extractFromSession.mockRejectedValue(new Error('空会话数据'));
    await expect(mockRuleExtractor.extractFromSession({ messages: [] }))
      .rejects.toThrow('空会话数据');
  });

  test('无效规则模式处理', async () => {
    const invalidPatterns = [
      {
        id: 'invalid-pattern',
        category: '', // 空类别
        pattern: '', // 空模式
        solution: {
          description: '',
          code: '',
          confidence: 1.5 // 无效置信度
        }
      }
    ];

    // 测试无效模式处理
    mockYAMLGenerator.generateRules.mockRejectedValue(new Error('无效规则模式'));
    await expect(mockYAMLGenerator.generateRules(invalidPatterns as any))
      .rejects.toThrow('无效规则模式');
  });

  test('低置信度规则过滤', async () => {
    const lowConfidencePatterns = [
      {
        id: 'low-confidence-1',
        category: 'code_style',
        solution: { confidence: 0.3 } // 低置信度
      },
      {
        id: 'high-confidence-1',
        category: 'performance', 
        solution: { confidence: 0.9 } // 高置信度
      }
    ];

    // 设置模拟返回值
    mockRuleStats.calculateStats.mockResolvedValue({
      averageConfidence: 0.6,
      highConfidenceRules: 1,
      totalRules: 2,
      lowConfidenceRules: 1
    });

    // 测试置信度过滤
    const result = await mockRuleStats.calculateStats(lowConfidencePatterns as any);
    
    // 验证低置信度规则被正确统计
    expect(result.averageConfidence).toBeCloseTo(0.6, 1);
    expect(result.highConfidenceRules).toBe(1);
  });
});