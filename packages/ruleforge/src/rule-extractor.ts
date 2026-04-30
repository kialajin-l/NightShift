/**
 * RuleForge 规则提取器 - 从代码中提取开发规则
 * 符合 REP v0.1 协议规范
 */

import { LLMClient } from '../../src/lib/llm-client.js';

interface RuleExtractorConfig {
  llmClient?: LLMClient;
  confidenceThreshold?: number;
  enableASTAnalysis?: boolean;
  maxRulesPerFile?: number;
}

interface RuleExtractionResult {
  success: boolean;
  rules: Rule[];
  confidence: number;
  metadata: {
    filesAnalyzed: number;
    patternsFound: number;
    extractionTime: number;
  };
}

interface Rule {
  meta: RuleMeta;
  rule: RuleDefinition;
  compatibility: Compatibility;
}

interface RuleMeta {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  created: string;
  updated: string;
}

interface RuleDefinition {
  trigger: Trigger;
  condition: Condition;
  suggestion: Suggestion;
}

interface Trigger {
  type: 'code_pattern' | 'file_change' | 'commit_message';
  pattern: string;
  language: string;
}

interface Condition {
  context: string[];
  constraints: Constraint[];
}

interface Constraint {
  type: 'file_size' | 'complexity' | 'dependencies';
  condition: string;
}

interface Suggestion {
  message: string;
  fix: string;
  examples: Example[];
  priority: 'low' | 'medium' | 'high';
}

interface Example {
  before: string;
  after: string;
  explanation: string;
}

interface Compatibility {
  engines: string[];
  platforms: string[];
  dependencies: string[];
}

export class RuleExtractor {
  private llmClient: LLMClient;
  private config: Required<RuleExtractorConfig>;
  private logger: Console;

  constructor(config: RuleExtractorConfig = {}) {
    this.config = {
      llmClient: config.llmClient || new LLMClient(),
      confidenceThreshold: config.confidenceThreshold ?? 0.7,
      enableASTAnalysis: config.enableASTAnalysis ?? true,
      maxRulesPerFile: config.maxRulesPerFile ?? 10
    };

    this.llmClient = this.config.llmClient;
    this.logger = console;
  }

