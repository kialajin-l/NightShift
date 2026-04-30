// NightShift RuleForge 会话日志解析器

/**
 * 会话日志数据结构
 */
export interface ConversationLog {
  id: string;
  timestamp: Date;
  messages: Message[];
  metadata: {
    projectId: string;
    userId: string;
    sessionId: string;
    language?: string;
    framework?: string;
    duration?: number;
  };
}

/**
 * 消息数据结构
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    toolCalls?: ToolCall[];
    codeBlocks?: CodeBlock[];
    errors?: Error[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    complexity?: 'simple' | 'medium' | 'complex';
  };
}

/**
 * 工具调用数据结构
 */
export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
  duration?: number;
  success: boolean;
}

/**
 * 代码块数据结构
 */
export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
  changes?: CodeChange[];
  metadata?: {
    quality?: number; // 0-1
    complexity?: number; // 0-1
    styleScore?: number; // 0-1
  };
}

/**
 * 代码变更数据结构
 */
export interface CodeChange {
  type: 'add' | 'modify' | 'delete';
  lineNumber: number;
  content: string;
  oldContent?: string;
}

/**
 * 错误数据结构
 */
export interface Error {
  type: string;
  message: string;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: string;
  solution?: string;
}

/**
 * 解析结果
 */
export interface ParseResult {
  log: ConversationLog;
  statistics: {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    systemMessages: number;
    totalCodeBlocks: number;
    totalErrors: number;
    totalToolCalls: number;
    averageMessageLength: number;
    sentimentScore: number; // 0-1
    complexityScore: number; // 0-1
  };
  patterns: {
    repeatedInstructions: string[];
    commonErrors: Error[];
    userPreferences: string[];
    codePatterns: CodePattern[];
  };
  insights: {
    technicalDebt: number; // 0-1
    learningProgress: number; // 0-1
    efficiency: number; // 0-1
    recommendations: string[];
  };
}

/**
 * 代码模式
 */
export interface CodePattern {
  type: 'naming' | 'structure' | 'style' | 'optimization';
  pattern: string;
  frequency: number;
  examples: string[];
  confidence: number;
}

/**
 * 会话日志解析器
 */
export class ConversationLogParser {
  
  /**
   * 解析会话日志
   */
  async parse(log: ConversationLog): Promise<ParseResult> {
    const statistics = this.calculateStatistics(log);
    const patterns = await this.detectPatterns(log);
    const insights = this.generateInsights(log, statistics, patterns);
    
    return {
      log,
      statistics,
      patterns,
      insights
    };
  }

