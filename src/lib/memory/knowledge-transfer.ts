// NightShift 知识传递器

import { LogEntry, Knowledge, KnowledgeContext, TaskContext } from './memory-types';

/**
 * 知识传递器配置
 */
export interface KnowledgeTransferConfig {
  maxRelevantKnowledge: number;
  minRelevance: number;
  enableContextOptimization: boolean;
  databasePath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 知识传递器
 */
export class KnowledgeTransfer {
  private config: KnowledgeTransferConfig;
  private knowledgeBase: Map<string, Knowledge> = new Map();
  private knowledgeIndex: Map<string, string[]> = new Map(); // 关键词到知识ID的映射
  
  constructor(config?: Partial<KnowledgeTransferConfig>) {
    this.config = {
      maxRelevantKnowledge: 5,
      minRelevance: 0.3,
      enableContextOptimization: true,
      databasePath: './data/knowledge.db',
      logLevel: 'info',
      ...config
    };
    
    this.initializeDatabase();
  }

  /**
   * 初始化数据库
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // 在实际项目中，这里应该初始化 SQLite 数据库
      // 这里使用内存存储作为示例
      this.log('info', '知识传递器数据库已初始化');
    } catch (error) {
      this.log('error', `数据库初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 从日志中提取知识
   */
  async extractKnowledge(logs: LogEntry[]): Promise<Knowledge[]> {
    try {
      this.log('info', `开始从 ${logs.length} 条日志中提取知识`);
      
      const knowledge: Knowledge[] = [];
      
      // 提取成功模式
      const successPatterns = await this.extractSuccessPatterns(logs);
      knowledge.push(...successPatterns);
      
      // 提取错误模式
      const errorPatterns = await this.extractErrorPatterns(logs);
      knowledge.push(...errorPatterns);
      
      // 提取最佳实践
      const bestPractices = await this.extractBestPractices(logs);
      knowledge.push(...bestPractices);
      
      // 提取领域知识
      const domainKnowledge = await this.extractDomainKnowledge(logs);
      knowledge.push(...domainKnowledge);
      
      // 过滤低相关性和低置信度的知识
      const filteredKnowledge = knowledge.filter(k => 
        k.confidence >= this.config.minRelevance && 
        k.relevance >= this.config.minRelevance
      );
      
      this.log('info', `知识提取完成: 发现 ${knowledge.length} 条知识，过滤后 ${filteredKnowledge.length} 条`);
      
      return filteredKnowledge;
    } catch (error) {
      this.log('error', `提取知识失败: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * 提取成功模式
   */
  private async extractSuccessPatterns(logs: LogEntry[]): Promise<Knowledge[]> {
    const knowledge: Knowledge[] = [];
    const successEntries = logs.filter(log => 
      log.type === 'message' && 
      (log.data as any).metadata?.sentiment === 'positive'
    );
    
    if (successEntries.length === 0) return knowledge;
    
    // 分析成功的代码模式
    const codeEntries = successEntries.filter(entry => 
      (entry.data as any).metadata?.codeBlocks
    );
    
    codeEntries.forEach(entry => {
      const message = entry.data as any;
      const codeBlocks = message.metadata?.codeBlocks || [];
      
      codeBlocks.forEach((block: any) => {
        // 提取成功的代码模式
        const patterns = this.analyzeCodePatterns(block.code);
        
        patterns.forEach(pattern => {
          knowledge.push({
            id: `success-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'success-pattern',
            title: `成功模式: ${pattern.type}`,
            description: pattern.description,
            content: pattern.code,
            source: entry.sessionId,
            confidence: 0.8,
            relevance: 0.7,
            tags: ['success', 'pattern', pattern.type],
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              author: 'auto-extracted',
              version: '1.0.0'
            }
          });
        });
      });
    });
    
    return knowledge;
  }

  /**
   * 分析代码模式
   */
  private analyzeCodePatterns(code: string): Array<{type: string; description: string; code: string}> {
    const patterns: Array<{type: string; description: string; code: string}> = [];
    
    // 检测错误处理模式
    if (code.includes('try') && code.includes('catch')) {
      patterns.push({
        type: 'error-handling',
        description: '完善的错误处理模式',
        code: 'try { /* 业务逻辑 */ } catch (error) { /* 错误处理 */ }'
      });
    }
    
    // 检测异步处理模式
    if (code.includes('async') && code.includes('await')) {
      patterns.push({
        type: 'async-pattern',
        description: '异步处理模式',
        code: 'async function fetchData() { const data = await api.call(); return data; }'
      });
    }
    
    // 检测组件化模式
    if (code.includes('function') && code.includes('return') && code.includes('<')) {
      patterns.push({
        type: 'component-pattern',
        description: '组件化开发模式',
        code: 'function MyComponent(props) { return <div>{props.content}</div>; }'
      });
    }
    
    return patterns;
  }

  /**
   * 提取错误模式
   */
  private async extractErrorPatterns(logs: LogEntry[]): Promise<Knowledge[]> {
    const knowledge: Knowledge[] = [];
    const errorEntries = logs.filter(log => log.type === 'error');
    
    if (errorEntries.length === 0) return knowledge;
    
    // 按错误类型分组
    const errorGroups: Record<string, LogEntry[]> = {};
    errorEntries.forEach(entry => {
      const error = entry.data as any;
      if (!errorGroups[error.type]) {
        errorGroups[error.type] = [];
      }
      errorGroups[error.type].push(entry);
    });
    
    // 为每个错误类型创建知识
    Object.entries(errorGroups).forEach(([errorType, entries]) => {
      if (entries.length >= 2) { // 至少出现2次才认为是模式
        const solutions = this.extractErrorSolutions(entries);
        const prevention = this.generatePreventionTips(errorType);
        
        knowledge.push({
          id: `error-${errorType}-${Date.now()}`,
          type: 'error-pattern',
          title: `错误模式: ${errorType}`,
          description: `常见的 ${errorType} 错误及其解决方案`,
          content: `错误类型: ${errorType}\n解决方案: ${solutions.join(', ')}\n预防措施: ${prevention.join(', ')}`,
          source: entries[0].sessionId,
          confidence: Math.min(1, entries.length / 10),
          relevance: 0.8,
          tags: ['error', 'pattern', errorType],
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            author: 'auto-extracted',
            version: '1.0.0'
          }
        });
      }
    });
    
    return knowledge;
  }

  /**
   * 提取错误解决方案
   */
  private extractErrorSolutions(entries: LogEntry[]): string[] {
    const solutions: string[] = [];
    
    entries.forEach(entry => {
      const error = entry.data as any;
      if (error.solution) {
        solutions.push(error.solution);
      }
    });
    
    return [...new Set(solutions)];
  }

  /**
   * 生成预防建议
   */
  private generatePreventionTips(errorType: string): string[] {
    const tips: Record<string, string[]> = {
      'TypeError': [
        '使用 TypeScript 进行类型检查',
        '添加空值检查',
        '使用可选链操作符 (?.)'
      ],
      'ReferenceError': [
        '确保变量在使用前已声明',
        '检查变量作用域',
        '使用严格模式'
      ],
      'SyntaxError': [
        '使用代码格式化工具',
        '启用 ESLint 检查',
        '仔细检查括号和引号匹配'
      ]
    };
    
    return tips[errorType] || ['添加适当的错误处理', '进行充分的测试'];
  }

  /**
   * 提取最佳实践
   */
  private async extractBestPractices(logs: LogEntry[]): Promise<Knowledge[]> {
    const knowledge: Knowledge[] = [];
    const codeEntries = logs.filter(log => 
      log.type === 'message' && 
      (log.data as any).metadata?.codeBlocks
    );
    
    if (codeEntries.length === 0) return knowledge;
    
    // 检测性能优化实践
    const performancePractices = this.extractPerformancePractices(codeEntries);
    knowledge.push(...performancePractices);
    
    // 检测安全实践
    const securityPractices = this.extractSecurityPractices(codeEntries);
    knowledge.push(...securityPractices);
    
    // 检测可维护性实践
    const maintainabilityPractices = this.extractMaintainabilityPractices(codeEntries);
    knowledge.push(...maintainabilityPractices);
    
    return knowledge;
  }

  /**
   * 提取性能优化实践
   */
  private extractPerformancePractices(entries: LogEntry[]): Knowledge[] {
    const knowledge: Knowledge[] = [];
    let performanceCount = 0;
    
    entries.forEach(entry => {
      const message = entry.data as any;
      const codeBlocks = message.metadata?.codeBlocks || [];
      
      codeBlocks.forEach((block: any) => {
        const code = block.code;
        
        // 检测性能优化模式
        if (code.includes('React.memo') || code.includes('useMemo') || 
            code.includes('useCallback') || code.includes('lazy')) {
          performanceCount++;
        }
      });
    });
    
    if (performanceCount > 0) {
      knowledge.push({
        id: `best-practice-performance-${Date.now()}`,
        type: 'best-practice',
        title: '性能优化最佳实践',
        description: 'React 性能优化技巧',
        content: '使用 React.memo、useMemo、useCallback 等优化性能',
        source: 'auto-extracted',
        confidence: Math.min(1, performanceCount / entries.length),
        relevance: 0.7,
        tags: ['best-practice', 'performance', 'react'],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          author: 'auto-extracted',
          version: '1.0.0'
        }
      });
    }
    
    return knowledge;
  }

  /**
   * 提取安全实践
   */
  private extractSecurityPractices(entries: LogEntry[]): Knowledge[] {
    const knowledge: Knowledge[] = [];
    let securityCount = 0;
    
    entries.forEach(entry => {
      const message = entry.data as any;
      const codeBlocks = message.metadata?.codeBlocks || [];
      
      codeBlocks.forEach((block: any) => {
        const code = block.code;
        
        // 检测安全实践模式
        if (code.includes('sanitize') || code.includes('escape') || 
            code.includes('validation') || code.includes('authentication')) {
          securityCount++;
        }
      });
    });
    
    if (securityCount > 0) {
      knowledge.push({
        id: `best-practice-security-${Date.now()}`,
        type: 'best-practice',
        title: '安全最佳实践',
        description: 'Web 应用安全防护',
        content: '输入验证、输出转义、身份认证等安全措施',
        source: 'auto-extracted',
        confidence: Math.min(1, securityCount / entries.length),
        relevance: 0.8,
        tags: ['best-practice', 'security', 'web'],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          author: 'auto-extracted',
          version: '1.0.0'
        }
      });
    }
    
    return knowledge;
  }

  /**
   * 提取可维护性实践
   */
  private extractMaintainabilityPractices(entries: LogEntry[]): Knowledge[] {
    const knowledge: Knowledge[] = [];
    let maintainabilityCount = 0;
    
    entries.forEach(entry => {
      const message = entry.data as any;
      const codeBlocks = message.metadata?.codeBlocks || [];
      
      codeBlocks.forEach((block: any) => {
        const code = block.code;
        
        // 检测可维护性实践模式
        if (code.includes('//') || code.includes('/*') || 
            code.includes('function') || code.includes('const') || code.includes('let')) {
          maintainabilityCount++;
        }
      });
    });
    
    if (maintainabilityCount > 0) {
      knowledge.push({
        id: `best-practice-maintainability-${Date.now()}`,
        type: 'best-practice',
        title: '代码可维护性最佳实践',
        description: '提高代码可读性和可维护性的技巧',
        content: '清晰的命名、适当的注释、模块化设计等',
        source: 'auto-extracted',
        confidence: Math.min(1, maintainabilityCount / entries.length),
        relevance: 0.6,
        tags: ['best-practice', 'maintainability', 'code-quality'],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          author: 'auto-extracted',
          version: '1.0.0'
        }
      });
    }
    
    return knowledge;
  }

  /**
   * 提取领域知识
   */
  private async extractDomainKnowledge(logs: LogEntry[]): Promise<Knowledge[]> {
    const knowledge: Knowledge[] = [];
    
    // 分析技术栈使用
    const techStack = this.analyzeTechStack(logs);
    if (techStack.length > 0) {
      knowledge.push({
        id: `domain-tech-stack-${Date.now()}`,
        type: 'domain-knowledge',
        title: '技术栈使用情况',
        description: '项目中使用的技术栈和框架',
        content: `使用的技术栈: ${techStack.join(', ')}`,
        source: 'auto-extracted',
        confidence: 0.9,
        relevance: 0.8,
        tags: ['domain', 'tech-stack', 'framework'],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          author: 'auto-extracted',
          version: '1.0.0'
        }
      });
    }
    
    // 分析开发模式
    const developmentPatterns = this.analyzeDevelopmentPatterns(logs);
    developmentPatterns.forEach(pattern => {
      knowledge.push({
        id: `domain-pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'domain-knowledge',
        title: `开发模式: ${pattern.type}`,
        description: pattern.description,
        content: pattern.content,
        source: 'auto-extracted',
        confidence: pattern.confidence,
        relevance: 0.7,
        tags: ['domain', 'pattern', pattern.type],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          author: 'auto-extracted',
          version: '1.0.0'
        }
      });
    });
    
    return knowledge;
  }

  /**
   * 分析技术栈
   */
  private analyzeTechStack(logs: LogEntry[]): string[] {
    const techStack: Set<string> = new Set();
    
    logs.forEach(log => {
      if (log.type === 'message') {
        const message = log.data as any;
        const content = message.content.toLowerCase();
        
        // 检测技术栈关键词
        const technologies = [
          'react', 'vue', 'angular', 'typescript', 'javascript', 'node', 'express',
          'mongodb', 'mysql', 'postgresql', 'redis', 'docker', 'kubernetes'
        ];
        
        technologies.forEach(tech => {
          if (content.includes(tech)) {
            techStack.add(tech);
          }
        });
      }
    });
    
    return Array.from(techStack);
  }

  /**
   * 分析开发模式
   */
  private analyzeDevelopmentPatterns(logs: LogEntry[]): Array<{type: string; description: string; content: string; confidence: number}> {
    const patterns: Array<{type: string; description: string; content: string; confidence: number}> = [];
    
    // 检测组件化开发
    const componentCount = logs.filter(log => 
      log.type === 'message' && 
      (log.data as any).content.includes('组件')
    ).length;
    
    if (componentCount > 0) {
      patterns.push({
        type: 'component-based',
        description: '组件化开发模式',
        content: '使用组件化架构进行前端开发',
        confidence: Math.min(1, componentCount / logs.length)
      });
    }
    
    // 检测 API 开发
    const apiCount = logs.filter(log => 
      log.type === 'message' && 
      (log.data as any).content.includes('API')
    ).length;
    
    if (apiCount > 0) {
      patterns.push({
        type: 'api-driven',
        description: 'API 驱动开发',
        content: '基于 RESTful API 进行前后端分离开发',
        confidence: Math.min(1, apiCount / logs.length)
      });
    }
    
    return patterns;
  }

  /**
   * 传递知识给任务和 Agent
   */
  async transferKnowledge(task: TaskContext, agent: any): Promise<KnowledgeContext> {
    try {
      this.log('info', `开始为任务 ${task.taskId} 传递知识`);
      
      // 搜索相关知识
      const relevantKnowledge = await this.searchKnowledge(this.buildSearchQuery(task));
      
      // 过滤和排序知识
      const filteredKnowledge = relevantKnowledge
        .filter(k => k.relevance >= this.config.minRelevance)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, this.config.maxRelevantKnowledge);
      
      // 生成上下文摘要
      const contextSummary = this.generateContextSummary(task, filteredKnowledge);
      
      // 生成推荐
      const recommendations = this.generateRecommendations(filteredKnowledge);
      
      const knowledgeContext: KnowledgeContext = {
        taskId: task.taskId,
        relevantKnowledge: filteredKnowledge,
        contextSummary,
        recommendations,
        confidence: filteredKnowledge.length > 0 ? 
          filteredKnowledge.reduce((sum, k) => sum + k.confidence, 0) / filteredKnowledge.length : 0
      };
      
      this.log('info', `知识传递完成: ${filteredKnowledge.length} 条相关知识`);
      
      return knowledgeContext;
    } catch (error) {
      this.log('error', `知识传递失败: ${error instanceof Error ? error.message : String(error)}`);
      return {
        taskId: task.taskId,
        relevantKnowledge: [],
        contextSummary: '知识传递失败',
        recommendations: [],
        confidence: 0
      };
    }
  }

  /**
   * 构建搜索查询
   */
  private buildSearchQuery(task: TaskContext): string {
    const keywords = [
      task.taskType,
      ...task.technologyStack,
      task.complexity,
      ...task.requirements.map(req => req.split(' ').slice(0, 3).join(' '))
    ];
    
    return keywords.join(' ');
  }

  /**
   * 搜索知识
   */
  async searchKnowledge(query: string): Promise<Knowledge[]> {
    try {
      const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
      const relevantKnowledge: Knowledge[] = [];
      
      // 简单的关键词匹配搜索
      this.knowledgeBase.forEach(knowledge => {
        const content = `${knowledge.title} ${knowledge.description} ${knowledge.content} ${knowledge.tags.join(' ')}`.toLowerCase();
        
        const matchCount = keywords.filter(keyword => content.includes(keyword)).length;
        const relevance = matchCount / keywords.length;
        
        if (relevance > 0) {
          relevantKnowledge.push({
            ...knowledge,
            relevance: Math.max(knowledge.relevance, relevance)
          });
        }
      });
      
      this.log('debug', `知识搜索完成: 查询 "${query}" 找到 ${relevantKnowledge.length} 条结果`);
      return relevantKnowledge;
    } catch (error) {
      this.log('error', `知识搜索失败: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * 生成上下文摘要
   */
  private generateContextSummary(task: TaskContext, knowledge: Knowledge[]): string {
    if (knowledge.length === 0) {
      return '暂无相关历史知识';
    }
    
    const knowledgeTypes = [...new Set(knowledge.map(k => k.type))];
    const tags = [...new Set(knowledge.flatMap(k => k.tags))].slice(0, 5);
    
    return `基于 ${knowledge.length} 条历史知识，涵盖 ${knowledgeTypes.join(', ')} 类型。相关标签: ${tags.join(', ')}`;
  }

  /**
   * 生成推荐
   */
  private generateRecommendations(knowledge: Knowledge[]): string[] {
    const recommendations: string[] = [];
    
    knowledge.forEach(k => {
      if (k.type === 'error-pattern') {
        recommendations.push(`注意避免 ${k.title.split(':')[1]?.trim()} 错误`);
      } else if (k.type === 'best-practice') {
        recommendations.push(`建议应用 ${k.title} 实践`);
      } else if (k.type === 'success-pattern') {
        recommendations.push(`可参考 ${k.title} 的成功经验`);
      }
    });
    
    return recommendations.slice(0, 3);
  }

  /**
   * 更新知识库
   */
  async updateKnowledgeBase(knowledge: Knowledge[]): Promise<void> {
    try {
      let addedCount = 0;
      let updatedCount = 0;
      
      knowledge.forEach(newKnowledge => {
        const existingKnowledge = this.knowledgeBase.get(newKnowledge.id);
        
        if (existingKnowledge) {
          // 更新现有知识
          existingKnowledge.confidence = Math.max(existingKnowledge.confidence, newKnowledge.confidence);
          existingKnowledge.relevance = Math.max(existingKnowledge.relevance, newKnowledge.relevance);
          existingKnowledge.metadata.updatedAt = new Date();
          updatedCount++;
        } else {
          // 添加新知识
          this.knowledgeBase.set(newKnowledge.id, newKnowledge);
          
          // 更新搜索索引
          this.updateSearchIndex(newKnowledge);
          addedCount++;
        }
      });
      
      this.log('info', `知识库已更新: 新增 ${addedCount} 条，更新 ${updatedCount} 条`);
    } catch (error) {
      this.log('error', `更新知识库失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 更新搜索索引
   */
  private updateSearchIndex(knowledge: Knowledge): void {
    const keywords = [
      ...knowledge.title.toLowerCase().split(' '),
      ...knowledge.description.toLowerCase().split(' '),
      ...knowledge.tags
    ].filter(word => word.length > 2);
    
    keywords.forEach(keyword => {
      if (!this.knowledgeIndex.has(keyword)) {
        this.knowledgeIndex.set(keyword, []);
      }
      
      const knowledgeIds = this.knowledgeIndex.get(keyword)!;
      if (!knowledgeIds.includes(knowledge.id)) {
        knowledgeIds.push(knowledge.id);
      }
    });
  }

  /**
   * 获取知识库统计信息
   */
  async getKnowledgeBaseStats(): Promise<{
    totalKnowledge: number;
    knowledgeByType: Record<string, number>;
    averageConfidence: number;
    averageRelevance: number;
    lastUpdated: Date;
  }> {
    const knowledge = Array.from(this.knowledgeBase.values());
    
    const knowledgeByType: Record<string, number> = {};
    knowledge.forEach(k => {
      knowledgeByType[k.type] = (knowledgeByType[k.type] || 0) + 1;
    });
    
    return {
      totalKnowledge: knowledge.length,
      knowledgeByType,
      averageConfidence: knowledge.length > 0 ? 
        knowledge.reduce((sum, k) => sum + k.confidence, 0) / knowledge.length : 0,
      averageRelevance: knowledge.length > 0 ? 
        knowledge.reduce((sum, k) => sum + k.relevance, 0) / knowledge.length : 0,
      lastUpdated: new Date()
    };
  }

  /**
   * 导出知识库
   */
  async exportKnowledgeBase(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const knowledge = Array.from(this.knowledgeBase.values());
      
      if (format === 'json') {
        return JSON.stringify(knowledge, null, 2);
      } else if (format === 'csv') {
        // 简化的 CSV 导出
        const headers = ['id', 'type', 'title', 'description', 'confidence', 'relevance', 'tags'];
        const csvLines = [headers.join(',')];
        
        knowledge.forEach(k => {
          const row = [
            k.id,
            k.type,
            `"${k.title.replace(/"/g, '\"')}"`,
            `"${k.description.replace(/"/g, '\"')}"`,
            k.confidence,
            k.relevance,
            k.tags.join(';')
          ];
          csvLines.push(row.join(','));
        });
        
        return csvLines.join('\n');
      }
      
      return '';
    } catch (error) {
      this.log('error', `导出知识库失败: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    }
  }

  /**
   * 导入知识库
   */
  async importKnowledgeBase(data: string, format: 'json' | 'csv' = 'json'): Promise<number> {
    try {
      let knowledge: Knowledge[] = [];
      
      if (format === 'json') {
        knowledge = JSON.parse(data);
      } else if (format === 'csv') {
        // 简化的 CSV 导入（实际项目中应该使用专门的 CSV 解析库）
        const lines = data.split('\n').slice(1); // 跳过标题行
        knowledge = lines.filter(line => line.trim()).map(line => {
          const values = line.split(',');
          return {
            id: values[0],
            type: values[1] as any,
            title: values[2].replace(/^"/, '').replace(/"$/, ''),
            description: values[3].replace(/^"/, '').replace(/"$/, ''),
            content: '',
            source: 'imported',
            confidence: parseFloat(values[4]),
            relevance: parseFloat(values[5]),
            tags: values[6]?.split(';') || [],
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              author: 'imported',
              version: '1.0.0'
            }
          };
        });
      }
      
      await this.updateKnowledgeBase(knowledge);
      this.log('info', `知识库导入完成: ${knowledge.length} 条知识`);
      
      return knowledge.length;
    } catch (error) {
      this.log('error', `导入知识库失败: ${error instanceof Error ? error.message : String(error)}`);
      return 0;
    }
  }

  /**
   * 清理知识库
   */
  async cleanupKnowledgeBase(): Promise<number> {
    try {
      const knowledge = Array.from(this.knowledgeBase.values());
      const expiredKnowledge = knowledge.filter(k => 
        k.confidence < this.config.minRelevance || 
        k.relevance < this.config.minRelevance
      );
      
      expiredKnowledge.forEach(k => {
        this.knowledgeBase.delete(k.id);
        
        // 清理搜索索引
        this.cleanupSearchIndex(k.id);
      });
      
      this.log('info', `知识库清理完成: 移除 ${expiredKnowledge.length} 条低质量知识`);
      return expiredKnowledge.length;
    } catch (error) {
      this.log('error', `清理知识库失败: ${error instanceof Error ? error.message : String(error)}`);
      return 0;
    }
  }

  /**
   * 清理搜索索引
   */
  private cleanupSearchIndex(knowledgeId: string): void {
    for (const [keyword, knowledgeIds] of this.knowledgeIndex.entries()) {
      const index = knowledgeIds.indexOf(knowledgeId);
      if (index !== -1) {
        knowledgeIds.splice(index, 1);
        if (knowledgeIds.length === 0) {
          this.knowledgeIndex.delete(keyword);
        }
      }
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
      console.log(`[${timestamp}] [KnowledgeTransfer] [${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * 获取配置
   */
  getConfig(): KnowledgeTransferConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<KnowledgeTransferConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', '配置已更新');
  }

  /**
   * 重置知识传递器
   */
  reset(): void {
    this.knowledgeBase.clear();
    this.knowledgeIndex.clear();
    this.log('info', '知识传递器已重置');
  }
}