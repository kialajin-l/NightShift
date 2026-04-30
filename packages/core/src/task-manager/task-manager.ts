/**
 * NightShift 任务管理器
 * 管理任务生命周期、并发控制、重试机制和事件发布
 */

import { EventEmitter } from 'events';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskConfig,
  TaskStorage,
  MemoryStorage,
  TaskEvent,
  TaskEventData,
  TaskPlugin,
  TaskManager,
  TaskManagerStats,
  TaskLogger,
  ConsoleLogger,
  TaskQueue,
  PriorityQueue,
  ConcurrencyController,
  SemaphoreConcurrencyController
} from './types/task-manager.js';

/**
 * 任务状态机
 */
class TaskStateMachine {
  private readonly validTransitions: Record<TaskStatus, TaskStatus[]> = {
    pending: ['running', 'cancelled'],
    running: ['completed', 'failed', 'timeout', 'cancelled'],
    completed: [],
    failed: ['pending'], // 重试时回到 pending
    cancelled: [],
    timeout: ['pending'] // 重试时回到 pending
  };

  /**
   * 检查状态转换是否有效
   */
  isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
    return this.validTransitions[from].includes(to);
  }

  /**
   * 执行状态转换
   */
  transition(task: Task, newStatus: TaskStatus, data?: any): Task {
    if (!this.isValidTransition(task.status, newStatus)) {
      throw new Error(`无效的状态转换: ${task.status} -> ${newStatus}`);
    }

    const updatedTask: Task = {
      ...task,
      status: newStatus,
      updatedAt: new Date()
    };

    // 更新相关时间戳
    if (newStatus === 'running' && !task.startedAt) {
      updatedTask.startedAt = new Date();
    }

    if (['completed', 'failed', 'cancelled', 'timeout'].includes(newStatus)) {
      updatedTask.completedAt = new Date();
    }

    // 处理重试计数
    if (newStatus === 'pending' && task.status === 'failed') {
      updatedTask.retryCount = (task.retryCount || 0) + 1;
    }

    return updatedTask;
  }
}

/**
 * 超时检测器
 */
class TimeoutDetector {
  private timeouts = new Map<string, NodeJS.Timeout>();

  /**
   * 设置任务超时检测
   */
  setTimeout(taskId: string, timeoutMs: number, callback: () => void): void {
    this.clearTimeout(taskId);
    
    const timeout = setTimeout(() => {
      this.timeouts.delete(taskId);
      callback();
    }, timeoutMs);
    
    this.timeouts.set(taskId, timeout);
  }

  /**
   * 清除任务超时检测
   */
  clearTimeout(taskId: string): void {
    const timeout = this.timeouts.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(taskId);
    }
  }

  /**
   * 清除所有超时检测
   */
  clearAll(): void {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
  }
}

/**
 * 插件管理器
 */
class PluginManager {
  private plugins = new Map<string, TaskPlugin>();

  /**
   * 注册插件
   */
  async registerPlugin(plugin: TaskPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`插件 ${plugin.name} 已注册`);
    }
    
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * 注销插件
   */
  async unregisterPlugin(pluginName: string): Promise<void> {
    this.plugins.delete(pluginName);
  }

  /**
   * 调用插件钩子
   */
  async callHook(hookName: keyof TaskPlugin, ...args: any[]): Promise<void> {
    for (const plugin of this.plugins.values()) {
      const hook = plugin[hookName];
      if (typeof hook === 'function') {
        try {
          await hook.apply(plugin, args);
        } catch (error) {
          console.error(`插件 ${plugin.name} 的钩子 ${hookName} 执行失败:`, error);
        }
      }
    }
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): TaskPlugin[] {
    return Array.from(this.plugins.values());
  }
}

/**
 * NightShift 任务管理器实现
 */
export class NightShiftTaskManager extends EventEmitter implements TaskManager {
  private storage: TaskStorage;
  private queue: TaskQueue;
  private concurrencyController: ConcurrencyController;
  private stateMachine: TaskStateMachine;
  private timeoutDetector: TimeoutDetector;
  private pluginManager: PluginManager;
  private logger: TaskLogger;
  
  private isInitialized = false;
  private isShuttingDown = false;
  
