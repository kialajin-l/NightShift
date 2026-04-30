/**
 * 新的调度 Agent - 集成真实组件
 * 替换 Mock 实现，提供真正的 AI 驱动任务调度
 */

import AITaskDecomposer from './ai-task-decomposer';
import TaskManager from './task-manager';
import LLMClient from './llm-client';
import { 
  Task, 
  TaskStatus, 
  TaskPriority, 
  TaskDAG, 
  TaskDecompositionResult,
  ExecutionContext 
} from './types/task-types';

interface SchedulerAgentConfig {
  useMock?: boolean;
  maxConcurrentTasks?: number;
  defaultModel?: string;
}

class SchedulerAgent {
  private decomposer: AITaskDecomposer;
  private taskManager: TaskManager;
  private llm: LLMClient;
  private config: Required<SchedulerAgentConfig>;
  private isInitialized: boolean = false;
  private logger: Console;

  constructor(config: SchedulerAgentConfig = {}) {
    this.config = {
      useMock: config.useMock || process.env.USE_MOCK === 'true',
      maxConcurrentTasks: config.maxConcurrentTasks || 5,
      defaultModel: config.defaultModel || 'anthropic/claude-sonnet-4'
    };

    this.llm = new LLMClient();
    this.decomposer = new AITaskDecomposer(this.llm);
    this.taskManager = new TaskManager({
      maxConcurrent: this.config.maxConcurrentTasks
    });
    
    this.logger = console;
    this.isInitialized = true;

    // v2.0 预留：初始化 Socket.IO 连接
    this.initializeSocketIO();

    this.logger.log('[SchedulerAgent] 调度器已初始化', {
      useMock: this.config.useMock,
      maxConcurrentTasks: this.config.maxConcurrentTasks
    });
  }

  /**
   * 初始化 WebSocket 服务（v2.0 预留）
   */
  private initializeSocketIO(): void {
    // v2.0 实现：Socket.IO 服务端连接
    this.logger.log('[SchedulerAgent] Socket.IO 初始化（v2.0 预留）');
  }

