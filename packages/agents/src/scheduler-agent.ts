/**
 * 调度 Agent - 负责任务调度和协调
 */

import { BaseAgent } from './base-agent';
import { Task, TaskType, TaskPriority, AgentResult, ValidationResult, ExecutionContext, ExecutionResult, SkillManager, ModelRouter } from './types/agent';

/**
 * 调度 Agent 配置
 */
export interface SchedulerAgentConfig {
  maxConcurrentTasks: number;
  defaultTimeout: number;
  enableRetry: boolean;
  maxRetries: number;
}

/**
 * 调度 Agent
 */
export class SchedulerAgent extends BaseAgent {
  private schedulerConfig: SchedulerAgentConfig;
  private taskQueue: Task[] = [];
  private runningTasks: Map<string, Task> = new Map();

  constructor(config: Partial<SchedulerAgentConfig> = {}) {
    // 创建模拟的skillManager和modelRouter
    const mockSkillManager: SkillManager = {
      registerSkill: () => {},
      unregisterSkill: () => {},
      findSkills: () => [],
      getSkill: () => null,
      composeSkills: () => ({
        id: 'composite',
        name: 'composite',
        skills: [],
        execute: async () => ({ success: true, result: {}, metadata: { executionTime: 0 } })
      })
    };

    const mockModelRouter: ModelRouter = {
      route: () => 'ollama/qwen-coder:7b',
      getModelInfo: () => ({
        name: 'ollama/qwen-coder:7b',
        provider: 'ollama',
        capabilities: [],
        costPerToken: 0,
        maxTokens: 4000,
        supportedLanguages: []
      }),
      trackPerformance: () => {}
    };

    super(
      'scheduler-agent',
      '调度 Agent',
      '任务调度和协调专家',
      'ollama/qwen-coder:7b',
      mockSkillManager,
      mockModelRouter
    );

     this.schedulerConfig = {
       maxConcurrentTasks: 5,
       defaultTimeout: 300000, // 5分钟
       enableRetry: true,
       maxRetries: 3,
       ...config
     };
  }

  /**
   * 加载默认技能
   */
  protected async loadDefaultSkills(): Promise<void> {
    // 暂时使用空数组，避免复杂的Skill类型定义
    this.skills = [];
  }

  /**
   * 验证任务是否适合此 Agent
   */
  protected validateTask(task: Task): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!task.id) {
      errors.push('任务必须包含ID');
    }

    if (!task.name) {
      errors.push('任务必须包含名称');
    }

    if (!task.description) {
      errors.push('任务必须包含描述');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 选择适合任务的技能
   */
  protected selectSkills(task: Task): any[] {
    // 暂时返回空数组，避免复杂的Skill类型定义
    return [];
  }

  /**
   * 执行任务的核心逻辑
   */
  protected async executeWithContext(context: ExecutionContext): Promise<ExecutionResult> {
    const { task } = context;

    // 模拟调度逻辑
    const result: ExecutionResult = {
      success: true,
      output: {
        success: true,
        generatedCode: '',
        documentation: '',
        testCases: [],
        executionTime: 100,
        model: this.model
      },
      context: context,
      metrics: {
        totalTime: 100,
        skillExecutionCount: 0,
        tokensUsed: 0,
        qualityScore: 85,
        errorCount: 0
      }
    };

    return result;
  }

  /**
   * 添加任务到队列
   */
  async addTask(task: Task): Promise<string> {
    const validation = this.validateTask(task);
    if (!validation.isValid) {
      throw new Error(`任务验证失败: ${validation.errors.join(', ')}`);
    }

    this.taskQueue.push(task);
    this.log('info', `任务已添加到队列: ${task.name}`);
    
    return task.id;
  }

  /**
   * 获取待处理任务
   */
  getPendingTasks(): Task[] {
    return [...this.taskQueue];
  }

  /**
   * 获取运行中任务
   */
  getRunningTasks(): Task[] {
    return Array.from(this.runningTasks.values());
  }

  /**
   * 开始调度
   */
  async startScheduling(): Promise<void> {
    this.log('info', '开始任务调度');
    
    // 模拟调度循环
    setInterval(() => {
      this.processQueue();
    }, 5000); // 每5秒处理一次队列
  }

  /**
   * 处理任务队列
   */
  private async processQueue(): Promise<void> {
    if (this.runningTasks.size >= this.schedulerConfig.maxConcurrentTasks) {
      return; // 达到最大并发数
    }

    const availableSlots = this.schedulerConfig.maxConcurrentTasks - this.runningTasks.size;
    const tasksToProcess = this.taskQueue.splice(0, availableSlots);

    for (const task of tasksToProcess) {
      this.runningTasks.set(task.id, task);
      
      try {
        await this.execute(task);
        this.runningTasks.delete(task.id);
      } catch (error) {
        this.log('error', `任务执行失败: ${task.name}`, error);
        this.runningTasks.delete(task.id);
        
        // 重试逻辑
        if (this.schedulerConfig.enableRetry) {
          await this.handleRetry(task, error);
        }
      }
    }
  }

  /**
   * 处理任务重试
   */
  private async handleRetry(task: Task, error: any): Promise<void> {
    const retryCount = (task as any).retryCount || 0;
    
    if (retryCount < this.schedulerConfig.maxRetries) {
      (task as any).retryCount = retryCount + 1;
      this.taskQueue.push(task);
      this.log('info', `任务将重试: ${task.name}, 重试次数: ${retryCount + 1}`);
    } else {
      this.log('error', `任务重试次数已达上限: ${task.name}`);
    }
  }
}