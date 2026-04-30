/**
 * 任务完成→规则提取的事件桥接
 * 监听任务完成事件，自动提取开发规则
 */

import { Task, TaskOutput } from './types/task-types';
import { MessageBus, MessageTypes } from './message-bus';

// 临时类型定义，避免找不到模块
interface RuleExtractor {
  extractFromFiles(files: string[]): Promise<any>;
}

interface YAMLValidator {
  validateRules(rules: any[]): any;
  validateRule(rule: any): { isValid: boolean };
}

interface TaskRuleBridgeConfig {
  ruleExtractor?: RuleExtractor;
  yamlValidator?: YAMLValidator;
  messageBus?: MessageBus;
  enableAutoExtraction?: boolean;
  minTaskCount?: number;
  extractionThreshold?: number;
}

interface ExtractionEvent {
  taskId: string;
  taskName: string;
  taskType: string;
  generatedCode?: string;
  extractionResult: any;
  timestamp: Date;
}

interface BridgeStatus {
  isActive: boolean;
  totalEventsProcessed: number;
  successfulExtractions: number;
  failedExtractions: number;
  lastExtractionTime?: Date;
}

export class TaskRuleBridge {
  private ruleExtractor: RuleExtractor;
  private yamlValidator: YAMLValidator;
  private messageBus: MessageBus;
  private config: Required<TaskRuleBridgeConfig>;
  private status: BridgeStatus;
  private extractionHistory: ExtractionEvent[];
  private logger: Console;

  constructor(config: TaskRuleBridgeConfig = {}) {
    this.ruleExtractor = config.ruleExtractor || { extractFromFiles: async () => ({ rules: [] }) };
    this.yamlValidator = config.yamlValidator || { validateRules: () => ({}), validateRule: () => ({ isValid: true }) };
    this.messageBus = config.messageBus || new MessageBus();
    
    this.config = {
      ruleExtractor: this.ruleExtractor,
      yamlValidator: this.yamlValidator,
      messageBus: this.messageBus,
      enableAutoExtraction: config.enableAutoExtraction ?? true,
      minTaskCount: config.minTaskCount ?? 3,
      extractionThreshold: config.extractionThreshold ?? 0.7
    };

    this.status = {
      isActive: false,
      totalEventsProcessed: 0,
      successfulExtractions: 0,
      failedExtractions: 0
    };

    this.extractionHistory = [];
    this.logger = console;

    this.initializeEventHandlers();
  }

  /**
   * 初始化事件处理器
   */
  private initializeEventHandlers(): void {
    if (this.config.enableAutoExtraction) {
      // 监听任务完成事件
      this.messageBus.subscribe(
        'task-rule-bridge',
        [MessageTypes.TASK_COMPLETED],
        (message: any) => {
          this.handleTaskCompleted(message.payload);
        }
      );

      // 监听任务失败事件（用于学习）
      this.messageBus.subscribe(
        'task-rule-bridge',
        [MessageTypes.TASK_FAILED],
        (message: any) => {
          this.handleTaskFailed(message.payload);
        }
      );

      this.status.isActive = true;
      this.logger.log('[TaskRuleBridge] 事件桥接已启动');
    }
  }

  /**
   * 处理任务完成事件
   */
  private async handleTaskCompleted(payload: any): Promise<void> {
    const { task, output } = payload;
    
    this.status.totalEventsProcessed++;
    
    try {
      this.logger.log(`[TaskRuleBridge] 处理任务完成事件: ${task.name}`);

      // 检查是否满足提取条件
      if (this.shouldExtractRules(task, output)) {
        const extractionResult = await this.extractRulesFromTask(task, output);
        
        if (extractionResult.success) {
          this.status.successfulExtractions++;
          this.status.lastExtractionTime = new Date();
          
          // 记录提取事件
          this.recordExtractionEvent(task, output, extractionResult);
          
          // 发布规则提取完成事件
          this.publishRuleExtractionEvent(extractionResult);
          
          this.logger.log(`[TaskRuleBridge] 规则提取成功: ${extractionResult.rules.length} 个规则`);
        } else {
          this.status.failedExtractions++;
          this.logger.warn('[TaskRuleBridge] 规则提取失败');
        }
      }

    } catch (error) {
      this.status.failedExtractions++;
      this.logger.error('[TaskRuleBridge] 处理任务完成事件失败:', error);
    }
  }

  /**
   * 处理任务失败事件
   */
  private async handleTaskFailed(payload: any): Promise<void> {
    const { task, error } = payload;
    
    this.logger.log(`[TaskRuleBridge] 处理任务失败事件: ${task.name}`);
    
    // 从失败任务中学习，避免重复错误
    await this.learnFromFailure(task, error);
  }

