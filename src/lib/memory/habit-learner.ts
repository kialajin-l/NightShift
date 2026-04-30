// NightShift 习惯学习器

import { LogEntry, UserHabit, HabitProfile, TaskContext, PreferencePrediction, HabitExample } from './memory-types';

/**
 * 习惯学习器配置
 */
export interface HabitLearnerConfig {
  minConfidence: number;
  minFrequency: number;
  enableRealTimeLearning: boolean;
  updateInterval: number; // 分钟
  databasePath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 习惯学习器
 */
export class HabitLearner {
  private config: HabitLearnerConfig;
  private habitProfiles: Map<string, HabitProfile> = new Map();
  private learningQueue: LogEntry[] = [];
  private isLearning = false;
  
  constructor(config?: Partial<HabitLearnerConfig>) {
    this.config = {
      minConfidence: 0.7,
      minFrequency: 3,
      enableRealTimeLearning: true,
      updateInterval: 60, // 1小时
      databasePath: './data/habits.db',
      logLevel: 'info',
      ...config
    };
    
    this.initializeDatabase();
    this.startLearningLoop();
  }

  /**
   * 初始化数据库
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // 在实际项目中，这里应该初始化 SQLite 数据库
      // 这里使用内存存储作为示例
      this.log('info', '习惯学习器数据库已初始化');
    } catch (error) {
      this.log('error', `数据库初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 启动学习循环
   */
  private startLearningLoop(): void {
    if (this.config.enableRealTimeLearning) {
      setInterval(() => {
        this.processLearningQueue();
      }, this.config.updateInterval * 60 * 1000);
      
      this.log('info', `学习循环已启动，间隔: ${this.config.updateInterval} 分钟`);
    }
  }