  constructor(config: TaskConfig = {}) {
    super();
    
    // 初始化组件
    this.storage = config.storage || new MemoryStorage();
    this.queue = new PriorityQueue();
    this.concurrencyController = new SemaphoreConcurrencyController(config.maxConcurrent || 3);
    this.stateMachine = new TaskStateMachine();
    this.timeoutDetector = new TimeoutDetector();
    this.pluginManager = new PluginManager();
    this.logger = config.logger || new ConsoleLogger('NightShiftTaskManager');
    
    // 设置默认配置
    this.defaultTimeout = config.defaultTimeout || 30 * 60 * 1000; // 30分钟
    this.defaultMaxRetries = config.defaultMaxRetries || 3;
  }

  private defaultTimeout: number;
  private defaultMaxRetries: number;

  /**
   * 初始化任务管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    this.logger.info('初始化任务管理器');
    
    // 调用插件初始化钩子
    await this.pluginManager.callHook('onInitialize', this);
    
    this.isInitialized = true;
    this.logger.info('任务管理器初始化完成');
  }

  /**
   * 关闭任务管理器
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    this.logger.info('正在关闭任务管理器');
    
    // 清除所有超时检测
    this.timeoutDetector.clearAll();
    
    // 调用插件关闭钩子
    await this.pluginManager.callHook('onShutdown');
    
    this.logger.info('任务管理器已关闭');
  }

  /**
   * 添加任务
   */
  async addTask(taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retryCount'>): Promise<Task> {
    this.ensureInitialized();
    
    const task: Task = {
      ...taskData,
      id: this.generateTaskId(),
      status: 'pending',
      retryCount: 0,
      maxRetries: taskData.maxRetries ?? this.defaultMaxRetries,
      timeout: taskData.timeout ?? this.defaultTimeout,
      createdAt: new Date(),
      updatedAt: new Date(),
      dependencies: taskData.dependencies || [],
      tags: taskData.tags || [],
      metadata: taskData.metadata || {}
    };
    
    // 保存任务
    await this.storage.save(task);
    
    // 添加到队列
    await this.queue.enqueue(task);
    
    // 发布事件
    this.emitEvent('task.added', task);
    
    // 调用插件钩子
    await this.pluginManager.callHook('onTaskAdded', task);
    
    this.logger.info(`任务已添加: ${task.name} (${task.id})`);
    
    // 尝试执行就绪任务
    this.processReadyTasks().catch(error => {
      this.logger.error('处理就绪任务时出错:', error);
    });
    
    return task;
  }

