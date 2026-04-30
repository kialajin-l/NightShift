// RuleForge 规则自动注入器 - 基于提取的规则智能生成代码

import { CandidatePattern } from './types/ruleforge-mock';
import { ruleForgeBridge } from './ruleforge-bridge';

/**
 * 代码生成上下文
 */
interface CodeGenerationContext {
  language: 'typescript' | 'javascript' | 'python' | 'vue';
  fileType: string;
  existingCode: string;
  userIntent: string;
  projectType: 'vue' | 'react' | 'fastapi' | 'node';
}

/**
 * 代码生成结果
 */
interface CodeGenerationResult {
  generatedCode: string;
  appliedRules: CandidatePattern[];
  confidence: number;
  suggestions: string[];
  warnings: string[];
}

/**
 * 规则注入器服务
 */
export class RuleInjector {
  private appliedRules: Set<string> = new Set();

  /**
   * 根据上下文智能生成代码
   */
  async generateCode(context: CodeGenerationContext): Promise<CodeGenerationResult> {
    const { language, fileType, existingCode, userIntent, projectType } = context;
    
    // 获取高置信度规则
    const highConfidenceRules = await ruleForgeBridge.getHighConfidenceRules(0.7);
    
    // 筛选与当前上下文相关的规则
    const applicableRules = this.filterApplicableRules(highConfidenceRules, context);
    
    // 分析现有代码，识别改进点
    const codeAnalysis = this.analyzeCode(existingCode, language);
    
    // 应用规则生成优化代码
    const generationResult = this.applyRulesToCode(existingCode, applicableRules, codeAnalysis);
    
    // 生成建议和警告
    const suggestions = this.generateSuggestions(applicableRules, codeAnalysis);
    const warnings = this.generateWarnings(codeAnalysis);
    
    return {
      generatedCode: generationResult.optimizedCode,
      appliedRules: generationResult.appliedRules,
      confidence: this.calculateOverallConfidence(generationResult.appliedRules),
      suggestions,
      warnings
    };
  }

  /**
   * 筛选与上下文相关的规则
   */
  private filterApplicableRules(
    rules: CandidatePattern[], 
    context: CodeGenerationContext
  ): CandidatePattern[] {
    return rules.filter(rule => {
      // 检查语言匹配
      const languageMatch = this.checkLanguageMatch(rule, context.language);
      
      // 检查文件类型匹配
      const fileTypeMatch = this.checkFileTypeMatch(rule, context.fileType);
      
      // 检查用户意图匹配
      const intentMatch = this.checkIntentMatch(rule, context.userIntent);
      
      // 检查项目类型匹配
      const projectMatch = this.checkProjectMatch(rule, context.projectType);
      
      return languageMatch && fileTypeMatch && intentMatch && projectMatch;
    });
  }

  /**
   * 检查语言匹配
   */
  private checkLanguageMatch(rule: CandidatePattern, language: string): boolean {
    const languagePatterns: Record<string, string[]> = {
      'typescript': ['**/*.ts', '**/*.tsx'],
      'javascript': ['**/*', '**/*.jsx'],
      'python': ['**/*.py'],
      'vue': ['**/*.vue']
    };
    
    const patterns = languagePatterns[language] || [];
    const filePatterns = (rule as any).trigger?.filePattern || ['**/*'];
    return patterns.some(pattern => 
      filePatterns.includes(pattern.replace('**/', ''))
    );
  }

  /**
   * 检查文件类型匹配
   */
  private checkFileTypeMatch(rule: CandidatePattern, fileType: string): boolean {
    const filePatterns = (rule as any).trigger?.filePattern || ['**/*'];
    return filePatterns.includes(fileType) || 
           filePatterns === '**/*' ||
           fileType.includes(filePatterns.replace?.('**/', '') || '');
  }

  /**
   * 检查用户意图匹配
   */
  private checkIntentMatch(rule: CandidatePattern, userIntent: string): boolean {
    const intentKeywords = userIntent.toLowerCase().split(/\s+/);
    const ruleKeywords = (rule as any).trigger?.keywords || [rule.name];
    return ruleKeywords.some((keyword: string) =>
      intentKeywords.some(intentWord => intentWord.includes(keyword.toLowerCase()))
    );
  }