  /**
   * 分析习惯
   */
  async analyzeHabits(logs: LogEntry[]): Promise<UserHabit[]> {
    try {
      this.log('info', `开始分析 ${logs.length} 条日志中的习惯`);
      
      const habits: UserHabit[] = [];
      
      // 分析代码风格习惯
      const codeStyleHabits = await this.analyzeCodeStyleHabits(logs);
      habits.push(...codeStyleHabits);
      
      // 分析架构习惯
      const architectureHabits = await this.analyzeArchitectureHabits(logs);
      habits.push(...architectureHabits);
      
      // 分析工具使用习惯
      const toolUsageHabits = await this.analyzeToolUsageHabits(logs);
      habits.push(...toolUsageHabits);
      
      // 分析沟通习惯
      const communicationHabits = await this.analyzeCommunicationHabits(logs);
      habits.push(...communicationHabits);
      
      // 过滤低置信度和低频次习惯
      const filteredHabits = habits.filter(habit => 
        habit.confidence >= this.config.minConfidence && 
        habit.frequency >= this.config.minFrequency
      );
      
      this.log('info', `习惯分析完成: 发现 ${habits.length} 个习惯，过滤后 ${filteredHabits.length} 个`);
      
      return filteredHabits;
    } catch (error) {
      this.log('error', `分析习惯失败: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * 分析代码风格习惯
   */
  private async analyzeCodeStyleHabits(logs: LogEntry[]): Promise<UserHabit[]> {
    const habits: UserHabit[] = [];
    const codeEntries = logs.filter(log => 
      log.type === 'message' && 
      (log.data as any).metadata?.codeBlocks
    );
    
    if (codeEntries.length === 0) return habits;
    
    // 分析命名规范
    const namingHabits = this.analyzeNamingHabits(codeEntries);
    habits.push(...namingHabits);
    
    // 分析缩进风格
    const indentationHabits = this.analyzeIndentationHabits(codeEntries);
    habits.push(...indentationHabits);
    
    // 分析注释风格
    const commentHabits = this.analyzeCommentHabits(codeEntries);
    habits.push(...commentHabits);
    
    return habits;
  }

  /**
   * 分析命名规范习惯
   */
  private analyzeNamingHabits(entries: LogEntry[]): UserHabit[] {
    const habits: UserHabit[] = [];
    const namingPatterns: Record<string, number> = {};
    const namingExamples: Record<string, HabitExample[]> = {};
    
    entries.forEach(entry => {
      const message = entry.data as any;
      const codeBlocks = message.metadata?.codeBlocks || [];
      
      codeBlocks.forEach((block: any) => {
        const code = block.code;
        
        // 分析变量命名
        const variableMatches = code.matchAll(/(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
        for (const match of variableMatches) {
          const variableName = match[2];
          const style = this.analyzeNamingStyle(variableName);
          
          if (style !== 'unknown') {
            namingPatterns[style] = (namingPatterns[style] || 0) + 1;
            
            if (!namingExamples[style]) {
              namingExamples[style] = [];
            }
            
            namingExamples[style].push({
              context: '变量声明',
              code: `${match[1]} ${variableName}`,
              explanation: `使用${style}命名变量`,
              timestamp: entry.timestamp
            });
          }
        }
        
        // 分析函数命名
        const functionMatches = code.matchAll(/(function|const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g);
        for (const match of functionMatches) {
          const functionName = match[2];
          const style = this.analyzeNamingStyle(functionName);
          
          if (style !== 'unknown') {
            namingPatterns[style] = (namingPatterns[style] || 0) + 1;
            
            if (!namingExamples[style]) {
              namingExamples[style] = [];
            }
            
            namingExamples[style].push({
              context: '函数声明',
              code: `${match[1]} ${functionName} = ...`,
              explanation: `使用${style}命名函数`,
              timestamp: entry.timestamp
            });
          }
        }
      });
    });
    
    // 创建命名习惯
    Object.entries(namingPatterns).forEach(([style, frequency]) => {
      const totalVariables = Object.values(namingPatterns).reduce((sum, count) => sum + count, 0);
      const confidence = frequency / totalVariables;
      
      habits.push({
        id: `naming-${style}-${Date.now()}`,
        type: 'code-style',
        pattern: `命名规范: ${style}`,
        frequency,
        confidence,
        firstSeen: new Date(),
        lastSeen: new Date(),
        examples: namingExamples[style]?.slice(0, 5) || [],
        metadata: {
          impact: 'positive',
          category: 'naming',
          tags: ['code-style', 'naming', style]
        }
      });
    });
    
    return habits;
  }

  /**
   * 分析命名风格
   */
  private analyzeNamingStyle(name: string): string {
    if (/^[a-z][a-zA-Z0-9]*$/.test(name)) {
      return 'camelCase';
    } else if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
      return 'PascalCase';
    } else if (name.includes('_')) {
      return 'snake_case';
    } else if (name.includes('-')) {
      return 'kebab-case';
    }
    return 'unknown';
  }

  /**
   * 分析缩进风格习惯
   */
  private analyzeIndentationHabits(entries: LogEntry[]): UserHabit[] {
    const habits: UserHabit[] = [];
    const indentationPatterns: Record<string, number> = {};
    const indentationExamples: Record<string, HabitExample[]> = {};
    
    entries.forEach(entry => {
      const message = entry.data as any;
      const codeBlocks = message.metadata?.codeBlocks || [];
      
      codeBlocks.forEach((block: any) => {
        const lines = block.code.split('\n');
        
        for (const line of lines) {
          if (line.startsWith(' ')) {
            const spaceCount = line.match(/^ */)?.[0].length || 0;
            if (spaceCount > 0) {
              const style = spaceCount === 2 ? '2-spaces' : 
                           spaceCount === 4 ? '4-spaces' : 'other-spaces';
              
              indentationPatterns[style] = (indentationPatterns[style] || 0) + 1;
              
              if (!indentationExamples[style]) {
                indentationExamples[style] = [];
              }
              
              indentationExamples[style].push({
                context: '代码缩进',
                code: line,
                explanation: `使用${style}缩进`,
                timestamp: entry.timestamp
              });
            }
          } else if (line.startsWith('\t')) {
            indentationPatterns['tabs'] = (indentationPatterns['tabs'] || 0) + 1;
            
            if (!indentationExamples['tabs']) {
              indentationExamples['tabs'] = [];
            }
            
            indentationExamples['tabs'].push({
              context: '代码缩进',
              code: line,
              explanation: '使用制表符缩进',
              timestamp: entry.timestamp
            });
          }
        }
      });
    });
    
    // 创建缩进习惯
    Object.entries(indentationPatterns).forEach(([style, frequency]) => {
      const totalLines = Object.values(indentationPatterns).reduce((sum, count) => sum + count, 0);
      const confidence = frequency / totalLines;
      
      habits.push({
        id: `indentation-${style}-${Date.now()}`,
        type: 'code-style',
        pattern: `缩进风格: ${style}`,
        frequency,
        confidence,
        firstSeen: new Date(),
        lastSeen: new Date(),
        examples: indentationExamples[style]?.slice(0, 5) || [],
        metadata: {
          impact: 'positive',
          category: 'indentation',
          tags: ['code-style', 'formatting', style]
        }
      });
    });
    
    return habits;
  }

  /**
   * 分析注释风格习惯
   */
  private analyzeCommentHabits(entries: LogEntry[]): UserHabit[] {
    const habits: UserHabit[] = [];
    const commentPatterns: Record<string, number> = {};
    const commentExamples: Record<string, HabitExample[]> = {};
    
    entries.forEach(entry => {
      const message = entry.data as any;
      const codeBlocks = message.metadata?.codeBlocks || [];
      
      codeBlocks.forEach((block: any) => {
        const code = block.code;
        
        // 检测单行注释
        const singleLineComments = (code.match(/\/\/.*$/gm) || []).length;
        if (singleLineComments > 0) {
          commentPatterns['single-line'] = (commentPatterns['single-line'] || 0) + singleLineComments;
          
          if (!commentExamples['single-line']) {
            commentExamples['single-line'] = [];
          }
          
          commentExamples['single-line'].push({
            context: '代码注释',
            code: '// 这是单行注释',
            explanation: '使用单行注释风格',
            timestamp: entry.timestamp
          });
        }
        
        // 检测多行注释
        const multiLineComments = (code.match(/\/\*[\s\S]*?\*\//g) || []).length;
        if (multiLineComments > 0) {
          commentPatterns['multi-line'] = (commentPatterns['multi-line'] || 0) + multiLineComments;
          
          if (!commentExamples['multi-line']) {
            commentExamples['multi-line'] = [];
          }
          
          commentExamples['multi-line'].push({
            context: '代码注释',
            code: '/* 这是多行注释 */',
            explanation: '使用多行注释风格',
            timestamp: entry.timestamp
          });
        }
        
        // 检测 JSDoc 注释
        const jsdocComments = (code.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
        if (jsdocComments > 0) {
          commentPatterns['jsdoc'] = (commentPatterns['jsdoc'] || 0) + jsdocComments;
          
          if (!commentExamples['jsdoc']) {
            commentExamples['jsdoc'] = [];
          }
          
          commentExamples['jsdoc'].push({
            context: '代码注释',
            code: '/** 这是JSDoc注释 */',
            explanation: '使用JSDoc注释风格',
            timestamp: entry.timestamp
          });
        }
      });
    });
    
    // 创建注释习惯
    Object.entries(commentPatterns).forEach(([style, frequency]) => {
      const totalComments = Object.values(commentPatterns).reduce((sum, count) => sum + count, 0);
      const confidence = frequency / totalComments;
      
      habits.push({
        id: `comment-${style}-${Date.now()}`,
        type: 'code-style',
        pattern: `注释风格: ${style}`,
        frequency,
        confidence,
        firstSeen: new Date(),
        lastSeen: new Date(),
        examples: commentExamples[style]?.slice(0, 5) || [],
        metadata: {
          impact: 'positive',
          category: 'comment',
          tags: ['code-style', 'documentation', style]
        }
      });
    });
    
    return habits;
  }

  /**
   * 分析架构习惯
   */
  private async analyzeArchitectureHabits(logs: LogEntry[]): Promise<UserHabit[]> {
    const habits: UserHabit[] = [];
    const codeEntries = logs.filter(log => 
      log.type === 'message' && 
      (log.data as any).metadata?.codeBlocks
    );
    
    if (codeEntries.length === 0) return habits;
    
    // 分析组件化习惯
    const componentHabits = this.analyzeComponentHabits(codeEntries);
    habits.push(...componentHabits);
    
    // 分析状态管理习惯
    const stateHabits = this.analyzeStateHabits(codeEntries);
    habits.push(...stateHabits);
    
    return habits;
  }

  /**
   * 分析组件化习惯
   */
  private analyzeComponentHabits(entries: LogEntry[]): UserHabit[] {
    const habits: UserHabit[] = [];
    let componentCount = 0;
    const examples: HabitExample[] = [];
    
    entries.forEach(entry => {
      const message = entry.data as any;
      const codeBlocks = message.metadata?.codeBlocks || [];
      
      codeBlocks.forEach((block: any) => {
        const code = block.code;
        
        // 检测 React 组件
        if (code.includes('React.Component') || code.includes('function Component') || 
            code.includes('const Component') || code.includes('class Component')) {
          componentCount++;
          
          examples.push({
            context: 'React 组件',
            code: 'function MyComponent() { return <div>Hello</div>; }',
            explanation: '使用函数式组件模式',
            timestamp: entry.timestamp
          });
        }
        
        // 检测 Vue 组件
        if (code.includes('export default') && (code.includes('template') || code.includes('setup'))) {
          componentCount++;
          
          examples.push({
            context: 'Vue 组件',
            code: 'export default { template: \'<div>Hello</div>\' }',
            explanation: '使用 Vue 组件模式',
            timestamp: entry.timestamp
          });
        }
      });
    });
    
    if (componentCount > 0) {
      const totalEntries = entries.length;
      const confidence = Math.min(1, componentCount / totalEntries);
      
      habits.push({
        id: `architecture-component-${Date.now()}`,
        type: 'architecture',
        pattern: '组件化架构',
        frequency: componentCount,
        confidence,
        firstSeen: new Date(),
        lastSeen: new Date(),
        examples: examples.slice(0, 5),
        metadata: {
          impact: 'positive',
          category: 'component',
          tags: ['architecture', 'component', 'react', 'vue']
        }
      });
    }
    
    return habits;
  }

  /**
   * 分析状态管理习惯
   */
  private analyzeStateHabits(entries: LogEntry[]): UserHabit[] {
    const habits: UserHabit[] = [];
    let stateCount = 0;
    const examples: HabitExample[] = [];
    
    entries.forEach(entry => {
      const message = entry.data as any;
      const codeBlocks = message.metadata?.codeBlocks || [];
      
      codeBlocks.forEach((block: any) => {
        const code = block.code;
        
        // 检测状态管理库
        if (code.includes('useState') || code.includes('useReducer') || 
            code.includes('redux') || code.includes('mobx') || code.includes('pinia')) {
          stateCount++;
          
          examples.push({
            context: '状态管理',
            code: 'const [state, setState] = useState(initialState);',
            explanation: '使用 React Hooks 状态管理',
            timestamp: entry.timestamp
          });
        }
      });
    });
    
    if (stateCount > 0) {
      const totalEntries = entries.length;
      const confidence = Math.min(1, stateCount / totalEntries);
      
      habits.push({
        id: `architecture-state-${Date.now()}`,
        type: 'architecture',
        pattern: '状态管理模式',
        frequency: stateCount,
        confidence,
        firstSeen: new Date(),
        lastSeen: new Date(),
        examples: examples.slice(0, 5),
        metadata: {
          impact: 'positive',
          category: 'state',
          tags: ['architecture', 'state-management', 'react', 'vue']
        }
      });
    }
    
    return habits;
  }

  /**
   * 分析工具使用习惯
   */
  private async analyzeToolUsageHabits(logs: LogEntry[]): Promise<UserHabit[]> {
    const habits: UserHabit[] = [];
    const toolEntries = logs.filter(log => log.type === 'tool-call');
    
    if (toolEntries.length === 0) return habits;
    
    const toolPatterns: Record<string, number> = {};
    const toolExamples: Record<string, HabitExample[]> = {};
    
    toolEntries.forEach(entry => {
      const toolCall = entry.data as any;
      const toolName = toolCall.name;
      
      toolPatterns[toolName] = (toolPatterns[toolName] || 0) + 1;
      
      if (!toolExamples[toolName]) {
        toolExamples[toolName] = [];
      }
      
      toolExamples[toolName].push({
        context: '工具使用',
        code: `使用工具: ${toolName}`,
        explanation: `频繁使用 ${toolName} 工具`,
        timestamp: entry.timestamp
      });
    });
    
    // 创建工具使用习惯
    Object.entries(toolPatterns).forEach(([toolName, frequency]) => {
      const totalTools = Object.values(toolPatterns).reduce((sum, count) => sum + count, 0);
      const confidence = frequency / totalTools;
      
      habits.push({
        id: `tool-${toolName}-${Date.now()}`,
        type: 'tool-usage',
        pattern: `工具使用: ${toolName}`,
        frequency,
        confidence,
        firstSeen: new Date(),
        lastSeen: new Date(),
        examples: toolExamples[toolName]?.slice(0, 5) || [],
        metadata: {
          impact: 'positive',
          category: 'tool',
          tags: ['tool-usage', toolName]
        }
      });
    });
    
    return habits;
  }

  /**
   * 分析沟通习惯
   */
  private async analyzeCommunicationHabits(logs: LogEntry[]): Promise<UserHabit[]> {
    const habits: UserHabit[] = [];
    const messageEntries = logs.filter(log => log.type === 'message');
    
    if (messageEntries.length === 0) return habits;
    
    // 分析沟通风格（简化版）
    const communicationPatterns: Record<string, number> = {};
    
    messageEntries.forEach(entry => {
      const message = entry.data as any;
      const content = message.content.toLowerCase();
      
      // 检测积极沟通
      if (content.includes('感谢') || content.includes('谢谢') || content.includes('好') || content.includes('优秀')) {
        communicationPatterns['positive'] = (communicationPatterns['positive'] || 0) + 1;
      }
      
      // 检测技术术语使用
      if (content.includes('组件') || content.includes('状态') || content.includes('API') || content.includes('数据库')) {
        communicationPatterns['technical'] = (communicationPatterns['technical'] || 0) + 1;
      }
    });
    
    // 创建沟通习惯
    Object.entries(communicationPatterns).forEach(([style, frequency]) => {
      const totalMessages = messageEntries.length;
      const confidence = frequency / totalMessages;
      
      habits.push({
        id: `communication-${style}-${Date.now()}`,
        type: 'communication',
        pattern: `沟通风格: ${style}`,
        frequency,
        confidence,
        firstSeen: new Date(),
        lastSeen: new Date(),
        examples: [],
        metadata: {
          impact: 'neutral',
          category: 'communication',
          tags: ['communication', style]
        }
      });
    });
    
    return habits;
  }

  /**
   * 更新习惯配置文件
   */
  async updateHabitProfile(habits: UserHabit[]): Promise<void> {
    try {
      const userId = 'default-user'; // 在实际项目中应该从上下文获取
      
      let profile = this.habitProfiles.get(userId);
      if (!profile) {
        profile = {
          userId,
          habits: [],
          lastUpdated: new Date(),
          statistics: {
            totalHabits: 0,
            positiveHabits: 0,
            negativeHabits: 0,
            averageConfidence: 0
          }
        };
      }
      
      // 合并新习惯
      habits.forEach(newHabit => {
        const existingHabit = profile.habits.find(h => h.pattern === newHabit.pattern);
        
        if (existingHabit) {
          // 更新现有习惯
          existingHabit.frequency += newHabit.frequency;
          existingHabit.confidence = Math.max(existingHabit.confidence, newHabit.confidence);
          existingHabit.lastSeen = new Date();
          
          // 合并示例
          newHabit.examples.forEach(example => {
            if (!existingHabit.examples.some(ex => ex.code === example.code)) {
              existingHabit.examples.push(example);
            }
          });
          
          // 限制示例数量
          existingHabit.examples = existingHabit.examples.slice(0, 10);
        } else {
          // 添加新习惯
          profile.habits.push(newHabit);
        }
      });
      
      // 更新统计信息
      profile.lastUpdated = new Date();
      profile.statistics.totalHabits = profile.habits.length;
      profile.statistics.positiveHabits = profile.habits.filter(h => 
        h.metadata?.impact === 'positive'
      ).length;
      profile.statistics.negativeHabits = profile.habits.filter(h => 
        h.metadata?.impact === 'negative'
      ).length;
      profile.statistics.averageConfidence = profile.habits.length > 0
        ? profile.habits.reduce((sum, h) => sum + h.confidence, 0) / profile.habits.length
        : 0;
      
      this.habitProfiles.set(userId, profile);
      
      this.log('info', `习惯配置文件已更新: ${habits.length} 个新习惯`);
    } catch (error) {
      this.log('error', `更新习惯配置文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取习惯配置文件
   */
  async getHabitProfile(userId: string = 'default-user'): Promise<HabitProfile> {
    try {
      const profile = this.habitProfiles.get(userId);
      
      if (!profile) {
        return {
          userId,
          habits: [],
          lastUpdated: new Date(),
          statistics: {
            totalHabits: 0,
            positiveHabits: 0,
            negativeHabits: 0,
            averageConfidence: 0
          }
        };
      }
      
      this.log('debug', `获取习惯配置文件: ${userId}`);
      return profile;
    } catch (error) {
      this.log('error', `获取习惯配置文件失败: ${error instanceof Error ? error.message : String(error)}`);
      return {
        userId,
        habits: [],
        lastUpdated: new Date(),
        statistics: {
          totalHabits: 0,
          positiveHabits: 0,
          negativeHabits: 0,
          averageConfidence: 0
        }
      };
    }
  }

  /**
   * 预测偏好
   */
  async predictPreferences(context: TaskContext): Promise<PreferencePrediction[]> {
    try {
      const predictions: PreferencePrediction[] = [];
      const profile = await this.getHabitProfile();
      
      // 基于习惯预测偏好
      profile.habits.forEach(habit => {
        if (habit.confidence >= this.config.minConfidence) {
          predictions.push({
            type: habit.type,
            preference: habit.pattern,
            confidence: habit.confidence,
            reasoning: `基于 ${habit.frequency} 次观察的习惯`,
            examples: habit.examples.map(ex => ex.explanation)
          });
        }
      });
      
      this.log('debug', `生成偏好预测: ${predictions.length} 个预测`);
      return predictions;
    } catch (error) {
      this.log('error', `预测偏好失败: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * 处理学习队列
   */
  private async processLearningQueue(): Promise<void> {
    if (this.isLearning || this.learningQueue.length === 0) {
      return;
    }
    
    this.isLearning = true;
    
    try {
      const logs = [...this.learningQueue];
      this.learningQueue = [];
      
      this.log('info', `开始处理学习队列: ${logs.length} 条日志`);
      
      const habits = await this.analyzeHabits(logs);
      await this.updateHabitProfile(habits);
      
      this.log('info', '学习队列处理完成');
    } catch (error) {
      this.log('error', `处理学习队列失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isLearning = false;
    }
  }

  /**
   * 添加日志到学习队列
   */
  addToLearningQueue(logs: LogEntry[]): void {
    this.learningQueue.push(...logs);
    
    // 如果队列过大，立即处理
    if (this.learningQueue.length >= 100 && !this.isLearning) {
      setTimeout(() => this.processLearningQueue(), 0);
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
      console.log(`[${timestamp}] [HabitLearner] [${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * 获取配置
   */
  getConfig(): HabitLearnerConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<HabitLearnerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', '配置已更新');
  }

  /**
   * 重置习惯学习器
   */
  reset(): void {
    this.habitProfiles.clear();
    this.learningQueue = [];
    this.log('info', '习惯学习器已重置');
  }
}