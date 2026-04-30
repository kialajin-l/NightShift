// NightShift RuleForge 集成服务

/**
 * RuleForge 集成配置
 */
export interface RuleForgeIntegrationConfig {
  enablePatternRecognition: boolean;
  enableYAMLGeneration: boolean;
  minConfidence: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 规则模式
 */
export interface RulePattern {
  id: string;
  category: string;
  pattern: string;
  solution: {
    description: string;
    code: string;
    confidence: number;
  };
  examples: Array<{
    context: string;
    before: string;
    after: string;
  }>;
}

/**
 * 提取结果
 */
export interface ExtractionResult {
  patterns: RulePattern[];
  totalPatterns: number;
  averageConfidence: number;
  highConfidencePatterns: number;
}

/**
 * RuleForge 集成服务
 */
export class RuleForgeIntegration {
  private config: RuleForgeIntegrationConfig;
  private isInitialized: boolean = false;
  
  constructor(config?: Partial<RuleForgeIntegrationConfig>) {
    this.config = {
      enablePatternRecognition: true,
      enableYAMLGeneration: true,
      minConfidence: 0.7,
      logLevel: 'info',
      ...config
    };
  }

  /**
   * 初始化 RuleForge 集成
   */
  async initialize(): Promise<void> {
    try {
      this.log('info', '初始化 RuleForge 集成服务...');
      
      // 在实际实现中，这里会加载 RuleForge 包
      // 由于包结构问题，这里使用模拟实现
      
      this.isInitialized = true;
      this.log('info', 'RuleForge 集成服务初始化完成');
      
    } catch (error) {
      this.log('error', `RuleForge 集成初始化失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 从会话中提取规则模式
   */
  async extractRulesFromSession(sessionData: any): Promise<ExtractionResult> {
    if (!this.isInitialized) {
      throw new Error('RuleForge 集成服务未初始化');
    }
    
    try {
      this.log('info', '开始从会话中提取规则模式...');
      
      // 模拟规则提取过程
      const patterns = await this.simulateRuleExtraction(sessionData);
      
      // 过滤低置信度模式
      const filteredPatterns = patterns.filter(p => p.solution.confidence >= this.config.minConfidence);
      
      const result: ExtractionResult = {
        patterns: filteredPatterns,
        totalPatterns: filteredPatterns.length,
        averageConfidence: filteredPatterns.length > 0 ? 
          filteredPatterns.reduce((sum, p) => sum + p.solution.confidence, 0) / filteredPatterns.length : 0,
        highConfidencePatterns: filteredPatterns.filter(p => p.solution.confidence >= 0.8).length
      };
      
      this.log('info', `规则提取完成: ${result.totalPatterns} 个模式，平均置信度 ${(result.averageConfidence * 100).toFixed(1)}%`);
      
      return result;
    } catch (error) {
      this.log('error', `规则提取失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 批量提取所有会话的规则
   */
  async extractRulesFromAllSessions(sessionsData: any[]): Promise<ExtractionResult[]> {
    if (!this.isInitialized) {
      throw new Error('RuleForge 集成服务未初始化');
    }
    
    try {
      this.log('info', `开始批量提取 ${sessionsData.length} 个会话的规则...`);
      
      const results: ExtractionResult[] = [];
      
      for (const sessionData of sessionsData) {
        try {
          const result = await this.extractRulesFromSession(sessionData);
          results.push(result);
        } catch (error) {
          this.log('warn', `会话规则提取失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      this.log('info', `批量规则提取完成: ${results.length} 个会话处理完成`);
      
      return results;
    } catch (error) {
      this.log('error', `批量规则提取失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 生成 YAML 规则文件
   */
  async generateYAMLRules(patterns: RulePattern[]): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('RuleForge 集成服务未初始化');
    }
    
    try {
      this.log('info', `开始生成 YAML 规则文件: ${patterns.length} 个模式`);
      
      // 生成 YAML 格式的规则
      const yamlContent = this.generateYAMLContent(patterns);
      
      this.log('info', 'YAML 规则文件生成完成');
      
      return yamlContent;
    } catch (error) {
      this.log('error', `YAML 规则生成失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 注入规则到代码
   */
  async injectRulesToCode(code: string, patterns: RulePattern[]): Promise<{
    generatedCode: string;
    appliedRules: RulePattern[];
    confidence: number;
    suggestions: string[];
  }> {
    if (!this.isInitialized) {
      throw new Error('RuleForge 集成服务未初始化');
    }
    
    try {
      this.log('info', '开始规则注入到代码...');
      
      // 模拟规则注入过程
      const result = await this.simulateRuleInjection(code, patterns);
      
      this.log('info', `规则注入完成: 应用了 ${result.appliedRules.length} 个规则`);
      
      return result;
    } catch (error) {
      this.log('error', `规则注入失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 获取规则统计信息
   */
  async getRuleStats(patterns: RulePattern[]): Promise<{
    totalRules: number;
    rulesByCategory: Record<string, number>;
    averageConfidence: number;
    highConfidenceRules: number;
    topCategories: string[];
  }> {
    if (!this.isInitialized) {
      throw new Error('RuleForge 集成服务未初始化');
    }
    
    try {
      this.log('info', '生成规则统计信息...');
      
      const rulesByCategory: Record<string, number> = {};
      
      patterns.forEach(pattern => {
        rulesByCategory[pattern.category] = (rulesByCategory[pattern.category] || 0) + 1;
      });
      
      const averageConfidence = patterns.length > 0 ? 
        patterns.reduce((sum, p) => sum + p.solution.confidence, 0) / patterns.length : 0;
      
      const highConfidenceRules = patterns.filter(p => p.solution.confidence >= 0.8).length;
      
      const topCategories = Object.entries(rulesByCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category]) => category);
      
      const stats = {
        totalRules: patterns.length,
        rulesByCategory,
        averageConfidence,
        highConfidenceRules,
        topCategories
      };
      
      this.log('info', '规则统计信息生成完成');
      
      return stats;
    } catch (error) {
      this.log('error', `规则统计生成失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 模拟规则提取
   */
  private async simulateRuleExtraction(sessionData: any): Promise<RulePattern[]> {
    // 模拟提取过程 - 在实际实现中会使用真正的 RuleForge 引擎
    const patterns: RulePattern[] = [
      {
        id: 'pattern-1',
        category: 'code_style',
        pattern: '使用 var 声明变量',
        solution: {
          description: '使用 const 或 let 替代 var',
          code: '// 使用 const 或 let\nconst variableName = value;',
          confidence: 0.9
        },
        examples: [
          {
            context: '变量声明',
            before: 'var x = 10;',
            after: 'const x = 10;'
          }
        ]
      },
      {
        id: 'pattern-2',
        category: 'error_handling',
        pattern: '缺少错误处理',
        solution: {
          description: '添加 try-catch 错误处理',
          code: 'try {\n  // 业务逻辑\n} catch (error) {\n  // 错误处理\n}',
          confidence: 0.8
        },
        examples: [
          {
            context: '异步操作',
            before: 'fetch(url);',
            after: 'try {\n  await fetch(url);\n} catch (error) {\n  console.error(error);\n}'
          }
        ]
      },
      {
        id: 'pattern-3',
        category: 'performance',
        pattern: '重复计算',
        solution: {
          description: '使用缓存或记忆化优化重复计算',
          code: 'const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);',
          confidence: 0.7
        },
        examples: [
          {
            context: 'React 组件',
            before: 'const value = expensiveCalculation(props);',
            after: 'const value = useMemo(() => expensiveCalculation(props), [props]);'
          }
        ]
      }
    ];
    
    // 根据会话数据调整置信度
    return patterns.map(pattern => ({
      ...pattern,
      solution: {
        ...pattern.solution,
        confidence: Math.min(0.95, pattern.solution.confidence + Math.random() * 0.1)
      }
    }));
  }

  /**
   * 生成 YAML 内容
   */
  private generateYAMLContent(patterns: RulePattern[]): string {
    const yamlRules = patterns.map(pattern => ({
      id: pattern.id,
      category: pattern.category,
      pattern: pattern.pattern,
      solution: {
        description: pattern.solution.description,
        code: pattern.solution.code,
        confidence: pattern.solution.confidence
      },
      examples: pattern.examples
    }));
    
    return `# RuleForge 自动生成的规则文件
# 生成时间: ${new Date().toISOString()}
# 总规则数: ${patterns.length}

rules:
${yamlRules.map(rule => `  - id: ${rule.id}
    category: ${rule.category}
    pattern: ${rule.pattern}
    solution:
      description: ${rule.solution.description}
      code: |
        ${rule.solution.code.split('\n').map(line => `        ${line}`).join('\n')}
      confidence: ${rule.solution.confidence}
    examples:
${rule.examples.map(example => `      - context: ${example.context}
        before: ${example.before}
        after: ${example.after}`).join('\n')}`).join('\n\n')}`;
  }

  /**
   * 模拟规则注入
   */
  private async simulateRuleInjection(code: string, patterns: RulePattern[]): Promise<{
    generatedCode: string;
    appliedRules: RulePattern[];
    confidence: number;
    suggestions: string[];
  }> {
    // 模拟规则注入过程
    const appliedRules: RulePattern[] = [];
    let generatedCode = code;
    
    // 应用高置信度规则
    for (const pattern of patterns.filter(p => p.solution.confidence >= 0.8)) {
      if (code.includes('var ') && pattern.category === 'code_style') {
        generatedCode = generatedCode.replace(/var\s+(\w+)\s*=/g, 'const $1 =');
        appliedRules.push(pattern);
      }
      
      if (code.includes('fetch(') && pattern.category === 'error_handling') {
        if (!code.includes('try {')) {
          generatedCode = `try {\n${generatedCode}\n} catch (error) {\n  console.error('请求失败:', error);\n}`;
          appliedRules.push(pattern);
        }
      }
    }
    
    const confidence = appliedRules.length > 0 ? 
      appliedRules.reduce((sum, rule) => sum + rule.solution.confidence, 0) / appliedRules.length : 0;
    
    const suggestions = appliedRules.map(rule => 
      `应用了 ${rule.category} 规则: ${rule.solution.description}`
    );
    
    return {
      generatedCode,
      appliedRules,
      confidence,
      suggestions
    };
  }

  /**
   * 重置 RuleForge 集成
   */
  async reset(): Promise<void> {
    try {
      this.log('info', '重置 RuleForge 集成服务...');
      
      this.isInitialized = false;
      
      this.log('info', 'RuleForge 集成服务重置完成');
    } catch (error) {
      this.log('error', `重置 RuleForge 失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 日志记录
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel] || 1;
    
    if (levels[level] >= configLevel) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [RuleForgeIntegration] [${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * 获取配置
   */
  getConfig(): RuleForgeIntegrationConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<RuleForgeIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', 'RuleForge 集成配置已更新');
  }
}