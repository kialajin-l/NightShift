// NightShift 调度 Agent 核心服务
// 集成 packages/core 中的任务调度功能

import { 
  TaskDecomposer, 
  TaskManager, 
  Task, 
  TaskStatus, 
  TaskPriority, 
  TaskDAG, 
  TaskDecompositionResult, 
  TaskManagerStats
} from './types/task-types';
import { getWebSocketService } from './websocket-service';

// Mock 实现类
class MockTaskDecomposer implements TaskDecomposer {
  async decompose(params: { text: string; context: any }): Promise<TaskDecompositionResult> {
    return {
      success: true,
      decomposedTasks: [],
      dag: { nodes: [], edges: [], estimatedTime: 0 }
    };
  }
}

class MockTaskManager implements TaskManager {
  private tasks: Map<string, Task> = new Map();
  private running: boolean = false;
  
  async addTask(task: Task): Promise<string> {
    this.tasks.set(task.id, task);
    return task.id;
  }
  
  async getTask(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }
  
  async updateTaskStatus(id: string, status: TaskStatus, output?: any): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      task.status = status;
    }
  }
  
  async getPendingTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.status === 'pending');
  }
  
  async getTaskDependencies(id: string): Promise<string[]> {
    return [];
  }
  
  async start(): Promise<void> {
    this.running = true;
  }
  
  async shutdown(): Promise<void> {
    this.running = false;
  }
  
  isRunning(): boolean {
    return this.running;
  }
  
  getStats(): TaskManagerStats {
    const all = Array.from(this.tasks.values());
    return {
      total: all.length,
      pending: all.filter(t => t.status === 'pending').length,
      running: all.filter(t => t.status === 'running').length,
      completed: all.filter(t => t.status === 'completed').length,
      failed: all.filter(t => t.status === 'failed').length,
      cancelled: all.filter(t => t.status === 'cancelled').length
    };
  }
  
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }
  
  async retryTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'pending';
      return true;
    }
    return false;
  }
  
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'cancelled';
      return true;
    }
    return false;
  }
}

/**
 * 调度 Agent 服务
 */
export class SchedulerAgent {
  private decomposer: TaskDecomposer;
  private taskManager: TaskManager;
  private isInitialized: boolean = false;

  constructor() {
    // 初始化任务分解器和任务管理器
    this.decomposer = new MockTaskDecomposer();
    this.taskManager = new MockTaskManager();
    
    // 初始化 WebSocket 服务
    this.initializeWebSocket();
    
    this.isInitialized = true;
  }

  /**
   * 初始化 WebSocket 服务
   */
  private initializeWebSocket(): void {
    if (typeof window !== 'undefined') {
      const wsService = getWebSocketService();
      
      // 监听连接事件
      wsService.on('connected', () => {
        console.log('WebSocket 连接已建立');
      });
      
      // 监听断开事件
      wsService.on('disconnected', (event) => {
        console.log('WebSocket 连接已断开:', event);
      });
      
      // 尝试连接
      wsService.connect().catch(error => {
        console.error('WebSocket 连接失败:', error);
      });
    }
  }