  /**
   * 从代码文件中提取规则
   */
  async extractFromFiles(filePaths: string[]): Promise<RuleExtractionResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`[RuleExtractor] 开始从 ${filePaths.length} 个文件中提取规则`);

      const allRules: Rule[] = [];
      let totalPatterns = 0;

      for (const filePath of filePaths) {
        try {
          const fileRules = await this.extractFromFile(filePath);
          allRules.push(...fileRules);
          totalPatterns += fileRules.length;
        } catch (error) {
          this.logger.warn(`[RuleExtractor] 文件分析失败: ${filePath}`, error);
        }
      }

      // 过滤低置信度规则
      const filteredRules = this.filterRulesByConfidence(allRules);
      
      // 去重规则
      const uniqueRules = this.deduplicateRules(filteredRules);

      const extractionTime = Date.now() - startTime;

      const result: RuleExtractionResult = {
        success: uniqueRules.length > 0,
        rules: uniqueRules,
        confidence: this.calculateOverallConfidence(uniqueRules),
        metadata: {
          filesAnalyzed: filePaths.length,
          patternsFound: totalPatterns,
          extractionTime
        }
      };

      this.logger.log(`[RuleExtractor] 规则提取完成: ${uniqueRules.length} 个规则`);

      return result;

    } catch (error) {
      const extractionTime = Date.now() - startTime;
      this.logger.error('[RuleExtractor] 规则提取失败:', error);

      return {
        success: false,
        rules: [],
        confidence: 0,
        metadata: {
          filesAnalyzed: filePaths.length,
          patternsFound: 0,
          extractionTime
        }
      };
    }
  }

  /**
   * 从单个文件提取规则
   */
  private async extractFromFile(filePath: string): Promise<Rule[]> {
    // 读取文件内容
    const fileContent = await this.readFileContent(filePath);
    if (!fileContent) {
      return [];
    }

    // 使用LLM分析代码模式
    const analysisResult = await this.analyzeCodeWithLLM(fileContent, filePath);
    
    // 转换为规则格式
    const rules = this.convertAnalysisToRules(analysisResult, filePath);
    
    return rules.slice(0, this.config.maxRulesPerFile);
  }

  /**
   * 读取文件内容
   */
  private async readFileContent(filePath: string): Promise<string | null> {
    try {
      // 这里应该使用文件系统API读取文件
      // 暂时返回空字符串
      return '';
    } catch (error) {
      this.logger.error(`[RuleExtractor] 读取文件失败: ${filePath}`, error);
      return null;
    }
  }

  /**
   * 使用LLM分析代码
   */
  private async analyzeCodeWithLLM(code: string, filePath: string): Promise<string> {
    const systemPrompt = `你是一个专业的代码分析专家。请分析提供的代码，识别其中的开发模式、最佳实践和潜在问题。

请关注以下方面：
1. 代码风格和规范
2. 安全漏洞和风险
3. 性能优化机会
4. 可维护性问题
5. 设计模式应用

请以结构化的JSON格式返回分析结果。`;

    const userPrompt = `请分析以下代码文件：

文件路径: ${filePath}
代码内容:
\`\`\`
${code.substring(0, 2000)} // 限制长度
\`\`\`

请提供详细的分析结果，包括发现的模式和问题。`;

    const response = await this.llmClient.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'gpt-4',
      temperature: 0.1,
      maxTokens: 3000
    });

    return response.content;
  }

  /**
   * 转换分析结果为规则
   */
  private convertAnalysisToRules(analysis: string, filePath: string): Rule[] {
    try {
      const parsed = JSON.parse(this.extractJSONFromResponse(analysis));
      return this.normalizeRules(parsed, filePath);
    } catch (error) {
      this.logger.warn('[RuleExtractor] JSON解析失败，使用启发式规则生成');
      return this.generateHeuristicRules(filePath);
    }
  }

  /**
   * 标准化规则
   */
  private normalizeRules(rawData: any, filePath: string): Rule[] {
    if (!Array.isArray(rawData.patterns)) {
      return [];
    }

    return rawData.patterns.map((pattern: any, index: number) => ({
      meta: {
        id: this.generateRuleId(filePath, index),
        name: pattern.name || `规则_${index + 1}`,
        version: '1.0.0',
        description: pattern.description || '',
        author: 'RuleExtractor',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      },
      rule: {
        trigger: {
          type: pattern.triggerType || 'code_pattern',
          pattern: pattern.pattern || '',
          language: this.detectLanguage(filePath)
        },
        condition: {
          context: Array.isArray(pattern.context) ? pattern.context : [],
          constraints: this.normalizeConstraints(pattern.constraints)
        },
        suggestion: {
          message: pattern.suggestion || '',
          fix: pattern.fix || '',
          examples: this.normalizeExamples(pattern.examples),
          priority: this.normalizePriority(pattern.priority)
        }
      },
      compatibility: {
        engines: ['node>=14'],
        platforms: this.detectPlatforms(filePath),
        dependencies: []
      }
    }));
  }

  /**
   * 生成启发式规则
   */
  private generateHeuristicRules(filePath: string): Rule[] {
    const language = this.detectLanguage(filePath);
    
    // 基于文件类型的通用规则
    const baseRules: Rule[] = [];

    if (language === 'typescript') {
      baseRules.push({
        meta: {
          id: this.generateRuleId(filePath, 1),
          name: 'TypeScript严格模式',
          version: '1.0.0',
          description: '建议启用TypeScript严格模式',
          author: 'RuleExtractor',
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        },
        rule: {
          trigger: {
            type: 'code_pattern',
            pattern: 'tsconfig.json',
            language: 'json'
          },
          condition: {
            context: ['typescript项目'],
            constraints: []
          },
          suggestion: {
            message: '建议在tsconfig.json中启用严格模式',
            fix: '添加 "strict": true 到编译器选项',
            examples: [{
              before: '{\"compilerOptions\": {}}',
              after: '{\"compilerOptions\": {\"strict\": true}}',
              explanation: '启用严格模式可以提高代码质量'
            }],
            priority: 'high'
          }
        },
        compatibility: {
          engines: ['node>=14'],
          platforms: ['任何平台'],
          dependencies: ['typescript']
        }
      });
    }

    return baseRules;
  }

  /**
   * 检测文件语言
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'js': 'javascript',
      'vue': 'vue',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml'
    };

    return languageMap[ext || ''] || 'unknown';
  }

  /**
   * 检测平台
   */
  private detectPlatforms(filePath: string): string[] {
    const platforms = ['node'];
    
    if (filePath.includes('vue') || filePath.includes('react')) {
      platforms.push('browser');
    }
    
    if (filePath.includes('android') || filePath.includes('ios')) {
      platforms.push('mobile');
    }

    return platforms;
  }

  /**
   * 标准化约束条件
   */
  private normalizeConstraints(constraints: any): Constraint[] {
    if (!Array.isArray(constraints)) return [];
    
    return constraints.map((constraint: any) => ({
      type: constraint.type || 'complexity',
      condition: constraint.condition || ''
    }));
  }

  /**
   * 标准化示例
   */
  private normalizeExamples(examples: any): Example[] {
    if (!Array.isArray(examples)) return [];
    
    return examples.map((example: any) => ({
      before: example.before || '',
      after: example.after || '',
      explanation: example.explanation || ''
    }));
  }

  /**
   * 标准化优先级
   */
  private normalizePriority(priority: any): 'low' | 'medium' | 'high' {
    if (['low', 'medium', 'high'].includes(priority)) {
      return priority as 'low' | 'medium' | 'high';
    }
    return 'medium';
  }

  /**
   * 从响应中提取JSON
   */
  private extractJSONFromResponse(response: string): string {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : '{}';
  }

  /**
   * 过滤低置信度规则
   */
  private filterRulesByConfidence(rules: Rule[]): Rule[] {
    // 简化的置信度计算
    return rules.filter(rule => {
      const confidence = this.calculateRuleConfidence(rule);
      return confidence >= this.config.confidenceThreshold;
    });
  }

  /**
   * 计算规则置信度
   */
  private calculateRuleConfidence(rule: Rule): number {
    let confidence = 0.5; // 基础置信度
    
    // 基于规则完整性调整置信度
    if (rule.rule.suggestion.message) confidence += 0.2;
    if (rule.rule.suggestion.fix) confidence += 0.15;
    if (rule.rule.suggestion.examples.length > 0) confidence += 0.1;
    if (rule.rule.condition.constraints.length > 0) confidence += 0.05;
    
    return Math.min(1.0, confidence);
  }

  /**
   * 计算整体置信度
   */
  private calculateOverallConfidence(rules: Rule[]): number {
    if (rules.length === 0) return 0;
    
    const totalConfidence = rules.reduce((sum, rule) => {
      return sum + this.calculateRuleConfidence(rule);
    }, 0);
    
    return totalConfidence / rules.length;
  }

  /**
   * 去重规则
   */
  private deduplicateRules(rules: Rule[]): Rule[] {
    const seen = new Set<string>();
    const uniqueRules: Rule[] = [];
    
    for (const rule of rules) {
      const signature = this.getRuleSignature(rule);
      if (!seen.has(signature)) {
        seen.add(signature);
        uniqueRules.push(rule);
      }
    }
    
    return uniqueRules;
  }

  /**
   * 获取规则签名（用于去重）
   */
  private getRuleSignature(rule: Rule): string {
    return `${rule.rule.trigger.pattern}-${rule.rule.suggestion.message}`;
  }

  /**
   * 生成规则ID
   */
  private generateRuleId(filePath: string, index: number): string {
    const baseName = filePath.split('/').pop()?.split('.')[0] || 'file';
    return `rule_${baseName}_${index}_${Date.now()}`;
  }

  /**
   * 获取提取器配置
   */
  getConfig(): RuleExtractorConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RuleExtractorConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log('[RuleExtractor] 配置已更新');
  }
}

// 导出单例实例
export const ruleExtractor = new RuleExtractor();

export default RuleExtractor;