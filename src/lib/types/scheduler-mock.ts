// scheduler-mock.ts 修改后
// 重新导出统一的Task类型定义，保留Mock实现类

import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskDAG,
  TaskDecompositionResult,
  TaskDecomposer,
  TaskManager,
  TaskManagerStats,
  TaskOutput,
  ExecutionContext,
  ExecutionResult,
  ValidationResult,
  Skill,
  SkillInput,
  SkillContext,
  SkillOutput
} from './task-types';

export type { 
  Task, TaskStatus, TaskPriority, TaskType, TaskDAG, 
  TaskDecompositionResult, TaskDecomposer, TaskManager,
  TaskManagerStats, TaskOutput, ExecutionContext, ExecutionResult,
  ValidationResult, Skill, SkillInput, SkillContext, SkillOutput
} from './task-types';

/**
 * 模拟任务分解器实现
 */
export class MockTaskDecomposer implements TaskDecomposer {
  async decompose(params: { text: string; context: any }): Promise<TaskDecompositionResult> {
    // 模拟任务分解逻辑
    const taskId = `mock-task-${Date.now()}`;
    const subtasks: Task[] = [
      {
        id: `${taskId}-subtask-1`,
        name: `子任务 1`,
        description: `分解自任务: ${params.text.substring(0, 50)}...`,
        type: 'component_generation' as const,
        status: 'pending' as const,
        priority: 'medium' as const,
        input: {
          requirements: params.text
        },
        technology: {},
        dependencies: [],
        metadata: { parentTask: taskId },
        agent: 'frontend',
        tags: [],
        estimatedTime: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `${taskId}-subtask-2`,
        name: `子任务 2`,
        description: `分解自任务: ${params.text.substring(0, 50)}...`,
        type: 'api_implementation' as const,
        status: 'pending' as const,
        priority: 'medium' as const,
        input: {
          requirements: params.text
        },
        technology: {},
        dependencies: [`${taskId}-subtask-1`],
        metadata: { parentTask: taskId },
        agent: 'backend',
        tags: [],
        estimatedTime: 45,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const dag: TaskDAG = {
      nodes: subtasks,
      edges: [
        { from: `${taskId}-subtask-1`, to: `${taskId}-subtask-2` }
      ],
      estimatedTime: 75
    };

    return {
      success: true,
      decomposedTasks: subtasks,
      dag,
      metadata: {
        decompositionMethod: 'mock',
        decomposedAt: new Date().toISOString()
      }
    };
  }
}

/**
 * 模拟任务管理器实现
 */
export class MockTaskManager implements TaskManager {
  private tasks: Map<string, Task> = new Map();
  private config: {
    maxConcurrent: number;
    defaultTimeout: number;
    defaultMaxRetries: number;
  };

  constructor(config: {
    maxConcurrent: number;
    defaultTimeout: number;
    defaultMaxRetries: number;
  }) {
    this.config = config;
  }

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
      task.updatedAt = new Date();
      if (output) {
        task.output = output;
      }
      this.tasks.set(id, task);
    }
  }

  async getPendingTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      task.status === 'pending'
    );
  }

  async getTaskDependencies(id: string): Promise<string[]> {
    const task = this.tasks.get(id);
    return task ? task.dependencies : [];
  }

  // v1.0 新增方法实现
  async start(): Promise<void> {
    console.log('MockTaskManager started');
  }

  async shutdown(): Promise<void> {
    console.log('MockTaskManager shutdown');
  }

  isRunning(): boolean {
    return true;
  }

  getStats(): TaskManagerStats {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length
    };
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  async retryTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'pending';
      task.retryCount = (task.retryCount || 0) + 1;
      task.updatedAt = new Date();
      return true;
    }
    return false;
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'cancelled';
      task.updatedAt = new Date();
      return true;
    }
    return false;
  }
}