  /**
   * 分解用户需求为任务列表
   */
  async decomposeRequirement(requirement: string, context?: Partial<ExecutionContext>): Promise<TaskDecompositionResult> {
    if (!this.isInitialized) {
      throw new Error('调度器未初始化');
    }

    try {
      const executionContext = {
        projectType: context?.projectType || 'vue',
        technologyStack: context?.technologyStack || ['typescript', 'vue', 'node'],
        complexity: context?.complexity || 'medium',
        workingDirectory: context?.workingDirectory,
        dependencies: context?.dependencies
      };

      this.logger.log('[SchedulerAgent] 开始分解需求:', requirement.substring(0, 100) + '...');

      const result = await this.decomposer.decompose({
        text: requirement,
        context: executionContext
      });

      // 验证分解结果
      const validation = this.decomposer.validateDecomposition(result);
      if (!validation.isValid) {
        throw new Error(`任务分解验证失败: ${validation.errors.join(', ')}`);
      }

      this.logger.log(`[SchedulerAgent] 需求分解完成: ${result.tasks?.length || 0} 个任务`);
      return result;

    } catch (error) {
      this.logger.error('[SchedulerAgent] 需求分解失败:', error);
      
      // 如果 AI 分解失败，回退到基础任务
      if (this.config.useMock) {
        this.logger.warn('[SchedulerAgent] 使用 Mock 回退分解');
        return this.mockDecomposition(requirement);
      }
      
      throw new Error(`需求分解失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 创建并调度任务
   */
  async scheduleTasks(decompositionResult: TaskDecompositionResult): Promise<{
    scheduledTasks: Task[];
    totalTasks: number;
    estimatedTime: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('调度器未初始化');
    }

    try {
      const tasks: Task[] = [];
      
      // 将分解结果中的任务添加到任务管理器
      for (const taskData of decompositionResult.tasks || []) {
        const taskId = await this.taskManager.addTask({
          name: taskData.name,
          description: taskData.description,
          type: taskData.type,
          agent: taskData.agent,
          priority: taskData.priority,
          estimatedTime: taskData.estimatedTime,
          dependencies: taskData.dependencies,
          input: taskData.input,
          tags: taskData.tags,
          technology: taskData.technology || {
            frontend: { framework: 'react', language: 'typescript', styling: 'css' },
            backend: { framework: 'express', language: 'javascript', database: 'postgresql' }
          },
          metadata: taskData.metadata || {}
        });

        // 获取完整的任务对象
        const task = await this.taskManager.getTask(taskId);
        if (task) {
          tasks.push(task);
        }
      }

      this.logger.log(`[SchedulerAgent] 任务调度完成: ${tasks.length} 个任务已添加到队列`);

      // 开始执行任务（异步）
      this.startTaskExecution().catch(error => {
        this.logger.error('[SchedulerAgent] 任务执行启动失败:', error);
      });

      return {
        scheduledTasks: tasks,
        totalTasks: tasks.length,
        estimatedTime: decompositionResult.totalEstimatedTime || 0
      };

    } catch (error) {
      this.logger.error('[SchedulerAgent] 任务调度失败:', error);
      throw new Error(`任务调度失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 开始执行任务（异步）
   */
  private async startTaskExecution(): Promise<void> {
    try {
      // 获取可执行的任务（依赖已完成的）
      const executableTasks = await this.taskManager.getExecutableTasks();
      
      if (executableTasks.length === 0) {
        this.logger.log('[SchedulerAgent] 没有可执行的任务');
        return;
      }

      this.logger.log(`[SchedulerAgent] 开始执行 ${executableTasks.length} 个可执行任务`);

      // 限制并发数量
      const concurrentTasks = executableTasks.slice(0, this.config.maxConcurrentTasks);
      
      // 并行执行任务
      const executionPromises = concurrentTasks.map(task => 
        this.executeSingleTask(task)
      );

      await Promise.all(executionPromises);

      // 检查是否有更多任务需要执行
      setTimeout(() => {
        this.startTaskExecution().catch(error => {
          this.logger.error('[SchedulerAgent] 后续任务执行失败:', error);
        });
      }, 1000);

    } catch (error) {
      this.logger.error('[SchedulerAgent] 任务执行失败:', error);
    }
  }

  /**
   * 执行单个任务
   */
  private async executeSingleTask(task: Task): Promise<void> {
    try {
      // 更新任务状态为运行中
      await this.taskManager.updateTaskStatus(task.id, 'running');

      this.logger.log(`[SchedulerAgent] 开始执行任务: ${task.name} (${task.id})`);

      // v2.0 预留：这里应该调用相应的 Agent 来执行任务
      // 目前先模拟执行，等待 Phase 2 实现真正的 Agent 执行
      await this.simulateTaskExecution(task);

      // 标记任务为已完成
      await this.taskManager.updateTaskStatus(task.id, 'completed', {
        success: true,
        executionTime: 30000, // 模拟 30 秒执行时间
        model: this.config.defaultModel
      });

      this.logger.log(`[SchedulerAgent] 任务完成: ${task.name} (${task.id})`);

    } catch (error) {
      this.logger.error(`[SchedulerAgent] 任务执行失败: ${task.name} (${task.id})`, error);
      
      await this.taskManager.updateTaskStatus(task.id, 'failed', {
        success: false,
        executionTime: 0,
        error: error instanceof Error ? error.message : '未知错误'
      });

      // 检查是否需要重试
      const updatedTask = await this.taskManager.getTask(task.id);
      if (updatedTask && (updatedTask.retryCount || 0) < 3) {
        this.logger.log(`[SchedulerAgent] 准备重试任务: ${task.name} (${task.id})`);
        setTimeout(() => {
          this.executeSingleTask(updatedTask).catch(console.error);
        }, 5000); // 5秒后重试
      }
    }
  }

  /**
   * 模拟任务执行（Phase 2 将替换为真正的 Agent 执行）
   */
  private async simulateTaskExecution(task: Task): Promise<void> {
    // 模拟执行时间（基于预估时间）
    const executionTime = Math.min(task.estimatedTime * 1000, 30000); // 最多30秒
    
    this.logger.log(`[SchedulerAgent] 模拟执行任务: ${task.name}, 预计耗时: ${executionTime}ms`);
    
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // 模拟执行结果
    this.logger.log(`[SchedulerAgent] 任务模拟执行完成: ${task.name}`);
  }

  /**
   * 获取任务执行进度
   */
  async getTaskProgress(): Promise<{
    total: number;
    completed: number;
    failed: number;
    running: number;
    pending: number;
    progress: number;
    estimatedRemainingTime: number;
  }> {
    try {
      const progress = await this.taskManager.getTaskProgress();
      const estimatedRemainingTime = await this.taskManager.getEstimatedRemainingTime();

      return {
        ...progress,
        estimatedRemainingTime
      };

    } catch (error) {
      this.logger.error('[SchedulerAgent] 获取任务进度失败:', error);
      return {
        total: 0,
        completed: 0,
        failed: 0,
        running: 0,
        pending: 0,
        progress: 0,
        estimatedRemainingTime: 0
      };
    }
  }

  /**
   * 获取任务详情
   */
  async getTaskDetails(taskId: string): Promise<Task | null> {
    try {
      return await this.taskManager.getTask(taskId);
    } catch (error) {
      this.logger.error('[SchedulerAgent] 获取任务详情失败:', error);
      return null;
    }
  }

  /**
   * 获取所有任务
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      return await this.taskManager.getAllTasks();
    } catch (error) {
      this.logger.error('[SchedulerAgent] 获取所有任务失败:', error);
      return [];
    }
  }

  /**
   * 重新执行失败的任务
   */
  async retryFailedTasks(): Promise<{
    retriedTasks: number;
    success: boolean;
  }> {
    try {
      const allTasks = await this.taskManager.getAllTasks();
      const failedTasks = allTasks.filter(t => t.status === 'failed');
      
      let retriedCount = 0;
      
      for (const task of failedTasks) {
        await this.taskManager.retryTask(task.id);
        retriedCount++;
      }
      
      this.logger.log(`[SchedulerAgent] 重试了 ${retriedCount} 个失败任务`);
      
      // 重新开始执行
      this.startTaskExecution().catch(console.error);
      
      return {
        retriedTasks: retriedCount,
        success: true
      };
    } catch (error) {
      this.logger.error('[SchedulerAgent] 重试失败任务失败:', error);
      return {
        retriedTasks: 0,
        success: false
      };
    }
  }

  /**
   * 取消所有任务
   */
  async cancelAllTasks(): Promise<{
    cancelledTasks: number;
    success: boolean;
  }> {
    try {
      const allTasks = await this.taskManager.getAllTasks();
      const activeTasks = allTasks.filter(t => t.status === 'pending' || t.status === 'running');
      
      for (const task of activeTasks) {
        await this.taskManager.cancelTask(task.id);
      }
      
      this.logger.log(`[SchedulerAgent] 取消了 ${activeTasks.length} 个活动任务`);
      
      return {
        cancelledTasks: activeTasks.length,
        success: true
      };
    } catch (error) {
      this.logger.error('[SchedulerAgent] 取消所有任务失败:', error);
      return {
        cancelledTasks: 0,
        success: false
      };
    }
  }

  /**
   * 获取调度器状态
   */
  async getSchedulerStatus(): Promise<{
    isRunning: boolean;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    concurrencyLimit: number;
    memoryUsage: number;
  }> {
    try {
      const progress = await this.getTaskProgress();
      const stats = await this.taskManager.getStats();
      
      return {
        isRunning: this.isInitialized,
        totalTasks: progress.total,
        activeTasks: progress.running,
        completedTasks: progress.completed,
        failedTasks: progress.failed,
        concurrencyLimit: this.config.maxConcurrentTasks,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
      };
    } catch (error) {
      this.logger.error('[SchedulerAgent] 获取调度器状态失败:', error);
      return {
        isRunning: false,
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        concurrencyLimit: 0,
        memoryUsage: 0
      };
    }
  }

  /**
   * Mock 分解（用于回退）
   */
  private mockDecomposition(requirement: string): TaskDecompositionResult {
    const mockTasks = [
        {
          id: 'mock-task-1',
          name: '创建项目基础结构',
          description: '设置项目目录结构、配置文件、依赖管理',
          type: 'infrastructure' as Task['type'],
          agent: 'backend',
          status: 'pending' as Task['status'],
          priority: 'urgent' as Task['priority'],
          estimatedTime: 30,
          dependencies: [],
          input: { requirements: '创建基础项目结构' },
          tags: ['typescript', 'node'],
          createdAt: new Date(),
          updatedAt: new Date(),
          technology: {
            frontend: { framework: 'react' as const, language: 'typescript' as const, styling: 'css' as const },
            backend: { framework: 'express' as const, language: 'javascript' as const, database: 'postgresql' as const }
          },
          metadata: {}
        },
        {
          id: 'mock-task-2',
          name: '实现核心功能',
          description: '根据需求实现核心业务逻辑',
          type: 'api_implementation' as Task['type'],
          agent: 'backend',
          status: 'pending' as Task['status'],
          priority: 'high' as Task['priority'],
          estimatedTime: 45,
          dependencies: ['mock-task-1'],
          input: { requirements: '实现核心功能' },
          tags: ['api', 'business'],
          createdAt: new Date(),
          updatedAt: new Date(),
          technology: {
            frontend: { framework: 'react' as const, language: 'typescript' as const, styling: 'css' as const },
            backend: { framework: 'express' as const, language: 'javascript' as const, database: 'postgresql' as const }
          },
          metadata: {}
        }
      ];
    return {
      success: true,
      decomposedTasks: mockTasks,
      tasks: mockTasks,
      totalEstimatedTime: 75,
      dag: {
        nodes: mockTasks,
        edges: [{ from: 'mock-task-1', to: 'mock-task-2' }],
        estimatedTime: 75
      },
      metadata: {
        projectName: 'Mock 项目',
        architecture: 'single',
        phases: ['foundation', 'backend']
      }
    };
  }

  /**
   * 检查调度器状态
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      decomposer: '已初始化',
      taskManager: '已初始化',
      concurrencyLimit: this.config.maxConcurrentTasks,
      defaultTimeout: 300000,
      useMock: this.config.useMock
    };
  }
}

// 导出单例实例
export const schedulerAgent = new SchedulerAgent();

export default SchedulerAgent;