  /**
   * 判断是否应该提取规则
   */
  private shouldExtractRules(task: Task, output: TaskOutput): boolean {
    // 检查任务类型
    if (!this.isEligibleTaskType(task.type)) {
      return false;
    }

    // 检查输出质量
    if (output.analysis?.quality && output.analysis.quality < 60) {
      return false;
    }

    // 检查是否有生成的代码
    if (!output.generatedCode) {
      return false;
    }

    // 检查历史记录，避免重复提取
    const recentExtractions = this.getRecentExtractions(24); // 24小时内
    if (recentExtractions.some(event => event.taskName === task.name)) {
      return false;
    }

    return true;
  }

  /**
   * 检查任务类型是否适合提取规则
   */
  private isEligibleTaskType(taskType: string): boolean {
    const eligibleTypes = [
      'component_generation',
      'api_implementation', 
      'database_design',
      'authentication_setup'
    ];
    
    return eligibleTypes.includes(taskType);
  }

  /**
   * 从任务中提取规则
   */
  private async extractRulesFromTask(task: Task, output: TaskOutput): Promise<any> {
    // 创建临时文件用于分析
    const tempFiles = this.createTempFiles(task, output);
    
    // 使用RuleExtractor提取规则
    const extractionResult = await this.ruleExtractor.extractFromFiles(tempFiles);
    
    // 验证提取的规则
    const validationResult = this.yamlValidator.validateRules(extractionResult.rules);
    
    return {
      ...extractionResult,
      validation: validationResult,
      taskContext: {
        taskId: task.id,
        taskName: task.name,
        taskType: task.type
      }
    };
  }

  /**
   * 创建临时分析文件
   */
  private createTempFiles(task: Task, output: TaskOutput): string[] {
    const files: string[] = [];
    
    // 主代码文件
    if (output.generatedCode) {
      const fileName = this.generateFileName(task, 'code');
      files.push(fileName);
      // 这里应该实际创建文件，暂时返回文件名
    }

    // 测试文件
    if (output.testCases && output.testCases.length > 0) {
      const testFileName = this.generateFileName(task, 'test');
      files.push(testFileName);
    }

    // 配置文件（如果有）
    if (output.documentation) {
      const configFileName = this.generateFileName(task, 'config');
      files.push(configFileName);
    }

    return files;
  }