  /**
   * 开始执行任务
   */
  async startTask(taskId: string): Promise<void> {
    this.ensureInitialized();
    
    const task = await this.storage.get(taskId);
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`);
    }
    
    if (task.status !== 'pending') {
      throw new Error(`任务状态无效，无法开始: ${task.status}`);
    }
    
    // 检查依赖是否完成
    if (task.dependencies.length > 0) {
      const allDependenciesCompleted = await this.checkDependenciesCompleted(task.dependencies);
      if (!allDependenciesCompleted) {
        throw new Error('任务依赖未完成，无法开始执行');
      }
    }
    
    // 获取并发许可
    const acquired = await this.concurrencyController.acquire();
    if (!acquired) {
      throw new Error('并发限制已满，无法开始任务');
    }
    
    try {
      // 更新任务状态
      const updatedTask = this.stateMachine.transition(task, 'running');
      await this.storage.save(updatedTask);
      
      // 设置超时检测
      this.timeoutDetector.setTimeout(taskId, task.timeout, () => {
        this.handleTaskTimeout(taskId).catch(error => {
          this.logger.error(`处理任务超时失败: ${taskId}`, error);
        });
      });
      
      // 发布事件
      this.emitEvent('task.started', updatedTask);
      
      // 调用插件钩子
      await this.pluginManager.callHook('onTaskStarted', updatedTask);
      
      this.logger.info(`任务已开始: ${task.name} (${task.id})`);
      
    } catch (error) {
      // 释放并发许可
      this.concurrencyController.release();
      throw error;
    }
  }

  /**
   * 完成任务
   */
  async completeTask(taskId: string, output?: any): Promise<void> {
    await this.finalizeTask(taskId, 'completed', { output });
  }

  /**
   * 任务失败
   */
  async failTask(taskId: string, error: string): Promise<void> {
    await this.finalizeTask(taskId, 'failed', { error });
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<void> {
    await this.finalizeTask(taskId, 'cancelled');
  }

  /**
   * 重试任务
   */
  async retryTask(taskId: string): Promise<void> {
    this.ensureInitialized();
    
    const task = await this.storage.get(taskId);
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`);
    }
    
    if (!['failed', 'timeout'].includes(task.status)) {
      throw new Error(`只有失败或超时的任务可以重试，当前状态: ${task.status}`);
    }
    
    if (task.retryCount >= task.maxRetries) {
      throw new Error(`任务已达到最大重试次数: ${task.maxRetries}`);
    }
    
    // 清除超时检测
    this.timeoutDetector.clearTimeout(taskId);
    
    // 更新任务状态为 pending
    const updatedTask = this.stateMachine.transition(task, 'pending');
    await this.storage.save(updatedTask);
    
    // 重新加入队列
    await this.queue.enqueue(updatedTask);
    
    // 发布事件
    this.emitEvent('task.retry', updatedTask, { previousStatus: task.status });
    
    // 调用插件钩子
    await this.pluginManager.callHook('onTaskRetry', updatedTask);
    
    this.logger.info(`任务已重试: ${task.name} (${task.id})，重试次数: ${updatedTask.retryCount}`);
    
    // 尝试执行就绪任务
    await this.processReadyTasks();
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
    const task = await this.storage.get(taskId);
    return task?.status || null;
  }

  /**
   * 获取任务详情
   */
  async getTask(taskId: string): Promise<Task | null> {
    return this.storage.get(taskId);
  }

  /**
   * 获取就绪任务
   */
  async getReadyTasks(): Promise<Task[]> {
    const allTasks = await this.storage.getAll();
    return allTasks.filter(task => task.status === 'pending');
  }

  /**
   * 获取运行中任务
   */
  async getRunningTasks(): Promise<Task[]> {
    const allTasks = await this.storage.getAll();
    return allTasks.filter(task => task.status === 'running');
  }

  /**
   * 获取所有任务
   */
  async getAllTasks(): Promise<Task[]> {
    return this.storage.getAll();
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<TaskManagerStats> {
    const allTasks = await this.storage.getAll();
    
    const stats: TaskManagerStats = {
      totalTasks: allTasks.length,
      pendingTasks: allTasks.filter(t => t.status === 'pending').length,
      runningTasks: allTasks.filter(t => t.status === 'running').length,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      failedTasks: allTasks.filter(t => t.status === 'failed').length,
      cancelledTasks: allTasks.filter(t => t.status === 'cancelled').length,
      timeoutTasks: allTasks.filter(t => t.status === 'timeout').length,
      
      averageExecutionTime: this.calculateAverageExecutionTime(allTasks),
      successRate: this.calculateSuccessRate(allTasks),
      throughput: this.calculateThroughput(allTasks),
      
      concurrentLimit: this.concurrencyController.getMaxConcurrency(),
      currentConcurrency: this.concurrencyController.getCurrentConcurrency()
    };
    
    return stats;
  }

  /**
   * 注册插件
   */
  async registerPlugin(plugin: TaskPlugin): Promise<void> {
    await this.pluginManager.registerPlugin(plugin);
    this.logger.info(`插件已注册: ${plugin.name} v${plugin.version}`);
  }

  /**
   * 注销插件
   */
  async unregisterPlugin(pluginName: string): Promise<void> {
    await this.pluginManager.unregisterPlugin(pluginName);
    this.logger.info(`插件已注销: ${pluginName}`);
  }

  /**
   * 私有方法
   */
  
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('任务管理器未初始化，请先调用 initialize() 方法');
    }
    
    if (this.isShuttingDown) {
      throw new Error('任务管理器正在关闭，无法执行操作');
    }
  }

  private generateTaskId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `task-${timestamp}-${random}`;
  }

  private emitEvent(event: TaskEvent, task: Task, data?: any): void {
    const eventData: TaskEventData = {
      task,
      timestamp: new Date(),
      data
    };
    
    this.emit(event, eventData);
    this.logger.debug(`事件发布: ${event}`, { taskId: task.id, status: task.status });
  }

  private async finalizeTask(taskId: string, status: TaskStatus, data?: any): Promise<void> {
    this.ensureInitialized();
    
    const task = await this.storage.get(taskId);
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`);
    }
    
    // 清除超时检测
    this.timeoutDetector.clearTimeout(taskId);
    
    // 更新任务状态
    const updatedTask = this.stateMachine.transition(task, status);
    
    // 更新输出或错误信息
    if (data?.output !== undefined) {
      updatedTask.output = data.output;
    }
    
    if (data?.error !== undefined) {
      updatedTask.error = data.error;
    }
    
    await this.storage.save(updatedTask);
    
    // 释放并发许可
    if (task.status === 'running') {
      this.concurrencyController.release();
    }
    
    // 发布事件
    const eventName = `task.${status}` as TaskEvent;
    this.emitEvent(eventName, updatedTask, { previousStatus: task.status });
    
    // 调用插件钩子
    const hookName = `onTask${status.charAt(0).toUpperCase() + status.slice(1)}` as keyof TaskPlugin;
    await this.pluginManager.callHook(hookName, updatedTask);
    
    this.logger.info(`任务已${this.getStatusText(status)}: ${task.name} (${task.id})`);
    
    // 尝试执行就绪任务
    await this.processReadyTasks();
  }

  private async processReadyTasks(): Promise<void> {
    while (!this.isShuttingDown) {
      // 检查并发限制
      if (this.concurrencyController.getCurrentConcurrency() >= this.concurrencyController.getMaxConcurrency()) {
        break;
      }
      
      // 获取下一个就绪任务
      const task = await this.queue.dequeue();
      if (!task) {
        break;
      }
      
      // 验证任务状态
      const currentTask = await this.storage.get(task.id);
      if (!currentTask || currentTask.status !== 'pending') {
        continue;
      }
      
      // 开始执行任务
      try {
        await this.startTask(task.id);
      } catch (error) {
        this.logger.error(`开始任务失败: ${task.id}`, error);
        // 将任务重新加入队列
        await this.queue.enqueue(task);
      }
    }
  }

  private async checkDependenciesCompleted(dependencies: string[]): Promise<boolean> {
    for (const depId of dependencies) {
      const depTask = await this.storage.get(depId);
      if (!depTask || !['completed', 'cancelled'].includes(depTask.status)) {
        return false;
      }
    }
    return true;
  }

  private async handleTaskTimeout(taskId: string): Promise<void> {
    this.logger.warn(`任务超时: ${taskId}`);
    
    const task = await this.storage.get(taskId);
    if (!task || task.status !== 'running') {
      return;
    }
    
    // 更新任务状态为超时
    const updatedTask = this.stateMachine.transition(task, 'timeout');
    await this.storage.save(updatedTask);
    
    // 释放并发许可
    this.concurrencyController.release();
    
    // 发布事件
    this.emitEvent('task.timeout', updatedTask);
    
    this.logger.info(`任务已标记为超时: ${task.name} (${task.id})`);
    
    // 尝试执行就绪任务
    await this.processReadyTasks();
  }

  private getStatusText(status: TaskStatus): string {
    const statusTexts = {
      pending: '等待',
      running: '运行中',
      completed: '完成',
      failed: '失败',
      cancelled: '取消',
      timeout: '超时'
    };
    
    return statusTexts[status] || status;
  }

  private calculateAverageExecutionTime(tasks: Task[]): number {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.startedAt && t.completedAt);
    
    if (completedTasks.length === 0) {
      return 0;
    }
    
    const totalTime = completedTasks.reduce((sum, task) => {
      return sum + (task.completedAt!.getTime() - task.startedAt!.getTime());
    }, 0);
    
    return totalTime / completedTasks.length;
  }

  private calculateSuccessRate(tasks: Task[]): number {
    const finalTasks = tasks.filter(t => ['completed', 'failed', 'cancelled', 'timeout'].includes(t.status));
    
    if (finalTasks.length === 0) {
      return 0;
    }
    
    const successfulTasks = finalTasks.filter(t => t.status === 'completed').length;
    return successfulTasks / finalTasks.length;
  }

  private calculateThroughput(tasks: Task[]): number {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt);
    
    if (completedTasks.length === 0) {
      return 0;
    }
    
    // 找到最早和最晚的完成时间
    const completionTimes = completedTasks.map(t => t.completedAt!.getTime());
    const minTime = Math.min(...completionTimes);
    const maxTime = Math.max(...completionTimes);
    
    const timeRange = maxTime - minTime;
    if (timeRange === 0) {
      return completedTasks.length;
    }
    
    // 计算每分钟的任务完成数
    return (completedTasks.length / (timeRange / (60 * 1000)));
  }
}