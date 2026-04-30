/**
 * 任务管理器 - SQLite 持久化
 * 基于现有的数据库结构，扩展支持 NightShift 复杂任务管理
 */

import Database from 'better-sqlite3';
import { getDb } from './db';
import { 
  Task, 
  TaskStatus, 
  TaskPriority, 
  TaskType, 
  TaskOutput 
} from './types/task-types';

// 定义 TaskAgent 类型
type TaskAgent = 'frontend' | 'backend' | 'fullstack' | 'devops' | 'ai';

interface TaskManagerConfig {
  maxConcurrent?: number;
  defaultTimeout?: number;
  defaultMaxRetries?: number;
  dbPath?: string;
}

// 扩展 Task 类型以包含数据库字段
interface TaskWithSession extends Task {
  sessionId?: string;
  errorMessage?: string;
}

class TaskManager {
  private db: Database.Database;
  private config: Required<TaskManagerConfig>;
  private logger: Console;

  constructor(config: TaskManagerConfig = {}) {
    this.db = getDb();
    this.config = {
      maxConcurrent: config.maxConcurrent || 5,
      defaultTimeout: config.defaultTimeout || 300000, // 5分钟
      defaultMaxRetries: config.defaultMaxRetries || 3,
      dbPath: config.dbPath || './data/nightshift.db'
    };
    this.logger = console;
    
    this.initializeTables();
  }

  private initializeTables(): void {
    // 扩展现有的 tasks 表，添加 NightShift 需要的字段
    this.db.exec(`
      -- 扩展 tasks 表，添加 NightShift 专用字段
      CREATE TABLE IF NOT EXISTS nightshift_tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL DEFAULT 'infrastructure',
        agent TEXT NOT NULL DEFAULT 'fullstack',
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
        priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
        estimated_time INTEGER NOT NULL DEFAULT 30,
        dependencies TEXT NOT NULL DEFAULT '[]',
        input TEXT NOT NULL DEFAULT '{}',
        output TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        started_at TEXT,
        completed_at TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        session_id TEXT,
        parent_task_id TEXT,
        
        -- 索引
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL,
        FOREIGN KEY (parent_task_id) REFERENCES nightshift_tasks(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_nightshift_tasks_status ON nightshift_tasks(status);
      CREATE INDEX IF NOT EXISTS idx_nightshift_tasks_agent ON nightshift_tasks(agent);
      CREATE INDEX IF NOT EXISTS idx_nightshift_tasks_priority ON nightshift_tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_nightshift_tasks_session ON nightshift_tasks(session_id);
      CREATE INDEX IF NOT EXISTS idx_nightshift_tasks_parent ON nightshift_tasks(parent_task_id);
      CREATE INDEX IF NOT EXISTS idx_nightshift_tasks_created ON nightshift_tasks(created_at);
    `);
  }

  async addTask(task: Omit<TaskWithSession, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    const taskId = this.generateTaskId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO nightshift_tasks (
        id, name, description, type, agent, status, priority, estimated_time,
        dependencies, input, tags, created_at, updated_at, session_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        taskId,
        task.name,
        task.description,
        task.type,
        task.agent,
        'pending', // 初始状态
        task.priority,
        task.estimatedTime,
        JSON.stringify(task.dependencies),
        JSON.stringify(task.input),
        JSON.stringify(task.tags),
        now,
        now,
        task.sessionId || null
      );

      this.logger.log(`[TaskManager] 任务已添加: ${taskId} - ${task.name}`);
      return taskId;

    } catch (error) {
      this.logger.error(`[TaskManager] 添加任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
      throw error;
    }
  }

  async getTask(id: string): Promise<TaskWithSession | null> {
    const stmt = this.db.prepare('SELECT * FROM nightshift_tasks WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      return null;
    }

    return this.rowToTask(row);
  }

  async updateTaskStatus(id: string, status: TaskStatus, output?: TaskOutput): Promise<void> {
    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [now];

    updates.push('status = ?');
    params.push(status);

    if (status === 'running') {
      updates.push('started_at = ?');
      params.push(now);
    } else if (status === 'completed' || status === 'failed') {
      updates.push('completed_at = ?');
      params.push(now);
    }

    if (output) {
      updates.push('output = ?');
      params.push(JSON.stringify(output));
    }

    if (status === 'failed') {
      updates.push('retry_count = retry_count + 1');
      if (output?.error) {
        updates.push('error_message = ?');
        params.push(output.error);
      }
    }

    const stmt = this.db.prepare(`
      UPDATE nightshift_tasks 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);

    params.push(id);
    
    try {
      stmt.run(...params);
      this.logger.log(`[TaskManager] 任务状态已更新: ${id} -> ${status}`);
    } catch (error) {
      this.logger.error(`[TaskManager] 更新任务状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
      throw error;
    }
  }

  async getPendingTasks(): Promise<TaskWithSession[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM nightshift_tasks 
      WHERE status = 'pending' 
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END,
        created_at ASC
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => this.rowToTask(row));
  }

  async getTasksByAgent(agent: TaskAgent): Promise<TaskWithSession[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM nightshift_tasks 
      WHERE agent = ? 
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(agent) as any[];
    return rows.map(row => this.rowToTask(row));
  }

  async getTaskProgress(): Promise<{
    total: number;
    completed: number;
    running: number;
    failed: number;
    pending: number;
    progress: number;
  }> {
    const stmt = this.db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM nightshift_tasks 
      GROUP BY status
    `);

    const rows = stmt.all() as Array<{ status: string; count: number }>;
    
    const counts = {
      total: 0,
      completed: 0,
      running: 0,
      failed: 0,
      pending: 0
    };

    for (const row of rows) {
      counts.total += row.count;
      switch (row.status) {
        case 'completed': counts.completed += row.count; break;
        case 'running': counts.running += row.count; break;
        case 'failed': counts.failed += row.count; break;
        case 'pending': counts.pending += row.count; break;
      }
    }

    const progress = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

    return {
      ...counts,
      progress
    };
  }

  async getTaskDependencies(id: string): Promise<string[]> {
    const task = await this.getTask(id);
    return task ? task.dependencies : [];
  }

  async getAllTasks(): Promise<TaskWithSession[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM nightshift_tasks 
      ORDER BY created_at DESC
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => this.rowToTask(row));
  }