  /**
   * 生成文件名
   */
  private generateFileName(task: Task, type: string): string {
    const timestamp = Date.now();
    return `/tmp/${task.id}_${type}_${timestamp}.${this.getFileExtension(task)}`;
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(task: Task): string {
    const techStack = task.technology;
    
    if (techStack?.frontend?.framework === 'vue') return 'vue';
    if (techStack?.frontend?.framework === 'react') return 'jsx';
    if (techStack?.backend?.language === 'python') return 'py';
    if (techStack?.backend?.language === 'javascript') return 'js';
    
    return 'txt';
  }

  /**
   * 记录提取事件
   */
  private recordExtractionEvent(task: Task, output: TaskOutput, extractionResult: any): void {
    const event: ExtractionEvent = {
      taskId: task.id,
      taskName: task.name,
      taskType: task.type,
      generatedCode: output.generatedCode,
      extractionResult,
      timestamp: new Date()
    };

    this.extractionHistory.push(event);
    
    // 限制历史记录大小
    if (this.extractionHistory.length > 100) {
      this.extractionHistory = this.extractionHistory.slice(-100);
    }
  }

  /**
   * 发布规则提取事件
   */
  private publishRuleExtractionEvent(extractionResult: any): void {
    this.messageBus.publishMessage(
      'rule:extracted',
      {
        rules: extractionResult.rules,
        confidence: extractionResult.confidence,
        taskContext: extractionResult.taskContext
      },
      'task-rule-bridge'
    );
  }

  /**
   * 从失败中学习
   */
  private async learnFromFailure(task: Task, error: any): Promise<void> {
    // 分析失败原因，生成避免类似错误的规则
    const failurePattern = this.analyzeFailurePattern(task, error);
    
    if (failurePattern) {
      const preventionRule = this.createPreventionRule(failurePattern, task);
      
      // 验证规则
      const validation = this.yamlValidator.validateRule(preventionRule);
      
      if (validation.isValid) {
        this.publishRuleExtractionEvent({
          rules: [preventionRule],
          confidence: 0.8, // 失败学习规则有较高置信度
          taskContext: {
            taskId: task.id,
            taskName: task.name,
            taskType: 'failure_analysis'
          }
        });
        
        this.logger.log('[TaskRuleBridge] 从失败中学习生成预防规则');
      }
    }
  }

  /**
   * 分析失败模式
   */
  private analyzeFailurePattern(task: Task, error: any): any {
    // 简化的失败模式分析
    return {
      errorType: error?.type || 'unknown',
      errorMessage: error?.message || '未知错误',
      taskCharacteristics: {
        type: task.type,
        complexity: task.analysis?.complexity || 'medium',
        technology: task.technology
      }
    };
  }

  /**
   * 创建预防规则
   */
  private createPreventionRule(failurePattern: any, task: Task): any {
    return {
      meta: {
        id: `prevention_${task.id}_${Date.now()}`,
        name: `避免${failurePattern.errorType}错误`,
        version: '1.0.0',
        description: `预防在${task.type}任务中出现的${failurePattern.errorType}错误`,
        author: 'TaskRuleBridge',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      },
      rule: {
        trigger: {
          type: 'code_pattern',
          pattern: this.generatePreventionPattern(failurePattern),
          language: this.detectLanguageFromTask(task)
        },
        condition: {
          context: [task.type, failurePattern.errorType],
          constraints: []
        },
        suggestion: {
          message: `检测到可能导致${failurePattern.errorType}错误的模式`,
          fix: failurePattern.errorMessage,
          examples: [{
            before: '可能导致错误的代码模式',
            after: '改进后的安全模式',
            explanation: failurePattern.errorMessage
          }],
          priority: 'high'
        }
      },
      compatibility: {
        engines: ['node>=14'],
        platforms: this.detectPlatformsFromTask(task),
        dependencies: []
      }
    };
  }

  /**
   * 生成预防模式
   */
  private generatePreventionPattern(failurePattern: any): string {
    // 基于错误类型生成检测模式
    switch (failurePattern.errorType) {
      case 'syntax_error':
        return '.*(missing|unexpected|expected).*';
      case 'type_error':
        return '.*(undefined|null).*';
      case 'reference_error':
        return '.*is not defined.*';
      default:
        return '.*error.*';
    }
  }

  /**
   * 从任务检测语言
   */
  private detectLanguageFromTask(task: Task): string {
    if (task.technology?.frontend?.language) {
      return task.technology.frontend.language;
    }
    if (task.technology?.backend?.language) {
      return task.technology.backend.language;
    }
    return 'javascript';
  }

  /**
   * 从任务检测平台
   */
  private detectPlatformsFromTask(task: Task): string[] {
    const platforms = ['node'];
    
    if (task.technology?.frontend) {
      platforms.push('browser');
    }
    
    if (task.technology?.backend) {
      platforms.push('server');
    }
    
    return platforms;
  }

  /**
   * 获取最近的提取事件
   */
  private getRecentExtractions(hours: number): ExtractionEvent[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.extractionHistory.filter(event => event.timestamp > cutoffTime);
  }

  /**
   * 手动触发规则提取
   */
  async manualExtract(tasks: Task[], outputs: TaskOutput[]): Promise<any> {
    this.logger.log('[TaskRuleBridge] 手动触发规则提取');
    
    const extractionResults = [];
    
    for (let i = 0; i < tasks.length; i++) {
      if (outputs[i]?.success) {
        const result = await this.extractRulesFromTask(tasks[i], outputs[i]);
        extractionResults.push(result);
      }
    }
    
    return {
      totalTasks: tasks.length,
      extractedTasks: extractionResults.length,
      results: extractionResults
    };
  }

  /**
   * 获取桥接状态
   */
  getStatus(): BridgeStatus {
    return { ...this.status };
  }

  /**
   * 获取提取历史
   */
  getExtractionHistory(): ExtractionEvent[] {
    return [...this.extractionHistory];
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    this.extractionHistory = [];
    this.logger.log('[TaskRuleBridge] 历史记录已清空');
  }

  /**
   * 停止事件监听
   */
  stop(): void {
    this.messageBus.unsubscribe('task-rule-bridge');
    this.status.isActive = false;
    this.logger.log('[TaskRuleBridge] 事件桥接已停止');
  }

  /**
   * 重新启动事件监听
   */
  start(): void {
    this.initializeEventHandlers();
    this.logger.log('[TaskRuleBridge] 事件桥接已启动');
  }
}

// 导出单例实例
export const taskRuleBridge = new TaskRuleBridge();

export default TaskRuleBridge;