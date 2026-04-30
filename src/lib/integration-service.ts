// NightShift 集成服务管理器

import { ConversationLogger } from './memory/conversation-logger';
import { HabitLearner } from './memory/habit-learner';
import { KnowledgeTransfer } from './memory/knowledge-transfer';
import { MemoryStore } from './memory/memory-store';
import { Message, LogEntry, TaskContext, MemorySystemConfig, ToolCall } from './memory/memory-types';
import { SchedulerIntegration } from './scheduler-integration';
import { RuleForgeIntegration } from './ruleforge-integration';
import { ErrorHandler, IntegrationError, RetryManager } from './error-handler';
import { ErrorCode, IntegrationModule } from '../types/integration';
import { getPerformanceOptimizer, PerformanceOptimizer } from './performance-optimizer';

// 为字符串添加hashCode方法
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function(): number {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

/**
 * 集成服务配置
 */
export interface IntegrationServiceConfig {
  memorySystem?: MemorySystemConfig;
  enableMemory?: boolean;
  enableRuleForge?: boolean;
  enableScheduler?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 集成服务管理器
 */
export class IntegrationService {
  private config: IntegrationServiceConfig;
  
  // 记忆体系统组件
  private conversationLogger?: ConversationLogger;
  private habitLearner?: HabitLearner;
  private knowledgeTransfer?: KnowledgeTransfer;
  private memoryStore?: MemoryStore;
  
  // 调度器集成组件
  private schedulerIntegration?: SchedulerIntegration;
  
  // RuleForge 集成组件
  private ruleForgeIntegration?: RuleForgeIntegration;
  
  // 集成状态
  private isInitialized = false;
  private currentSessionId: string | null = null;
  
  // 性能优化工具
  private performanceOptimizer: PerformanceOptimizer;

  constructor(config?: IntegrationServiceConfig, dependencies?: {
    conversationLogger?: ConversationLogger;
    habitLearner?: HabitLearner;
    knowledgeTransfer?: KnowledgeTransfer;
    memoryStore?: MemoryStore;
    ruleForgeIntegration?: RuleForgeIntegration;
    schedulerIntegration?: SchedulerIntegration;
    performanceOptimizer?: PerformanceOptimizer;
  }) {
    this.config = {
      enableMemory: true,
      enableRuleForge: true,
      enableScheduler: true,
      logLevel: 'info',
      ...config
    };

    // 初始化性能优化工具
    this.performanceOptimizer = dependencies?.performanceOptimizer || getPerformanceOptimizer();

    // 注入依赖（用于测试）
    if (dependencies) {
      this.conversationLogger = dependencies.conversationLogger;
      this.habitLearner = dependencies.habitLearner;
      this.knowledgeTransfer = dependencies.knowledgeTransfer;
      this.memoryStore = dependencies.memoryStore;
      this.ruleForgeIntegration = dependencies.ruleForgeIntegration;
      this.schedulerIntegration = dependencies.schedulerIntegration;
    }
  }

  /**
   * 初始化集成服务
   */
  async initialize(): Promise<void> {
    return await ErrorHandler.safeExecute(async () => {
      this.log('info', '开始初始化集成服务...');
      
      // 初始化记忆体系统
      if (this.config.enableMemory) {
        await this.initializeMemorySystem();
      }
      
      // 初始化 RuleForge 集成
      if (this.config.enableRuleForge) {
        await this.initializeRuleForge();
      }
      
      // 初始化任务调度系统
      if (this.config.enableScheduler) {
        await this.initializeScheduler();
      }
      
      this.isInitialized = true;
      this.log('info', '集成服务初始化完成');
      
    }, IntegrationModule.CONVERSATION_LOGGER, '集成服务初始化');
  }

  /**
   * 初始化记忆体系统
   */
  private async initializeMemorySystem(): Promise<void> {
    this.log('info', '初始化记忆体系统...');
    
    this.conversationLogger = new ConversationLogger({
      maxLogEntries: 10000,
      retentionDays: 30,
      logLevel: this.config.logLevel
    });
    
    this.habitLearner = new HabitLearner({
      minConfidence: 0.7,
      minFrequency: 3,
      logLevel: this.config.logLevel
    });
    
    this.knowledgeTransfer = new KnowledgeTransfer({
      maxRelevantKnowledge: 5,
      minRelevance: 0.3,
      logLevel: this.config.logLevel
    });
    
    this.memoryStore = new MemoryStore({
      maxShortTermMemory: 1000,
      shortTermRetentionHours: 24,
      logLevel: this.config.logLevel
    });
    
    this.log('info', '记忆体系统初始化完成');
  }

  /**
   * 初始化 RuleForge 集成
   */
  private async initializeRuleForge(): Promise<void> {
    this.log('info', '初始化 RuleForge 集成...');
    
    this.ruleForgeIntegration = new RuleForgeIntegration({
      enablePatternRecognition: true,
      enableYAMLGeneration: true,
      minConfidence: 0.7,
      logLevel: this.config.logLevel
    });
    
    await this.ruleForgeIntegration.initialize();
    
    this.log('info', 'RuleForge 集成初始化完成');
  }

  /**
   * 初始化任务调度系统
   */
  private async initializeScheduler(): Promise<void> {
    this.log('info', '初始化任务调度系统...');
    
    this.schedulerIntegration = new SchedulerIntegration({
      maxConcurrentTasks: 5,
      defaultTimeout: 300000,
      maxRetries: 3,
      enableRealTimeUpdates: true,
      logLevel: this.config.logLevel
    });
    
    await this.schedulerIntegration.initialize();
    
    this.log('info', '任务调度系统初始化完成');
  }

  /**
   * 设置当前会话
   */
  setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.log('debug', `设置当前会话: ${sessionId}`);
  }

  /**
   * 处理用户消息
   */
  async processUserMessage(message: Message): Promise<{
    enhancedContext: any;
    recommendations: string[];
    knowledgeContext: any;
  }> {
    if (!this.isInitialized) {
      throw ErrorHandler.notInitialized(IntegrationModule.CONVERSATION_LOGGER);
    }
    
    // 验证消息格式
    if (!message.id || !message.content) {
      throw ErrorHandler.invalidMessage('消息缺少必要字段', IntegrationModule.CONVERSATION_LOGGER);
    }
    
    // 检查缓存
    const cacheKey = `user_message_${message.id}`;
    const cachedResult = this.performanceOptimizer.getCache().get(cacheKey);
    
    if (cachedResult) {
      this.log('debug', `从缓存获取用户消息处理结果: ${message.id}`);
      return cachedResult;
    }
    
    return await ErrorHandler.safeExecute(async () => {
      this.log('info', `处理用户消息: ${message.id}`);
      
      // 开始性能监控
      this.performanceOptimizer.getMonitor().startTimer('processUserMessage');
      
      const result = {
        enhancedContext: {} as Record<string, any>,
        recommendations: [] as string[],
        knowledgeContext: {}
      };
      
      // 记录消息到对话日志
      if (this.conversationLogger) {
        await this.conversationLogger.logMessage(message);
      }
      
      // 分析用户习惯和偏好
      if (this.habitLearner && this.currentSessionId) {
        const logs = await this.conversationLogger?.getConversationHistory({
          sessionId: this.currentSessionId,
          limit: 50
        }) || [];
        
        const habits = await this.habitLearner.analyzeHabits(logs);
        const taskContext = this.extractTaskContext(message);
        const preferences = await this.habitLearner.predictPreferences(taskContext);
        
        result.enhancedContext.habits = habits;
        result.enhancedContext.preferences = preferences;
        result.recommendations.push(...preferences.map(p => p.preference));
      }
      
      // 提取和传递相关知识
      if (this.knowledgeTransfer && this.currentSessionId) {
        const logs = await this.conversationLogger?.getConversationHistory({
          sessionId: this.currentSessionId,
          limit: 100
        }) || [];
        
        const knowledge = await this.knowledgeTransfer.extractKnowledge(logs);
        await this.knowledgeTransfer.updateKnowledgeBase(knowledge);
        
        const taskContext = this.extractTaskContext(message);
        const knowledgeContext = await this.knowledgeTransfer.transferKnowledge(taskContext, {});
        
        result.knowledgeContext = knowledgeContext;
        result.recommendations.push(...knowledgeContext.recommendations);
      }
      
      // 存储短期记忆
      if (this.memoryStore && this.currentSessionId) {
        await this.memoryStore.storeShortTermMemory({
          sessionId: this.currentSessionId,
          content: {
            message: message.content,
            enhancedContext: result.enhancedContext,
            knowledgeContext: result.knowledgeContext
          },
          timestamp: new Date(),
          importance: 'high'
        });
      }
      
      // 缓存结果
      this.performanceOptimizer.getCache().set(cacheKey, result);
      
      // 结束性能监控
      const duration = this.performanceOptimizer.getMonitor().endTimer('processUserMessage');
      this.log('info', `用户消息处理完成: ${message.id} (耗时: ${duration.toFixed(2)}ms)`);
      
      return result;
      
    }, IntegrationModule.CONVERSATION_LOGGER, '用户消息处理', { messageId: message.id });
  }

  /**
   * 处理 AI 响应消息
   */
  async processAIResponse(message: Message, originalMessage: Message): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('集成服务未初始化');
    }
    
    try {
      this.log('info', `处理 AI 响应消息: ${message.id}`);
      
      // 记录 AI 响应
      if (this.conversationLogger) {
        await this.conversationLogger.logMessage(message);
      }
      
      // 分析 AI 响应的成功模式
      if (this.knowledgeTransfer) {
        const logs = await this.conversationLogger?.getConversationHistory({
          sessionId: this.currentSessionId || 'default',
          limit: 10
        }) || [];
        
        const knowledge = await this.knowledgeTransfer.extractKnowledge(logs);
        await this.knowledgeTransfer.updateKnowledgeBase(knowledge);
      }
      
      // 存储工作记忆
      if (this.memoryStore && this.currentSessionId) {
        await this.memoryStore.storeWorkingMemory({
          sessionId: this.currentSessionId,
          currentTask: originalMessage.content.substring(0, 50) + '...',
          context: {
            originalMessage: originalMessage.content,
            aiResponse: message.content
          },
          activeKnowledge: [],
          recentActions: ['ai_response'],
          timestamp: new Date()
        });
      }
      
      this.log('info', `AI 响应消息处理完成: ${message.id}`);
      
    } catch (error) {
      this.log('error', `处理 AI 响应消息失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 提取任务上下文
   */
  private extractTaskContext(message: Message): TaskContext {
    const content = message.content.toLowerCase();
    
    // 简单的任务类型检测
    let taskType: 'frontend' | 'backend' | 'testing' | 'documentation' = 'frontend';
    if (content.includes('后端') || content.includes('api') || content.includes('server')) {
      taskType = 'backend';
    } else if (content.includes('测试') || content.includes('test')) {
      taskType = 'testing';
    } else if (content.includes('文档') || content.includes('document')) {
      taskType = 'documentation';
    }
    
    // 技术栈检测
    const technologyStack: string[] = [];
    if (content.includes('react') || content.includes('前端')) {
      technologyStack.push('react');
    }
    if (content.includes('typescript') || content.includes('ts')) {
      technologyStack.push('typescript');
    }
    if (content.includes('node') || content.includes('后端')) {
      technologyStack.push('nodejs');
    }
    
    // 复杂度检测
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    if (content.includes('简单') || content.includes('基础')) {
      complexity = 'low';
    } else if (content.includes('复杂') || content.includes('高级')) {
      complexity = 'high';
    }
    
    return {
      taskId: message.id,
      taskType,
      technologyStack,
      complexity,
      requirements: [message.content],
      constraints: []
    };
  }

  /**
   * 分解任务需求
   */
  async decomposeTask(requirement: string): Promise<any> {
    if (!this.isInitialized || !this.schedulerIntegration) {
      throw ErrorHandler.notInitialized(IntegrationModule.SCHEDULER_INTEGRATION);
    }
    
    // 验证任务需求
    if (!requirement || requirement.trim().length === 0) {
      throw ErrorHandler.invalidMessage('任务需求不能为空', IntegrationModule.SCHEDULER_INTEGRATION);
    }
    
    const scheduler = this.schedulerIntegration;
    return await ErrorHandler.safeExecute(async () => {
      this.log('info', `分解任务需求: ${requirement.substring(0, 50)}...`);
      
      const result = await scheduler.decomposeTask(requirement);
      
      // 记录任务分解到记忆体系统
      if (this.conversationLogger && this.currentSessionId) {
        const logEntry: LogEntry = {
          id: `task-decomposition-${Date.now()}`,
          type: 'tool-call',
          timestamp: new Date(),
          data: {
            name: 'task-decomposition',
            arguments: { requirement },
            result: result,
            success: true
          },
          sessionId: this.currentSessionId,
          userId: 'system',
          projectId: 'default',
          tags: ['task', 'decomposition', 'scheduler']
        };
        
        await this.conversationLogger.logMessage({
          id: `log-${Date.now()}`,
          role: 'system',
          content: `任务分解完成: ${result.tasks.length} 个子任务`,
          timestamp: new Date(),
          metadata: {
            toolCalls: [logEntry.data as ToolCall]
          }
        });
      }
      
      this.log('info', `任务分解完成: ${result.tasks.length} 个子任务`);
      return result;
      
    }, IntegrationModule.SCHEDULER_INTEGRATION, '任务分解', { 
      requirementLength: requirement.length 
    });
  }

  /**
   * 调度任务执行
   */
  async scheduleTasks(dag: any): Promise<any> {
    if (!this.isInitialized || !this.schedulerIntegration) {
      throw ErrorHandler.notInitialized(IntegrationModule.SCHEDULER_INTEGRATION);
    }
    
    // 验证任务DAG
    if (!dag || !dag.tasks || !Array.isArray(dag.tasks)) {
      throw ErrorHandler.invalidMessage('无效的任务DAG格式', IntegrationModule.SCHEDULER_INTEGRATION);
    }
    
    // 检查缓存
    const cacheKey = `schedule_tasks_${JSON.stringify(dag).hashCode()}`;
    const cachedResult = this.performanceOptimizer.getCache().get(cacheKey);
    
    if (cachedResult) {
      this.log('debug', `从缓存获取任务调度结果`);
      return cachedResult;
    }
    
    const scheduler = this.schedulerIntegration;
    return await ErrorHandler.safeExecute(async () => {
      this.log('info', `调度任务: ${dag.tasks.length} 个任务`);
      
      // 开始性能监控
      this.performanceOptimizer.getMonitor().startTimer('scheduleTasks');
      
      const result = await scheduler.scheduleTasks(dag);
      
      // 缓存结果
      this.performanceOptimizer.getCache().set(cacheKey, result);
      
      // 记录任务调度到记忆体系统
      if (this.conversationLogger && this.currentSessionId) {
        const logEntry: LogEntry = {
          id: `task-scheduling-${Date.now()}`,
          type: 'tool-call',
          timestamp: new Date(),
          data: {
            name: 'task-scheduling',
            arguments: { dag },
            result: result,
            success: true
          },
          sessionId: this.currentSessionId,
          userId: 'system',
          projectId: 'default',
          tags: ['task', 'scheduling', 'scheduler']
        };
        
        await this.conversationLogger.logMessage({
          id: `log-${Date.now()}`,
          role: 'system',
          content: `任务调度完成: ${result.totalTasks} 个任务已安排`,
          timestamp: new Date(),
          metadata: {
            toolCalls: [logEntry.data as ToolCall]
          }
        });
      }
      
      // 结束性能监控
      const duration = this.performanceOptimizer.getMonitor().endTimer('scheduleTasks');
      this.log('info', `任务调度完成: ${result.totalTasks} 个任务已安排 (耗时: ${duration.toFixed(2)}ms)`);
      
      return result;
      
    }, IntegrationModule.SCHEDULER_INTEGRATION, '任务调度', { 
      taskCount: dag.tasks.length 
    });
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId: string): Promise<any> {
    if (!this.isInitialized || !this.schedulerIntegration) {
      throw ErrorHandler.notInitialized(IntegrationModule.SCHEDULER_INTEGRATION);
    }
    
    const scheduler = this.schedulerIntegration;
    return await ErrorHandler.safeExecute(
      () => scheduler.getTaskStatus(taskId),
      IntegrationModule.SCHEDULER_INTEGRATION,
      '获取任务状态',
      { taskId }
    );
  }

  /**
   * 获取所有任务状态
   */
  async getAllTaskStatus(): Promise<any[]> {
    if (!this.isInitialized || !this.schedulerIntegration) {
      throw ErrorHandler.notInitialized(IntegrationModule.SCHEDULER_INTEGRATION);
    }
    
    const scheduler = this.schedulerIntegration;
    return await ErrorHandler.safeExecute(
      () => scheduler.getAllTaskStatus(),
      IntegrationModule.SCHEDULER_INTEGRATION,
      '获取所有任务状态'
    );
  }

  /**
   * 获取调度器统计信息
   */
  async getSchedulerStats(): Promise<any> {
    if (!this.isInitialized || !this.schedulerIntegration) {
      throw ErrorHandler.notInitialized(IntegrationModule.SCHEDULER_INTEGRATION);
    }
    
    const scheduler = this.schedulerIntegration;
    return await ErrorHandler.safeExecute(
      () => scheduler.getSchedulerStats(),
      IntegrationModule.SCHEDULER_INTEGRATION,
      '获取调度器统计信息'
    );
  }

  /**
   * 提取规则模式
   */
  async extractRules(sessionData: any): Promise<any> {
    if (!this.isInitialized || !this.ruleForgeIntegration) {
      throw ErrorHandler.notInitialized(IntegrationModule.RULEFORGE_INTEGRATION);
    }
    
    // 验证会话数据
    if (!sessionData || typeof sessionData !== 'object') {
      throw ErrorHandler.invalidMessage('无效的会话数据格式', IntegrationModule.RULEFORGE_INTEGRATION);
    }
    
    // 检查缓存
    const cacheKey = `extract_rules_${JSON.stringify(sessionData).hashCode()}`;
    const cachedResult = this.performanceOptimizer.getCache().get(cacheKey);
    
    if (cachedResult) {
      this.log('debug', `从缓存获取规则提取结果`);
      return cachedResult;
    }
    
    const ruleForge = this.ruleForgeIntegration;
    return await ErrorHandler.safeExecute(async () => {
      this.log('info', '开始提取规则模式...');
      
      // 开始性能监控
      this.performanceOptimizer.getMonitor().startTimer('extractRules');
      
      const result = await ruleForge.extractRulesFromSession(sessionData);
      
      // 缓存结果
      this.performanceOptimizer.getCache().set(cacheKey, result);
      
      // 结束性能监控
      const duration = this.performanceOptimizer.getMonitor().endTimer('extractRules');
      this.log('info', `规则提取完成: ${result.totalPatterns} 个模式 (耗时: ${duration.toFixed(2)}ms)`);
      
      return result;
      
    }, IntegrationModule.RULEFORGE_INTEGRATION, '规则提取', { 
      sessionDataType: typeof sessionData 
    });
  }

  /**
   * 批量提取规则
   */
  async extractRulesBatch(sessionsData: any[]): Promise<any[]> {
    if (!this.isInitialized || !this.ruleForgeIntegration) {
      throw ErrorHandler.notInitialized(IntegrationModule.RULEFORGE_INTEGRATION);
    }
    
    // 验证会话数据数组
    if (!Array.isArray(sessionsData)) {
      throw ErrorHandler.invalidMessage('会话数据必须是数组', IntegrationModule.RULEFORGE_INTEGRATION);
    }
    
    const ruleForge = this.ruleForgeIntegration;
    return await ErrorHandler.safeExecute(async () => {
      this.log('info', `开始批量提取规则: ${sessionsData.length} 个会话`);
      
      const results = await ruleForge.extractRulesFromAllSessions(sessionsData);
      
      this.log('info', `批量规则提取完成: ${results.length} 个会话处理完成`);
      
      return results;
      
    }, IntegrationModule.RULEFORGE_INTEGRATION, '批量规则提取', { 
      sessionCount: sessionsData.length 
    });
  }

  /**
   * 生成 YAML 规则文件
   */
  async generateYAMLRules(patterns: any[]): Promise<string> {
    if (!this.isInitialized || !this.ruleForgeIntegration) {
      throw ErrorHandler.notInitialized(IntegrationModule.RULEFORGE_INTEGRATION);
    }
    
    // 验证模式数组
    if (!Array.isArray(patterns)) {
      throw ErrorHandler.invalidMessage('模式数据必须是数组', IntegrationModule.RULEFORGE_INTEGRATION);
    }
    
    const ruleForge = this.ruleForgeIntegration;
    return await ErrorHandler.safeExecute(async () => {
      this.log('info', `生成 YAML 规则文件: ${patterns.length} 个模式`);
      
      const yamlContent = await ruleForge.generateYAMLRules(patterns);
      
      this.log('info', 'YAML 规则文件生成完成');
      
      return yamlContent;
      
    }, IntegrationModule.RULEFORGE_INTEGRATION, '生成YAML规则', { 
      patternCount: patterns.length 
    });
  }
  /**
   * 注入规则到代码
   */
  async injectRulesToCode(code: string, patterns: any[]): Promise<any> {
    if (!this.isInitialized || !this.ruleForgeIntegration) {
      throw ErrorHandler.notInitialized(IntegrationModule.RULEFORGE_INTEGRATION);
    }
    
    // 验证代码和模式
    if (!code || typeof code !== 'string') {
      throw ErrorHandler.invalidMessage('代码不能为空', IntegrationModule.RULEFORGE_INTEGRATION);
    }
    
    if (!Array.isArray(patterns)) {
      throw ErrorHandler.invalidMessage('模式数据必须是数组', IntegrationModule.RULEFORGE_INTEGRATION);
    }
    
    const ruleForge = this.ruleForgeIntegration;
    return await ErrorHandler.safeExecute(async () => {
      this.log('info', '开始规则注入到代码...');
      
      const result = await ruleForge.injectRulesToCode(code, patterns);
      
      this.log('info', `规则注入完成: 应用了 ${result.appliedRules.length} 个规则`);
      
      return result;
      
    }, IntegrationModule.RULEFORGE_INTEGRATION, '规则注入', { 
      codeLength: code.length,
      patternCount: patterns.length 
    });
  }

  /**
   * 获取规则统计信息
   */
  async getRuleStats(patterns: any[]): Promise<any> {
    if (!this.isInitialized || !this.ruleForgeIntegration) {
      throw ErrorHandler.notInitialized(IntegrationModule.RULEFORGE_INTEGRATION);
    }
    
    // 验证模式数组
    if (!Array.isArray(patterns)) {
      throw ErrorHandler.invalidMessage('模式数据必须是数组', IntegrationModule.RULEFORGE_INTEGRATION);
    }
    
    const ruleForge = this.ruleForgeIntegration;
    return await ErrorHandler.safeExecute(async () => {
      this.log('info', '生成规则统计信息...');
      
      const stats = await ruleForge.getRuleStats(patterns);
      
      this.log('info', '规则统计信息生成完成');
      
      return stats;
      
    }, IntegrationModule.RULEFORGE_INTEGRATION, '获取规则统计', { 
      patternCount: patterns.length 
    });
  }

  /**
   * 获取集成状态
   */
  getIntegrationStatus(): {
    memorySystem: boolean;
    ruleForge: boolean;
    scheduler: boolean;
    isInitialized: boolean;
  } {
    return {
      memorySystem: !!this.conversationLogger,
      ruleForge: !!this.ruleForgeIntegration,
      scheduler: !!this.schedulerIntegration,
      isInitialized: this.isInitialized
    };
  }

  /**
   * 获取记忆体系统统计信息
   */
  async getMemoryStats(): Promise<any> {
    if (!this.isInitialized || !this.memoryStore) {
      return null;
    }
    
    try {
      const stats = await this.memoryStore.getMemoryStats();
      
      if (this.conversationLogger) {
        const logStats = await this.conversationLogger.getStats();
        stats.logStats = logStats;
      }
      
      if (this.knowledgeTransfer) {
        const knowledgeStats = await this.knowledgeTransfer.getKnowledgeBaseStats();
        stats.knowledgeStats = knowledgeStats;
      }
      
      return stats;
    } catch (error) {
      this.log('error', `获取记忆统计失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * 导出集成数据
   */
  async exportIntegrationData(): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('集成服务未初始化');
    }
    
    try {
      const exportData: any = {};
      
      // 导出记忆数据
      if (this.memoryStore) {
        exportData.memoryData = await this.memoryStore.exportMemoryData();
      }
      
      // 导出知识库数据
      if (this.knowledgeTransfer) {
        exportData.knowledgeData = await this.knowledgeTransfer.exportKnowledgeBase();
      }
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      this.log('error', `导出集成数据失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 获取集成服务性能报告
   */
  getPerformanceReport(): any {
    if (!this.isInitialized) {
      throw ErrorHandler.notInitialized(IntegrationModule.CONVERSATION_LOGGER);
    }
    
    return this.performanceOptimizer.getPerformanceReport();
  }

  /**
   * 获取系统内存使用统计（注意：与上面的记忆体统计不同）
   */
  async getSystemMemoryStats(): Promise<{
    totalMemory: number;
    usedMemory: number;
    freeMemory: number;
    memoryUsagePercentage: number;
  }> {
    if (!this.isInitialized) {
      throw ErrorHandler.notInitialized(IntegrationModule.CONVERSATION_LOGGER);
    }
    
    return await ErrorHandler.safeExecute(async () => {
      // 模拟内存统计
      const totalMemory = 1024 * 1024 * 1024; // 1GB
      const usedMemory = Math.floor(Math.random() * totalMemory * 0.5);
      const freeMemory = totalMemory - usedMemory;
      const memoryUsagePercentage = (usedMemory / totalMemory) * 100;
      
      return {
        totalMemory,
        usedMemory,
        freeMemory,
        memoryUsagePercentage
      };
      
    }, IntegrationModule.CONVERSATION_LOGGER, '获取内存统计');
  }

  /**
   * 重置集成服务
   */
  async reset(): Promise<void> {
    await ErrorHandler.safeExecute(async () => {
      this.log('info', '重置集成服务');
      
      // 重置各个模块
      if (this.conversationLogger) {
        await this.conversationLogger.reset();
      }
      
      if (this.habitLearner) {
        await this.habitLearner.reset();
      }
      
      if (this.knowledgeTransfer) {
        await this.knowledgeTransfer.reset();
      }
      
      if (this.memoryStore) {
        await this.memoryStore.reset();
      }
      
      if (this.ruleForgeIntegration) {
        await this.ruleForgeIntegration.reset();
      }
      
      if (this.schedulerIntegration) {
        await this.schedulerIntegration.reset();
      }
      
      // 重置性能数据
      this.performanceOptimizer.reset();
      
      // 重置状态
      this.isInitialized = false;
      this.currentSessionId = null;
      
      this.log('info', '集成服务重置完成');
      
    }, IntegrationModule.CONVERSATION_LOGGER, '重置集成服务');
  }

  /**
   * 日志记录
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const logLevel = this.config.logLevel || 'info';
    const configLevel = levels[logLevel as keyof typeof levels] || 1;
    
    if (levels[level] >= configLevel) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [IntegrationService] [${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * 获取配置
   */
  getConfig(): IntegrationServiceConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<IntegrationServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', '集成服务配置已更新');
  }
}