  async retryTask(id: string): Promise<void> {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`任务不存在: ${id}`);
    }

    if (task.status !== 'failed') {
      throw new Error(`只能重试失败的任务: ${id}`);
    }

    await this.updateTaskStatus(id, 'pending');
    this.logger.log(`[TaskManager] 任务已重试: ${id}`);
  }

  async cancelTask(id: string): Promise<void> {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`任务不存在: ${id}`);
    }

    if (task.status === 'completed' || task.status === 'failed') {
      throw new Error(`无法取消已完成或失败的任务: ${id}`);
    }

    await this.updateTaskStatus(id, 'cancelled');
    this.logger.log(`[TaskManager] 任务已取消: ${id}`);
  }

  async reset(): Promise<void> {
    try {
      this.db.exec('DELETE FROM nightshift_tasks');
      this.logger.log('[TaskManager] 所有任务已重置');
    } catch (error) {
      this.logger.error(`[TaskManager] 重置任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
      throw error;
    }
  }

  // 获取可执行的任务（依赖已完成的）
  async getExecutableTasks(): Promise<TaskWithSession[]> {
    const allTasks = await this.getAllTasks();
    const completedTaskIds = new Set(
      allTasks.filter(t => t.status === 'completed').map(t => t.id)
    );

    return allTasks.filter(task => {
      if (task.status !== 'pending') return false;
      
      // 检查所有依赖是否已完成
      return task.dependencies.every(depId => completedTaskIds.has(depId));
    });
  }

  // 估算剩余时间
  async getEstimatedRemainingTime(): Promise<number> {
    const pendingTasks = await this.getPendingTasks();
    const runningTasks = (await this.getAllTasks()).filter(t => t.status === 'running');
    
    // 计算运行中任务的剩余时间
    let remainingTime = 0;
    
    for (const task of runningTasks) {
      if (task.startedAt) {
        const elapsed = Date.now() - task.startedAt.getTime();
        const remaining = Math.max(0, task.estimatedTime * 60000 - elapsed); // 转换为毫秒
        remainingTime += remaining;
      }
    }
    
    // 添加待处理任务的预估时间
    for (const task of pendingTasks) {
      remainingTime += task.estimatedTime * 60000;
    }
    
    return Math.round(remainingTime / 60000); // 转换回分钟
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private rowToTask(row: any): TaskWithSession {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      type: row.type as TaskType,
      agent: row.agent as TaskAgent,
      status: row.status as TaskStatus,
      priority: row.priority as TaskPriority,
      estimatedTime: row.estimated_time,
      dependencies: JSON.parse(row.dependencies || '[]'),
      input: JSON.parse(row.input || '{}'),
      output: row.output ? JSON.parse(row.output) : undefined,
      tags: JSON.parse(row.tags || '[]'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      retryCount: row.retry_count || 0,
      errorMessage: row.error_message,
      sessionId: row.session_id || undefined,
      // 添加缺失的必填字段
      technology: {
        frontend: { framework: 'react', language: 'javascript', styling: 'css' },
        backend: { framework: 'express', language: 'javascript', database: 'postgresql' }
      },
      metadata: {}
    };
  }

  // 统计信息
  async getStats(): Promise<{
    concurrencyLimit: number;
    activeTasks: number;
    totalTasks: number;
    averageCompletionTime: number;
    successRate: number;
  }> {
    const progress = await this.getTaskProgress();
    const allTasks = await this.getAllTasks();
    
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const totalCompletionTime = completedTasks.reduce((sum, task) => {
      if (task.startedAt && task.completedAt) {
        return sum + (task.completedAt.getTime() - task.startedAt.getTime());
      }
      return sum;
    }, 0);
    
    const averageCompletionTime = completedTasks.length > 0 
      ? Math.round(totalCompletionTime / completedTasks.length / 1000) // 转换为秒
      : 0;
    
    const successRate = progress.total > 0 
      ? Math.round((progress.completed / progress.total) * 100) 
      : 0;

    return {
      concurrencyLimit: this.config.maxConcurrent,
      activeTasks: progress.running,
      totalTasks: progress.total,
      averageCompletionTime,
      successRate
    };
  }

  // 检查任务管理器是否正在运行
  isRunning(): boolean {
    // 简单的运行状态检查
    return true; // 总是返回 true，因为这是一个持久化管理器
  }

  // 关闭任务管理器
  async shutdown(): Promise<void> {
    this.logger.log('[TaskManager] 任务管理器正在关闭...');
    // 这里可以添加清理逻辑，但 better-sqlite3 不需要显式关闭
  }
}

export default TaskManager;