  /**
   * 分解用户需求为任务列表
   */
  async decomposeRequirement(requirement: string): Promise<TaskDecompositionResult> {
    try {
      const result = await this.decomposer.decompose({
        text: requirement,
        context: {
          projectType: 'vue', // 默认项目类型
          technologyStack: ['typescript', 'vue', 'node'],
          complexity: 'medium'
        }
      });
      
      return result;
    } catch (error) {
      console.error('任务分解失败:', error);
      throw new Error(`任务分解失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 创建并调度任务
   */
  async scheduleTasks(dag: TaskDAG): Promise<{
    scheduledTasks: Task[];
    totalTasks: number;
    estimatedTime: number;
  }> {
    try {
      const tasks: Task[] = [];
      
      // 将 DAG 中的任务转换为可执行任务
      for (const node of dag.nodes) {
        const task: Task = {
          id: node.id,
          name: node.name,
          description: node.description,
          type: node.type,
          status: 'pending' as TaskStatus,
          priority: node.priority,
          input: node.input,
          technology: node.technology,
          dependencies: node.dependencies,
          metadata: node.metadata,
          agent: node.agent,
          tags: node.tags,
          estimatedTime: node.estimatedTime,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        tasks.push(task);
        
        // 添加到任务管理器
        await this.taskManager.addTask(task);
      }
      
      // 开始执行任务
      await this.taskManager.start();
      
      return {
        scheduledTasks: tasks,
        totalTasks: tasks.length,
        estimatedTime: dag.estimatedTime
      };
    } catch (error) {
      console.error('任务调度失败:', error);
      throw new Error(`任务调度失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
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
    progress: number; // 0-100
    estimatedRemainingTime: number;
  }> {
    try {
      const stats = this.taskManager.getStats();
      const allTasks = this.taskManager.getAllTasks();
      
      const completed = allTasks.filter(t => t.status === 'completed').length;
      const failed = allTasks.filter(t => t.status === 'failed').length;
      const running = allTasks.filter(t => t.status === 'running').length;
      const pending = allTasks.filter(t => t.status === 'pending').length;
      
      const total = allTasks.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // 估算剩余时间（基于平均执行时间）
      const runningTasks = allTasks.filter(t => t.status === 'running');
      const avgExecutionTime = runningTasks.length > 0 
        ? runningTasks.reduce((sum, task) => {
            if (task.startedAt) {
              const executionTime = Date.now() - task.startedAt.getTime();
              return sum + executionTime;
            }
            return sum;
          }, 0) / runningTasks.length
        : 60000; // 默认1分钟
      
      const estimatedRemainingTime = Math.round((pending * avgExecutionTime) / 1000); // 转换为秒
      
      return {
        total,
        completed,
        failed,
        running,
        pending,
        progress,
        estimatedRemainingTime
      };
    } catch (error) {
      console.error('获取任务进度失败:', error);
      throw new Error(`获取任务进度失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取任务详情
   */
  async getTaskDetails(taskId: string): Promise<Task | null> {
    try {
      return await this.taskManager.getTask(taskId);
    } catch (error) {
      console.error('获取任务详情失败:', error);
      return null;
    }
  }

  /**
   * 获取所有任务
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      return this.taskManager.getAllTasks();
    } catch (error) {
      console.error('获取所有任务失败:', error);
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
      const failedTasks = this.taskManager.getAllTasks().filter(t => 
        t.status === 'failed'
      );
      
      let retriedCount = 0;
      
      for (const task of failedTasks) {
        await this.taskManager.retryTask(task.id);
        retriedCount++;
      }
      
      return {
        retriedTasks: retriedCount,
        success: true
      };
    } catch (error) {
      console.error('重试失败任务失败:', error);
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
      await this.taskManager.shutdown();
      
      const allTasks = this.taskManager.getAllTasks();
      const pendingTasks = allTasks.filter(t => t.status === 'pending' || t.status === 'running');
      
      for (const task of pendingTasks) {
        await this.taskManager.cancelTask(task.id);
      }
      
      return {
        cancelledTasks: pendingTasks.length,
        success: true
      };
    } catch (error) {
      console.error('取消所有任务失败:', error);
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
      const allTasks = this.taskManager.getAllTasks();
      const stats = this.taskManager.getStats();
      
      return {
        isRunning: this.taskManager.isRunning(),
        totalTasks: allTasks.length,
        activeTasks: allTasks.filter(t => t.status === 'running').length,
        completedTasks: allTasks.filter(t => t.status === 'completed').length,
        failedTasks: allTasks.filter(t => t.status === 'failed').length,
        concurrencyLimit: 5, // 从配置获取
        memoryUsage: process?.memoryUsage?.() ? process.memoryUsage().heapUsed / 1024 / 1024 : 0 // MB
      };
    } catch (error) {
      console.error('获取调度器状态失败:', error);
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
   * 生成执行报告
   */
  async generateExecutionReport(): Promise<{
    summary: {
      totalTasks: number;
      completedTasks: number;
      failedTasks: number;
      successRate: number;
      totalExecutionTime: number;
      averageTaskTime: number;
    };
    taskBreakdown: Record<string, number>;
    performanceMetrics: {
      peakConcurrency: number;
      averageMemoryUsage: number;
      totalRetries: number;
    };
    recommendations: string[];
  }> {
    try {
      const allTasks = this.taskManager.getAllTasks();
      const completedTasks = allTasks.filter(t => t.status === 'completed');
      const failedTasks = allTasks.filter(t => t.status === 'failed');
      
      // 计算执行时间
      const totalExecutionTime = completedTasks.reduce((sum, task) => {
        if (task.startedAt && task.completedAt) {
          return sum + (task.completedAt.getTime() - task.startedAt.getTime());
        }
        return sum;
      }, 0);
      
      const averageTaskTime = completedTasks.length > 0 
        ? totalExecutionTime / completedTasks.length 
        : 0;
      
      // 任务分类统计
      const taskBreakdown: Record<string, number> = {};
      allTasks.forEach(task => {
        const category = task.metadata?.category || 'unknown';
        taskBreakdown[category] = (taskBreakdown[category] || 0) + 1;
      });
      
      // 生成建议
      const recommendations: string[] = [];
      
      if (failedTasks.length > 0) {
        recommendations.push(`有 ${failedTasks.length} 个任务失败，建议检查错误日志`);
      }
      
      if (averageTaskTime > 60000) { // 超过1分钟
        recommendations.push('平均任务执行时间较长，建议优化任务复杂度');
      }
      
      const successRate = allTasks.length > 0 
        ? Math.round((completedTasks.length / allTasks.length) * 100) 
        : 0;
      
      if (successRate < 80) {
        recommendations.push('任务成功率较低，建议调整重试策略或任务分解粒度');
      }
      
      return {
        summary: {
          totalTasks: allTasks.length,
          completedTasks: completedTasks.length,
          failedTasks: failedTasks.length,
          successRate,
          totalExecutionTime,
          averageTaskTime
        },
        taskBreakdown,
        performanceMetrics: {
          peakConcurrency: 5, // 从配置获取
          averageMemoryUsage: process?.memoryUsage?.() ? process.memoryUsage().heapUsed / 1024 / 1024 : 0,
          totalRetries: allTasks.reduce((sum, task) => sum + (task.retryCount || 0), 0)
        },
        recommendations
      };
    } catch (error) {
      console.error('生成执行报告失败:', error);
      throw new Error(`生成执行报告失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 检查调度器状态
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      decomposer: this.decomposer ? '已初始化' : '未初始化',
      taskManager: this.taskManager ? '已初始化' : '未初始化',
      concurrencyLimit: 5,
      defaultTimeout: 300000
    };
  }
}

// 导出单例实例
export const schedulerAgent = new SchedulerAgent();