  /**
   * 检查项目类型匹配
   */
  private checkProjectMatch(rule: CandidatePattern, projectType: string): boolean {
    const projectKeywords: Record<string, string[]> = {
      'vue': ['vue', 'component', 'template'],
      'react': ['react', 'jsx', 'component'],
      'fastapi': ['fastapi', 'api', 'endpoint'],
      'node': ['node', 'express', 'server']
    };
    
    const keywords = projectKeywords[projectType] || [];
    const ruleKeywords = (rule as any).trigger?.keywords || [rule.name];
    return keywords.some(keyword =>
      ruleKeywords.some((ruleKeyword: string) => 
        ruleKeyword.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * 分析现有代码
   */
  private analyzeCode(code: string, language: string): any {
    const analysis = {
      hasErrors: false,
      codeStyleIssues: [] as string[],
      optimizationOpportunities: [] as string[],
      securityConcerns: [] as string[],
      complexity: this.calculateComplexity(code),
      lineCount: code.split('\n').length
    };

    // 简单的代码分析逻辑
    if (language === 'typescript' || language === 'javascript') {
      // 检查常见问题
      if (code.includes('var ')) {
        analysis.codeStyleIssues.push('使用 var 声明变量，建议使用 const/let');
      }
      
      if (code.includes('console.log')) {
        analysis.codeStyleIssues.push('存在 console.log 语句，生产环境应移除');
      }
      
      if (code.includes('eval(')) {
        analysis.securityConcerns.push('使用 eval() 函数，存在安全风险');
      }
    }

    if (language === 'python') {
      if (code.includes('print(')) {
        analysis.codeStyleIssues.push('存在 print 语句，生产环境应使用日志');
      }
    }

    return analysis;
  }

  /**
   * 计算代码复杂度
   */
  private calculateComplexity(code: string): number {
    // 简单的复杂度计算：基于行数和嵌套深度
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const nestedBlocks = (code.match(/\{[^}]*\{|\{[^}]*\{[^}]*\}/g) || []).length;
    
    return Math.min((lines.length * 0.1) + (nestedBlocks * 0.5), 10);
  }

  /**
   * 应用规则生成优化代码
   */
  private applyRulesToCode(
    code: string, 
    rules: CandidatePattern[], 
    analysis: any
  ): { optimizedCode: string; appliedRules: CandidatePattern[] } {
    let optimizedCode = code;
    const appliedRules: CandidatePattern[] = [];

    // 按置信度排序规则
    const sortedRules = rules.sort((a, b) => b.confidence - a.confidence);

    for (const rule of sortedRules) {
      // 检查规则是否已经应用过
      if (this.appliedRules.has(rule.id)) {
        continue;
      }

      // 尝试应用规则
      const result = this.tryApplyRule(optimizedCode, rule, analysis);
      
      if (result.success) {
        optimizedCode = result.optimizedCode;
        appliedRules.push(rule);
        this.appliedRules.add(rule.id);
        
        // 限制最多应用5个规则，避免过度优化
        if (appliedRules.length >= 5) {
          break;
        }
      }
    }

    return { optimizedCode, appliedRules };
  }

  /**
   * 尝试应用单个规则
   */
  private tryApplyRule(
    code: string, 
    rule: CandidatePattern, 
    analysis: any
  ): { success: boolean; optimizedCode: string } {
    // 简单的规则应用逻辑
    // 实际实现中应该使用更复杂的代码转换逻辑
    
    let optimizedCode = code;
    let success = false;

    // 根据规则类别应用不同的优化
    const ruleKeywords = (rule as any).trigger?.keywords || [rule.name];
    switch (rule.category) {
      case 'code_style':
        // 代码风格优化
        if (ruleKeywords.includes('var')) {
          optimizedCode = optimizedCode.replace(/\bvar\b/g, 'let');
          success = true;
        }
        break;
        
      case 'error_fix':
        // 错误修复
        if (ruleKeywords.includes('null') && analysis.hasErrors) {
          // 添加空值检查
          optimizedCode = this.addNullChecks(optimizedCode);
          success = true;
        }
        break;
        
      case 'test_pattern':
        // 测试模式
        if (ruleKeywords.includes('test') && !optimizedCode.includes('describe')) {
          // 添加测试框架结构
          optimizedCode = this.addTestStructure(optimizedCode);
          success = true;
        }
        break;
        
      case 'api_design':
        // API设计优化
        if (ruleKeywords.includes('api') && analysis.complexity > 5) {
          // 简化API结构
          optimizedCode = this.simplifyApiStructure(optimizedCode);
          success = true;
        }
        break;
    }

    return { success, optimizedCode };
  }

  /**
   * 添加空值检查
   */
  private addNullChecks(code: string): string {
    // 简单的空值检查添加逻辑
    return code.replace(/(\w+)\.(\w+)/g, '$1?.$2');
  }

  /**
   * 添加测试结构
   */
  private addTestStructure(code: string): string {
    return `describe('Test Suite', () => {
  it('should work correctly', () => {
    ${code}
  });
});`;
  }

  /**
   * 简化API结构
   */
  private simplifyApiStructure(code: string): string {
    // 简单的API结构简化逻辑
    return code.replace(/function\s+\w+\s*\([^)]*\)\s*{/g, 'const $& = async (');
  }

  /**
   * 生成改进建议
   */
  private generateSuggestions(rules: CandidatePattern[], analysis: any): string[] {
    const suggestions: string[] = [];

    // 基于代码分析生成建议
    if (analysis.complexity > 7) {
      suggestions.push('代码复杂度较高，建议拆分成更小的函数');
    }
    
    if (analysis.lineCount > 100) {
      suggestions.push('文件行数较多，建议拆分成多个模块');
    }
    
    // 基于规则生成建议
    rules.forEach(rule => {
      if (rule.confidence > 0.8) {
        const solutionDesc = (rule as any).solution?.description || rule.description;
        suggestions.push(`高置信度规则建议: ${solutionDesc}`);
      }
    });

    return suggestions.slice(0, 5); // 限制建议数量
  }

  /**
   * 生成警告
   */
  private generateWarnings(analysis: any): string[] {
    const warnings: string[] = [];

    if (analysis.securityConcerns.length > 0) {
      warnings.push(...analysis.securityConcerns);
    }
    
    if (analysis.complexity > 8) {
      warnings.push('代码复杂度非常高，可能难以维护');
    }

    return warnings;
  }

  /**
   * 计算整体置信度
   */
  private calculateOverallConfidence(appliedRules: CandidatePattern[]): number {
    if (appliedRules.length === 0) return 0;
    
    const totalConfidence = appliedRules.reduce((sum, rule) => sum + rule.confidence, 0);
    return totalConfidence / appliedRules.length;
  }

  /**
   * 获取注入器状态
   */
  getStatus() {
    return {
      totalAppliedRules: this.appliedRules.size,
      isActive: this.appliedRules.size > 0,
      memoryUsage: this.appliedRules.size * 0.1 // 简单的内存使用估算
    };
  }

  /**
   * 重置注入器状态
   */
  reset() {
    this.appliedRules.clear();
  }
}

// 导出单例实例
export const ruleInjector = new RuleInjector();