  /**
   * 计算统计信息
   */
  private calculateStatistics(log: ConversationLog) {
    const messages = log.messages;
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    const systemMessages = messages.filter(m => m.role === 'system');
    
    const totalCodeBlocks = messages.reduce((sum, msg) => 
      sum + (msg.metadata?.codeBlocks?.length || 0), 0
    );
    
    const totalErrors = messages.reduce((sum, msg) => 
      sum + (msg.metadata?.errors?.length || 0), 0
    );
    
    const totalToolCalls = messages.reduce((sum, msg) => 
      sum + (msg.metadata?.toolCalls?.length || 0), 0
    );
    
    const averageMessageLength = messages.length > 0 
      ? messages.reduce((sum, msg) => sum + msg.content.length, 0) / messages.length
      : 0;
    
    const sentimentScore = this.calculateSentimentScore(messages);
    const complexityScore = this.calculateComplexityScore(messages);
    
    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      systemMessages: systemMessages.length,
      totalCodeBlocks,
      totalErrors,
      totalToolCalls,
      averageMessageLength,
      sentimentScore,
      complexityScore
    };
  }

  /**
   * 计算情感分数
   */
  private calculateSentimentScore(messages: Message[]): number {
    const sentimentKeywords = {
      positive: ['好', '优秀', '完美', '感谢', '谢谢', '很棒', '不错', '正确', '成功'],
      negative: ['错误', '失败', '问题', 'bug', '修复', '修改', '不对', '不行', '不能']
    };
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      
      // 检查积极关键词
      positiveCount += sentimentKeywords.positive.filter(keyword => 
        content.includes(keyword)
      ).length;
      
      // 检查消极关键词
      negativeCount += sentimentKeywords.negative.filter(keyword => 
        content.includes(keyword)
      ).length;
    });
    
    const total = positiveCount + negativeCount;
    if (total === 0) return 0.5; // 中性
    
    return positiveCount / total;
  }

  /**
   * 计算复杂度分数
   */
  private calculateComplexityScore(messages: Message[]): number {
    const complexityIndicators = [
      '复杂', '困难', '挑战', '优化', '重构', '架构', '设计模式', '算法',
      'performance', 'optimization', 'refactor', 'architecture'
    ];
    
    let complexityCount = 0;
    let totalMessages = messages.length;
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      
      // 检查复杂度指标
      if (complexityIndicators.some(indicator => content.includes(indicator))) {
        complexityCount++;
      }
      
      // 检查代码块数量和大小
      const codeBlocks = message.metadata?.codeBlocks || [];
      if (codeBlocks.length > 0) {
        const totalCodeLength = codeBlocks.reduce((sum, block) => 
          sum + block.code.length, 0
        );
        if (totalCodeLength > 500) {
          complexityCount += 0.5;
        }
      }
    });
    
    return Math.min(1, complexityCount / totalMessages);
  }

  /**
   * 检测模式
   */
  private async detectPatterns(log: ConversationLog) {
    const repeatedInstructions = this.detectRepeatedInstructions(log.messages);
    const commonErrors = this.detectCommonErrors(log.messages);
    const userPreferences = this.detectUserPreferences(log.messages);
    const codePatterns = this.detectCodePatterns(log.messages);
    
    return {
      repeatedInstructions,
      commonErrors,
      userPreferences,
      codePatterns
    };
  }

  /**
   * 检测重复指令
   */
  private detectRepeatedInstructions(messages: Message[]): string[] {
    const userMessages = messages.filter(m => m.role === 'user');
    const instructionPatterns: Record<string, number> = {};
    
    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      // 提取指令关键词
      const instructions = [
        '创建', '实现', '添加', '修改', '删除', '优化', '重构', '修复',
        'create', 'implement', 'add', 'modify', 'delete', 'optimize', 'refactor', 'fix'
      ];
      
      instructions.forEach(instruction => {
        if (content.includes(instruction)) {
          instructionPatterns[instruction] = (instructionPatterns[instruction] || 0) + 1;
        }
      });
    });
    
    // 返回出现次数超过2次的指令
    return Object.entries(instructionPatterns)
      .filter(([_, count]) => count >= 2)
      .map(([instruction]) => instruction);
  }

  /**
   * 检测常见错误
   */
  private detectCommonErrors(messages: Message[]): Error[] {
    const allErrors: Error[] = [];
    
    messages.forEach(message => {
      const errors = message.metadata?.errors || [];
      allErrors.push(...errors);
    });
    
    // 按类型分组并统计频率
    const errorGroups: Record<string, Error[]> = {};
    allErrors.forEach(error => {
      if (!errorGroups[error.type]) {
        errorGroups[error.type] = [];
      }
      errorGroups[error.type].push(error);
    });
    
    // 返回出现次数最多的错误类型
    const commonErrorTypes = Object.entries(errorGroups)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 5)
      .map(([type, errors]) => errors[0]); // 返回第一个错误作为示例
    
    return commonErrorTypes;
  }

  /**
   * 检测用户偏好
   */
  private detectUserPreferences(messages: Message[]): string[] {
    const preferences: string[] = [];
    const userMessages = messages.filter(m => m.role === 'user');
    
    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      // 检测技术栈偏好
      const techPreferences = [
        'vue', 'react', 'angular', 'typescript', 'javascript', 'python', 'java',
        'tailwind', 'bootstrap', 'material-ui', 'antd'
      ];
      
      techPreferences.forEach(tech => {
        if (content.includes(tech)) {
          preferences.push(tech);
        }
      });
      
      // 检测代码风格偏好
      const stylePreferences = [
        '简洁', '清晰', '注释', '文档', '测试', '模块化', '组件化',
        'clean', 'clear', 'comment', 'documentation', 'test', 'modular', 'component'
      ];
      
      stylePreferences.forEach(style => {
        if (content.includes(style)) {
          preferences.push(style);
        }
      });
    });
    
    // 去重并返回
    return [...new Set(preferences)];
  }

  /**
   * 检测代码模式
   */
  private detectCodePatterns(messages: Message[]): CodePattern[] {
    const patterns: CodePattern[] = [];
    const allCodeBlocks: CodeBlock[] = [];
    
    // 收集所有代码块
    messages.forEach(message => {
      const codeBlocks = message.metadata?.codeBlocks || [];
      allCodeBlocks.push(...codeBlocks);
    });
    
    // 检测命名模式
    const namingPatterns = this.detectNamingPatterns(allCodeBlocks);
    patterns.push(...namingPatterns);
    
    // 检测结构模式
    const structurePatterns = this.detectStructurePatterns(allCodeBlocks);
    patterns.push(...structurePatterns);
    
    // 检测风格模式
    const stylePatterns = this.detectStylePatterns(allCodeBlocks);
    patterns.push(...stylePatterns);
    
    return patterns;
  }

  /**
   * 检测命名模式
   */
  private detectNamingPatterns(codeBlocks: CodeBlock[]): CodePattern[] {
    const patterns: CodePattern[] = [];
    
    // 检测变量命名模式
    const variablePatterns = this.analyzeVariableNaming(codeBlocks);
    if (variablePatterns.length > 0) {
      patterns.push({
        type: 'naming',
        pattern: '变量命名规范',
        frequency: variablePatterns.length,
        examples: variablePatterns.slice(0, 3),
        confidence: 0.8
      });
    }
    
    // 检测函数命名模式
    const functionPatterns = this.analyzeFunctionNaming(codeBlocks);
    if (functionPatterns.length > 0) {
      patterns.push({
        type: 'naming',
        pattern: '函数命名规范',
        frequency: functionPatterns.length,
        examples: functionPatterns.slice(0, 3),
        confidence: 0.8
      });
    }
    
    return patterns;
  }

  /**
   * 分析变量命名
   */
  private analyzeVariableNaming(codeBlocks: CodeBlock[]): string[] {
    const patterns: string[] = [];
    
    codeBlocks.forEach(block => {
      const code = block.code;
      
      // 简单的变量命名模式检测
      const variableRegex = /(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
      let match;
      
      while ((match = variableRegex.exec(code)) !== null) {
        const variableName = match[2];
        
        // 检测命名风格
        if (/^[a-z][a-zA-Z0-9]*$/.test(variableName)) {
          patterns.push(`camelCase: ${variableName}`);
        } else if (/^[A-Z][a-zA-Z0-9]*$/.test(variableName)) {
          patterns.push(`PascalCase: ${variableName}`);
        } else if (variableName.includes('_')) {
          patterns.push(`snake_case: ${variableName}`);
        }
      }
    });
    
    return patterns;
  }

  /**
   * 分析函数命名
   */
  private analyzeFunctionNaming(codeBlocks: CodeBlock[]): string[] {
    const patterns: string[] = [];
    
    codeBlocks.forEach(block => {
      const code = block.code;
      
      // 简单的函数命名模式检测
      const functionRegex = /(function|const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
      let match;
      
      while ((match = functionRegex.exec(code)) !== null) {
        const functionName = match[2];
        
        // 检测命名风格
        if (/^[a-z][a-zA-Z0-9]*$/.test(functionName)) {
          patterns.push(`camelCase: ${functionName}`);
        } else if (/^[A-Z][a-zA-Z0-9]*$/.test(functionName)) {
          patterns.push(`PascalCase: ${functionName}`);
        }
      }
    });
    
    return patterns;
  }

  /**
   * 检测结构模式
   */
  private detectStructurePatterns(codeBlocks: CodeBlock[]): CodePattern[] {
    const patterns: CodePattern[] = [];
    
    // 检测导入模式
    const importPatterns = this.analyzeImportPatterns(codeBlocks);
    if (importPatterns.length > 0) {
      patterns.push({
        type: 'structure',
        pattern: '导入结构模式',
        frequency: importPatterns.length,
        examples: importPatterns.slice(0, 3),
        confidence: 0.7
      });
    }
    
    return patterns;
  }

  /**
   * 分析导入模式
   */
  private analyzeImportPatterns(codeBlocks: CodeBlock[]): string[] {
    const patterns: string[] = [];
    
    codeBlocks.forEach(block => {
      const code = block.code;
      
      // 检测 import 语句
      const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = importRegex.exec(code)) !== null) {
        const importPath = match[1];
        patterns.push(`import from: ${importPath}`);
      }
      
      // 检测 require 语句
      const requireRegex = /const\s+.*?=\s+require\(['"]([^'"]+)['"]\)/g;
      while ((match = requireRegex.exec(code)) !== null) {
        const requirePath = match[1];
        patterns.push(`require: ${requirePath}`);
      }
    });
    
    return patterns;
  }

  /**
   * 检测风格模式
   */
  private detectStylePatterns(codeBlocks: CodeBlock[]): CodePattern[] {
    const patterns: CodePattern[] = [];
    
    // 检测缩进风格
    const indentPatterns = this.analyzeIndentation(codeBlocks);
    if (indentPatterns.length > 0) {
      patterns.push({
        type: 'style',
        pattern: '缩进风格',
        frequency: indentPatterns.length,
        examples: indentPatterns.slice(0, 3),
        confidence: 0.9
      });
    }
    
    return patterns;
  }

  /**
   * 分析缩进风格
   */
  private analyzeIndentation(codeBlocks: CodeBlock[]): string[] {
    const patterns: string[] = [];
    
    codeBlocks.forEach(block => {
      const lines = block.code.split('\n');
      
      // 检测缩进字符（空格或制表符）
      if (lines.length > 1) {
        const firstIndentedLine = lines.find(line => line.startsWith(' ') || line.startsWith('\t'));
        if (firstIndentedLine) {
          if (firstIndentedLine.startsWith('  ')) {
            patterns.push('2空格缩进');
          } else if (firstIndentedLine.startsWith('    ')) {
            patterns.push('4空格缩进');
          } else if (firstIndentedLine.startsWith('\t')) {
            patterns.push('制表符缩进');
          }
        }
      }
    });
    
    return patterns;
  }

  /**
   * 生成洞察
   */
  private generateInsights(
    log: ConversationLog, 
    statistics: ParseResult['statistics'], 
    patterns: ParseResult['patterns']
  ): ParseResult['insights'] {
    const technicalDebt = this.calculateTechnicalDebt(patterns, statistics);
    const learningProgress = this.calculateLearningProgress(log, statistics);
    const efficiency = this.calculateEfficiency(statistics);
    const recommendations = this.generateRecommendations(patterns, statistics);
    
    return {
      technicalDebt,
      learningProgress,
      efficiency,
      recommendations
    };
  }

  /**
   * 计算技术债务
   */
  private calculateTechnicalDebt(
    patterns: ParseResult['patterns'], 
    statistics: ParseResult['statistics']
  ): number {
    let debtScore = 0;
    
    // 基于错误数量
    debtScore += Math.min(1, statistics.totalErrors / 10) * 0.3;
    
    // 基于重复指令
    debtScore += Math.min(1, patterns.repeatedInstructions.length / 5) * 0.3;
    
    // 基于复杂度
    debtScore += statistics.complexityScore * 0.4;
    
    return Math.min(1, debtScore);
  }

  /**
   * 计算学习进度
   */
  private calculateLearningProgress(
    log: ConversationLog, 
    statistics: ParseResult['statistics']
  ): number {
    // 基于消息数量和复杂度
    const messageProgress = Math.min(1, statistics.totalMessages / 50);
    const complexityProgress = statistics.complexityScore;
    
    return (messageProgress + complexityProgress) / 2;
  }

  /**
   * 计算效率
   */
  private calculateEfficiency(statistics: ParseResult['statistics']): number {
    // 基于错误率和消息长度
    const errorEfficiency = 1 - Math.min(1, statistics.totalErrors / statistics.totalMessages);
    const lengthEfficiency = Math.min(1, statistics.averageMessageLength / 500);
    
    return (errorEfficiency + lengthEfficiency) / 2;
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    patterns: ParseResult['patterns'], 
    statistics: ParseResult['statistics']
  ): string[] {
    const recommendations: string[] = [];
    
    // 基于错误模式生成建议
    if (patterns.commonErrors.length > 0) {
      recommendations.push('建议关注常见错误类型，建立错误预防机制');
    }
    
    // 基于重复指令生成建议
    if (patterns.repeatedInstructions.length > 0) {
      recommendations.push('检测到重复指令，建议创建模板或自动化脚本');
    }
    
    // 基于代码模式生成建议
    if (patterns.codePatterns.length > 0) {
      recommendations.push('检测到代码模式，建议制定编码规范');
    }
    
    // 基于统计信息生成建议
    if (statistics.totalErrors > 5) {
      recommendations.push('错误数量较多，建议加强测试和代码审查');
    }
    
    if (statistics.sentimentScore < 0.3) {
      recommendations.push('情感分数较低，建议优化沟通方式');
    }
    
    return recommendations;
  }

  /**
   * 批量解析会话日志
   */
  async parseBatch(logs: ConversationLog[]): Promise<ParseResult[]> {
    const results: ParseResult[] = [];
    
    for (const log of logs) {
      try {
        const result = await this.parse(log);
        results.push(result);
      } catch (error) {
        console.error(`解析会话日志失败: ${log.id}`, error);
      }
    }
    
    return results;
  }

  /**
   * 验证会话日志格式
   */
  validateLog(log: ConversationLog): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!log.id) {
      errors.push('日志 ID 不能为空');
    }
    
    if (!log.timestamp) {
      errors.push('时间戳不能为空');
    }
    
    if (!log.messages || log.messages.length === 0) {
      errors.push('消息列表不能为空');
    }
    
    log.messages.forEach((message, index) => {
      if (!message.role) {
        errors.push(`消息 ${index} 的角色不能为空`);
      }
      
      if (!message.content) {
        errors.push(`消息 ${index} 的内容不能为空`);
      }
      
      if (!message.timestamp) {
        errors.push(`消息 ${index} 的时间戳不能为空`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}