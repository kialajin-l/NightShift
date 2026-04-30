// NightShift 调度器集成服务

import { TaskDecomposer, TaskManager, Task, TaskDAG, TaskDecompositionResult, TaskAgent } from './mock-scheduler';

// 适配器类型：将mock调度器的Task类型转换为集成服务的Task类型
type MockTask = {
  id: string;
  status?: string;
  progress?: number;
  [key: string]: any;
};

// 类型转换函数
function convertMockTaskToTask(mockTask: MockTask): Task {
  return {
    id: mockTask.id,
    title: mockTask.id,
    description: `任务 ${mockTask.id}`,
    estimatedTime: 0,
    priority: 'medium' as const,
    dependencies: [],
    requiredSkills: [],
    estimatedEffort: 1,
    riskLevel: 'low' as const,
    deliverables: []
  };
}
import { getWebSocketService } from './websocket-service';

/**
 * 调度器集成配置
 */
export interface SchedulerIntegrationConfig {
  maxConcurrentTasks: number;
  defaultTimeout: number;
  maxRetries: number;
  enableRealTimeUpdates: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 调度器集成服务
 */
export class SchedulerIntegration {
  private config: SchedulerIntegrationConfig;
  private decomposer: TaskDecomposer;
  private taskManager: TaskManager;
  private isInitialized: boolean = false;
  private activeTasks: Map<string, Task> = new Map();
  
  constructor(config?: Partial<SchedulerIntegrationConfig>) {
    this.config = {
      maxConcurrentTasks: 5,
      defaultTimeout: 300000, // 5分钟
      maxRetries: 3,
      enableRealTimeUpdates: true,
      logLevel: 'info',
      ...config
    };
    
    this.decomposer = new TaskDecomposer();
    this.taskManager = new TaskManager();
  }

