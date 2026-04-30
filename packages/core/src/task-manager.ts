import { Task, Agent } from './types';

/**
 * 任务管理器 - 负责任务队列、状态机和重试机制
 */
export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private taskQueue: string[] = [];
  private executingTasks: Set<string> = new Set();
  private completedTasks: Set<string> = new Set();
  private failedTasks: Set<string> = new Set();
  private maxRetries = 3;
  private retryDelays = [1000, 5000, 10000]; // 1s, 5s, 10s

  /**
   * 添加任务到管理器
   */
  addTasks(tasks: Task[]): void {
    for (const task of tasks) {
      this.tasks.set(task.id, task);
      this.taskQueue.push(task.id);
    }
  }

  /**
   * 获取可执行任务
   */
  getExecutableTasks(dependencies: Map<string, string[]>): Task[] {
    const executable: Task[] = [];
    
    for (const taskId of this.taskQueue) {
      const task = this.tasks.get(taskId);
      if (!task || this.executingTasks.has(taskId) || this.completedTasks.has(taskId)) {
        continue;
      }
      
      const taskDeps = dependencies.get(taskId) || [];
      const allDepsCompleted = taskDeps.every(depId => this.completedTasks.has(depId));
      
      if (allDepsCompleted) {
        executable.push(task);
      }
    }
    
    return executable;
  }

  /**
   * 标记任务开始执行
   */
  markTaskStarted(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'in-progress';
      task.updatedAt = new Date();
      this.executingTasks.add(taskId);
    }
  }

  /**
   * 标记任务完成
   */
  markTaskCompleted(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.updatedAt = new Date();
      this.executingTasks.delete(taskId);
      this.completedTasks.add(taskId);
    }
  }

  /**
   * 标记任务失败
   */
  markTaskFailed(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.updatedAt = new Date();
      this.executingTasks.delete(taskId);
      this.failedTasks.add(taskId);
      
      // 记录错误信息
      if (!task.metadata) task.metadata = {};
      task.metadata.error = error;
      task.metadata.retryCount = (task.metadata.retryCount || 0) + 1;
    }
  }

  /**
   * 检查是否所有任务完成
   */
  isAllTasksCompleted(): boolean {
    return this.completedTasks.size === this.tasks.size;
  }

  /**
   * 获取任务进度
   */
  getProgress(): { completed: number; total: number; progress: number } {
    const total = this.tasks.size;
    const completed = this.completedTasks.size;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, progress };
  }

  /**
   * 获取失败任务
   */
  getFailedTasks(): Task[] {
    return Array.from(this.failedTasks).map(id => this.tasks.get(id)!).filter(Boolean);
  }

  /**
   * 重试失败任务
   */
  retryFailedTasks(): Task[] {
    const retryTasks: Task[] = [];
    
    for (const taskId of this.failedTasks) {
      const task = this.tasks.get(taskId);
      if (task && (task.metadata?.retryCount || 0) < this.maxRetries) {
        task.status = 'pending';
        task.updatedAt = new Date();
        this.failedTasks.delete(taskId);
        this.taskQueue.push(taskId);
        retryTasks.push(task);
      }
    }
    
    return retryTasks;
  }

  /**
   * 获取任务执行统计
   */
  getStatistics() {
    const total = this.tasks.size;
    const completed = this.completedTasks.size;
    const failed = this.failedTasks.size;
    const executing = this.executingTasks.size;
    const pending = total - completed - failed - executing;
    
    return { total, completed, failed, executing, pending };
  }

  /**
   * 清空任务管理器
   */
  clear(): void {
    this.tasks.clear();
    this.taskQueue = [];
    this.executingTasks.clear();
    this.completedTasks.clear();
    this.failedTasks.clear();
  }
}