  /**
   * 初始化调度器集成
   */
  async initialize(): Promise<void> {
    try {
      this.log('info', '初始化调度器集成服务...');
      
      // 初始化 WebSocket 服务
      if (this.config.enableRealTimeUpdates) {
        await this.initializeWebSocket();
      }
      
      // 注册任务处理器
      await this.registerTaskHandlers();
      
      this.isInitialized = true;
      this.log('info', '调度器集成服务初始化完成');
      
    } catch (error) {
      this.log('error', `调度器集成初始化失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 初始化 WebSocket 服务
   */
  private async initializeWebSocket(): Promise<void> {
    if (typeof window !== 'undefined') {
      const wsService = getWebSocketService();
      
      // 监听连接事件
      wsService.on('connected', () => {
        this.log('info', 'WebSocket 连接已建立');
      });
      
      // 监听断开事件
      wsService.on('disconnected', (event) => {
        this.log('warn', `WebSocket 连接已断开: ${event}`);
      });
      
      // 尝试连接
      await wsService.connect();
    }
  }

  /**
   * 注册任务处理器
   */
  private async registerTaskHandlers(): Promise<void> {
    // 注册前端开发任务处理器
    this.taskManager.registerHandler('frontend-development', async (task: Task) => {
      this.log('info', `开始处理前端开发任务: ${task.name}`);
      
      // 模拟前端开发任务处理
      await this.simulateTaskProcessing(task, 2000);
      
      return {
        success: true,
        result: {
          code: '// 前端组件代码\nconst MyComponent = () => {\n  return <div>Hello World</div>;\n}',
          files: ['src/components/MyComponent.tsx'],
          dependencies: ['react', 'typescript']
        }
      };
    });
    
    // 注册后端开发任务处理器
    this.taskManager.registerHandler('backend-development', async (task: Task) => {
      this.log('info', `开始处理后端开发任务: ${task.name}`);
      
      // 模拟后端开发任务处理
      await this.simulateTaskProcessing(task, 3000);
      
      return {
        success: true,
        result: {
          code: '// API 路由代码\napp.get("/api/data", (req, res) => {\n  res.json({ data: "Hello World" });\n});',
          files: ['src/routes/api.ts'],
          dependencies: ['express', 'typescript']
        }
      };
    });
    
    // 注册测试任务处理器
    this.taskManager.registerHandler('testing', async (task: Task) => {
      this.log('info', `开始处理测试任务: ${task.name}`);
      
      // 模拟测试任务处理
      await this.simulateTaskProcessing(task, 1500);
      
      return {
        success: true,
        result: {
          code: '// 测试代码\ndescribe("MyComponent", () => {\n  it("should render correctly", () => {\n    expect(true).toBe(true);\n  });\n});',
          files: ['src/tests/MyComponent.test.ts'],
          dependencies: ['jest', '@testing-library/react']
        }
      };
    });
    
    // 注册文档任务处理器
    this.taskManager.registerHandler('documentation', async (task: Task) => {
      this.log('info', `开始处理文档任务: ${task.name}`);
      
      // 模拟文档任务处理
      await this.simulateTaskProcessing(task, 1000);
      
      return {
        success: true,
        result: {
          content: '# 文档说明\n\n这是一个自动生成的文档。',
          files: ['docs/README.md']
        }
      };
    });
    
    this.log('info', '任务处理器注册完成');
  }

  /**
   * 模拟任务处理
   */
  private async simulateTaskProcessing(task: Task, duration: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.log('debug', `任务处理完成: ${task.name}`);
        resolve();
      }, duration);
    });
  }

  /**
   * 分解任务需求
   */
  async decomposeTask(requirement: string): Promise<TaskDecompositionResult> {
    if (!this.isInitialized) {
      throw new Error('调度器集成服务未初始化');
    }
    
    try {
      this.log('info', `开始分解任务需求: ${requirement.substring(0, 50)}...`);
      
      const result = await this.decomposer.decompose(requirement);
      
      this.log('info', `任务分解完成: ${result.tasks.length} 个子任务`);
      
      return result;
    } catch (error) {
      this.log('error', `任务分解失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 调度任务执行
   */
  async scheduleTasks(dag: TaskDAG): Promise<{
    scheduledTasks: Task[];
    estimatedTime: number;
    totalTasks: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('调度器集成服务未初始化');
    }
    
    try {
      this.log('info', `开始调度任务: ${dag.tasks.length} 个任务`);
      
      // 添加任务到任务管理器
      const scheduledTasks: Task[] = [];
      let estimatedTime = 0;
      
      for (const task of dag.tasks) {
        const scheduledTask = await this.taskManager.addTask(task);
        scheduledTasks.push(scheduledTask);
        estimatedTime += task.estimatedTime || 0;
        
        // 跟踪活跃任务
        this.activeTasks.set(scheduledTask.id, scheduledTask);
      }
      
      this.log('info', `任务调度完成: ${scheduledTasks.length} 个任务已安排`);
      
      return {
        scheduledTasks,
        estimatedTime,
        totalTasks: scheduledTasks.length
      };
    } catch (error) {
      this.log('error', `任务调度失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId: string): Promise<Task | null> {
    if (!this.isInitialized) {
      throw new Error('调度器集成服务未初始化');
    }
    
    try {
      const task = this.activeTasks.get(taskId);
      if (task) {
        return convertMockTaskToTask(task);
      }
      
      // 从任务管理器获取任务状态
      const mockTask = await this.taskManager.getTask(taskId);
      return mockTask ? convertMockTaskToTask(mockTask) : null;
    } catch (error) {
      this.log('error', `获取任务状态失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * 获取所有任务状态
   */
  async getAllTaskStatus(): Promise<Task[]> {
    if (!this.isInitialized) {
      throw new Error('调度器集成服务未初始化');
    }
    
    try {
      // 获取所有活跃任务
      const activeTasks = Array.from(this.activeTasks.values()).map(convertMockTaskToTask);
      
      // 从任务管理器获取已完成的任务
      const mockTasks = await this.taskManager.getTasks();
      const completedTasks = mockTasks.map(convertMockTaskToTask);
      
      // 合并任务列表，去除重复
      const allTasks = [...activeTasks, ...completedTasks];
      const uniqueTasks = allTasks.filter((task, index, self) => 
        index === self.findIndex(t => t.id === task.id)
      );
      
      this.log('debug', `获取到 ${uniqueTasks.length} 个任务状态`);
      return uniqueTasks;
    } catch (error) {
      this.log('error', `获取任务状态失败: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('调度器集成服务未初始化');
    }
    
    try {
      const result = await this.taskManager.cancelTask(taskId);
      const success = result && (result as any).status === 'cancelled';
      if (success) {
        this.activeTasks.delete(taskId);
        this.log('info', `任务已取消: ${taskId}`);
      }
      return success;
    } catch (error) {
      this.log('error', `取消任务失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * 获取调度器统计信息
   */
  async getSchedulerStats(): Promise<{
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskTime: number;
    throughput: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('调度器集成服务未初始化');
    }
    
    try {
      const tasks = await this.getAllTaskStatus();
      
      // 由于Task接口没有status字段，我们使用mock任务的状态信息
      const activeTasks = Array.from(this.activeTasks.values());
      const completedTasks = await this.taskManager.getTasks();
      
      const stats = {
        totalTasks: tasks.length,
        activeTasks: activeTasks.filter(t => t.status === 'running' || t.status === 'pending').length,
        completedTasks: completedTasks.filter(t => t.status === 'completed').length,
        failedTasks: completedTasks.filter(t => t.status === 'failed').length,
        averageTaskTime: 0,
        throughput: 0
      };
      
      // 计算平均任务时间（简化处理）
      if (completedTasks.length > 0) {
        stats.averageTaskTime = 1000; // 默认值
      }
      
      // 计算吞吐量（任务/分钟）
      if (completedTasks.length > 0) {
        const firstTask = completedTasks[0];
        if (firstTask && firstTask.createdAt) {
          const timeDiff = Date.now() - new Date(firstTask.createdAt).getTime();
          if (timeDiff > 0) {
            stats.throughput = (completedTasks.length / (timeDiff / 60000));
          }
        }
      }
      
      this.log('debug', '调度器统计信息已生成');
      return stats;
    } catch (error) {
      this.log('error', `获取调度器统计失败: ${error instanceof Error ? error.message : String(error)}`);
      return {
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageTaskTime: 0,
        throughput: 0
      };
    }
  }

  /**
   * 重置调度器
   */
  async reset(): Promise<void> {
    try {
      this.log('info', '重置调度器集成服务...');
      
      // 取消所有活跃任务
      for (const taskId of this.activeTasks.keys()) {
        await this.cancelTask(taskId);
      }
      
      // 清空活跃任务列表
      this.activeTasks.clear();
      
      // 重置任务管理器（如果存在reset方法）
      if (typeof this.taskManager.reset === 'function') {
        await this.taskManager.reset();
      }
      
      this.isInitialized = false;
      this.log('info', '调度器集成服务重置完成');
    } catch (error) {
      this.log('error', `重置调度器失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
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
      console.log(`[${timestamp}] [SchedulerIntegration] [${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * 获取配置
   */
  getConfig(): SchedulerIntegrationConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<SchedulerIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', '调度器集成配置已更新');
  }
}