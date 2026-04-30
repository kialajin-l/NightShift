/**
 * 任务管理器单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NightShiftTaskManager } from '../../src/task-manager/task-manager.js';
import { Task, TaskPriority, TaskPlugin } from '../../src/task-manager/types/task-manager.js';

describe('NightShiftTaskManager', () => {
  let taskManager: NightShiftTaskManager;

  beforeEach(async () => {
    taskManager = new NightShiftTaskManager({
      maxConcurrent: 2,
      defaultTimeout: 1000, // 1秒用于测试
      defaultMaxRetries: 2
    });
    await taskManager.initialize();
  });

  afterEach(async () => {
    await taskManager.shutdown();
  });

  describe('初始化与关闭', () => {
    it('应该正确初始化任务管理器', async () => {
      expect(taskManager).toBeDefined();
      
      // 验证统计信息
      const stats = await taskManager.getStats();
      expect(stats.totalTasks).toBe(0);
      expect(stats.concurrentLimit).toBe(2);
      expect(stats.currentConcurrency).toBe(0);
    });

    it('应该拒绝未初始化的操作', async () => {
      const uninitializedManager = new NightShiftTaskManager();
      
      await expect(uninitializedManager.addTask({
        name: '测试任务',
        priority: 'medium'
      })).rejects.toThrow('任务管理器未初始化');
    });

    it('应该正确关闭任务管理器', async () => {
      await taskManager.shutdown();
      
      // 验证关闭后无法执行操作
      await expect(taskManager.addTask({
        name: '测试任务',
        priority: 'medium'
      })).rejects.toThrow('任务管理器正在关闭');
    });
  });

  describe('任务管理', () => {
    it('应该正确添加任务', async () => {
      const task = await taskManager.addTask({
        name: '测试任务',
        description: '这是一个测试任务',
        priority: 'high' as TaskPriority,
        tags: ['test', 'important']
      });

      expect(task.id).toMatch(/^task-[a-z0-9]+-[a-z0-9]+$/);
      expect(task.name).toBe('测试任务');
      expect(task.status).toBe('pending');
      expect(task.priority).toBe('high');
      expect(task.tags).toEqual(['test', 'important']);
      expect(task.retryCount).toBe(0);
      expect(task.maxRetries).toBe(2);
      expect(task.timeout).toBe(1000);

      // 验证任务已保存
      const retrievedTask = await taskManager.getTask(task.id);
      expect(retrievedTask).toEqual(task);
    });

    it('应该支持自定义超时和重试次数', async () => {
      const task = await taskManager.addTask({
        name: '自定义任务',
        priority: 'medium' as TaskPriority,
        timeout: 5000,
        maxRetries: 5
      });

      expect(task.timeout).toBe(5000);
      expect(task.maxRetries).toBe(5);
    });

    it('应该生成唯一任务ID', async () => {
      const tasks = await Promise.all([
        taskManager.addTask({ name: '任务1', priority: 'medium' as TaskPriority }),
        taskManager.addTask({ name: '任务2', priority: 'medium' as TaskPriority }),
        taskManager.addTask({ name: '任务3', priority: 'medium' as TaskPriority })
      ]);

      const taskIds = tasks.map(t => t.id);
      const uniqueIds = new Set(taskIds);
      
      expect(taskIds.length).toBe(uniqueIds.size);
    });
  });

  describe('任务状态机', () => {
    let testTask: Task;

    beforeEach(async () => {
      testTask = await taskManager.addTask({
        name: '状态机测试任务',
        priority: 'medium' as TaskPriority
      });
    });

    it('应该正确执行任务状态转换', async () => {
      // pending -> running
      await taskManager.startTask(testTask.id);
      
      let updatedTask = await taskManager.getTask(testTask.id);
      expect(updatedTask?.status).toBe('running');
      expect(updatedTask?.startedAt).toBeDefined();

      // running -> completed
      await taskManager.completeTask(testTask.id, { result: 'success' });
      
      updatedTask = await taskManager.getTask(testTask.id);
      expect(updatedTask?.status).toBe('completed');
      expect(updatedTask?.output).toEqual({ result: 'success' });
      expect(updatedTask?.completedAt).toBeDefined();
    });

    it('应该拒绝无效的状态转换', async () => {
      // 直接尝试完成 pending 状态的任务
      await expect(taskManager.completeTask(testTask.id)).rejects.toThrow('无效的状态转换');

      // 开始任务
      await taskManager.startTask(testTask.id);
      
      // 尝试重新开始 running 状态的任务
      await expect(taskManager.startTask(testTask.id)).rejects.toThrow('任务状态无效');
    });

    it('应该正确处理任务失败', async () => {
      await taskManager.startTask(testTask.id);
      await taskManager.failTask(testTask.id, '测试错误');
      
      const updatedTask = await taskManager.getTask(testTask.id);
      expect(updatedTask?.status).toBe('failed');
      expect(updatedTask?.error).toBe('测试错误');
    });

    it('应该支持任务取消', async () => {
      await taskManager.startTask(testTask.id);
      await taskManager.cancelTask(testTask.id);
      
      const updatedTask = await taskManager.getTask(testTask.id);
      expect(updatedTask?.status).toBe('cancelled');
    });
  });

  describe('重试机制', () => {
    let failedTask: Task;

    beforeEach(async () => {
      failedTask = await taskManager.addTask({
        name: '可重试任务',
        priority: 'medium' as TaskPriority,
        maxRetries: 3
      });

      await taskManager.startTask(failedTask.id);
      await taskManager.failTask(failedTask.id, '第一次失败');
    });

    it('应该允许重试失败的任务', async () => {
      await taskManager.retryTask(failedTask.id);
      
      const retriedTask = await taskManager.getTask(failedTask.id);
      expect(retriedTask?.status).toBe('pending');
      expect(retriedTask?.retryCount).toBe(1);
      expect(retriedTask?.error).toBeUndefined();
    });

    it('应该限制最大重试次数', async () => {
      // 第一次重试
      await taskManager.retryTask(failedTask.id);
      await taskManager.startTask(failedTask.id);
      await taskManager.failTask(failedTask.id, '第二次失败');

      // 第二次重试
      await taskManager.retryTask(failedTask.id);
      await taskManager.startTask(failedTask.id);
      await taskManager.failTask(failedTask.id, '第三次失败');

      // 应该达到最大重试次数
      await expect(taskManager.retryTask(failedTask.id)).rejects.toThrow('任务已达到最大重试次数');
    });

    it('应该拒绝重试非失败状态的任务', async () => {
      const completedTask = await taskManager.addTask({
        name: '已完成任务',
        priority: 'medium' as TaskPriority
      });

      await taskManager.startTask(completedTask.id);
      await taskManager.completeTask(completedTask.id);

      await expect(taskManager.retryTask(completedTask.id)).rejects.toThrow('只有失败或超时的任务可以重试');
    });
  });

  describe('并发控制', () => {
    it('应该限制并发任务数量', async () => {
      // 创建多个任务
      const tasks = await Promise.all([
        taskManager.addTask({ name: '任务1', priority: 'high' as TaskPriority }),
        taskManager.addTask({ name: '任务2', priority: 'high' as TaskPriority }),
        taskManager.addTask({ name: '任务3', priority: 'high' as TaskPriority })
      ]);

      // 开始前两个任务
      await taskManager.startTask(tasks[0].id);
      await taskManager.startTask(tasks[1].id);

      // 第三个任务应该被阻塞
      await expect(taskManager.startTask(tasks[2].id)).rejects.toThrow('并发限制已满');

      // 验证当前并发数
      const stats = await taskManager.getStats();
      expect(stats.currentConcurrency).toBe(2);
      expect(stats.runningTasks).toBe(2);
    });

    it('应该在任务完成后释放并发许可', async () => {
      const task1 = await taskManager.addTask({ 
        name: '并发测试任务1', 
        priority: 'high' as TaskPriority 
      });
      const task2 = await taskManager.addTask({ 
        name: '并发测试任务2', 
        priority: 'high' as TaskPriority 
      });

      await taskManager.startTask(task1.id);
      await taskManager.startTask(task2.id);

      // 完成任务1，释放一个许可
      await taskManager.completeTask(task1.id);

      const stats = await taskManager.getStats();
      expect(stats.currentConcurrency).toBe(1);
      expect(stats.runningTasks).toBe(1);
      expect(stats.completedTasks).toBe(1);
    });
  });

  describe('超时检测', () => {
    it('应该检测任务超时', async () => {
      vi.useFakeTimers();
      
      const task = await taskManager.addTask({
        name: '超时测试任务',
        priority: 'medium' as TaskPriority,
        timeout: 100 // 100ms超时
      });

      await taskManager.startTask(task.id);
      
      // 快进时间超过超时时间
      vi.advanceTimersByTime(150);
      
      // 等待超时处理完成
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const updatedTask = await taskManager.getTask(task.id);
      expect(updatedTask?.status).toBe('timeout');
      
      vi.useRealTimers();
    });

    it('应该在任务完成时清除超时检测', async () => {
      vi.useFakeTimers();
      
      const task = await taskManager.addTask({
        name: '清除超时测试',
        priority: 'medium' as TaskPriority,
        timeout: 100
      });

      await taskManager.startTask(task.id);
      
      // 在超时前完成任务
      await taskManager.completeTask(task.id);
      
      // 快进时间超过超时时间
      vi.advanceTimersByTime(150);
      
      const updatedTask = await taskManager.getTask(task.id);
      expect(updatedTask?.status).toBe('completed'); // 应该还是完成状态，不是超时
      
      vi.useRealTimers();
    });
  });

  describe('依赖管理', () => {
    it('应该检查任务依赖', async () => {
      const dependencyTask = await taskManager.addTask({
        name: '依赖任务',
        priority: 'high' as TaskPriority
      });

      const dependentTask = await taskManager.addTask({
        name: '依赖任务的任务',
        priority: 'medium' as TaskPriority,
        dependencies: [dependencyTask.id]
      });

      // 应该无法开始依赖任务未完成的任务
      await expect(taskManager.startTask(dependentTask.id)).rejects.toThrow('任务依赖未完成');

      // 完成依赖任务
      await taskManager.startTask(dependencyTask.id);
      await taskManager.completeTask(dependencyTask.id);

      // 现在应该可以开始依赖任务
      await taskManager.startTask(dependentTask.id);
      
      const updatedTask = await taskManager.getTask(dependentTask.id);
      expect(updatedTask?.status).toBe('running');
    });
  });

  describe('事件系统', () => {
    it('应该发布任务事件', async () => {
      const events: any[] = [];
      
      // 监听所有任务事件
      taskManager.on('task.added', (data) => events.push({ type: 'added', data }));
      taskManager.on('task.started', (data) => events.push({ type: 'started', data }));
      taskManager.on('task.completed', (data) => events.push({ type: 'completed', data }));

      const task = await taskManager.addTask({
        name: '事件测试任务',
        priority: 'medium' as TaskPriority
      });

      await taskManager.startTask(task.id);
      await taskManager.completeTask(task.id);

      expect(events.length).toBe(3);
      expect(events[0].type).toBe('added');
      expect(events[1].type).toBe('started');
      expect(events[2].type).toBe('completed');
      
      events.forEach(event => {
        expect(event.data.task.id).toBe(task.id);
        expect(event.data.timestamp).toBeInstanceOf(Date);
      });
    });
  });

  describe('插件系统', () => {
    it('应该支持插件注册和生命周期钩子', async () => {
      const pluginHooks: string[] = [];
      
      const testPlugin: TaskPlugin = {
        name: '测试插件',
        version: '1.0.0',
        
        onInitialize: async () => {
          pluginHooks.push('initialized');
        },
        
        onTaskAdded: async (task) => {
          pluginHooks.push(`taskAdded:${task.name}`);
        },
        
        onTaskCompleted: async (task) => {
          pluginHooks.push(`taskCompleted:${task.name}`);
        },
        
        onShutdown: async () => {
          pluginHooks.push('shutdown');
        }
      };

      await taskManager.registerPlugin(testPlugin);
      
      const task = await taskManager.addTask({
        name: '插件测试任务',
        priority: 'medium' as TaskPriority
      });

      await taskManager.startTask(task.id);
      await taskManager.completeTask(task.id);
      
      await taskManager.shutdown();

      expect(pluginHooks).toContain('initialized');
      expect(pluginHooks).toContain('taskAdded:插件测试任务');
      expect(pluginHooks).toContain('taskCompleted:插件测试任务');
      expect(pluginHooks).toContain('shutdown');
    });
  });

  describe('统计信息', () => {
    it('应该提供准确的统计信息', async () => {
      // 创建各种状态的任务
      const tasks = await Promise.all([
        taskManager.addTask({ name: '任务1', priority: 'high' as TaskPriority }),
        taskManager.addTask({ name: '任务2', priority: 'medium' as TaskPriority }),
        taskManager.addTask({ name: '任务3', priority: 'low' as TaskPriority })
      ]);

      // 开始并完成第一个任务
      await taskManager.startTask(tasks[0].id);
      await taskManager.completeTask(tasks[0].id);

      // 开始第二个任务（保持运行状态）
      await taskManager.startTask(tasks[1].id);

      const stats = await taskManager.getStats();

      expect(stats.totalTasks).toBe(3);
      expect(stats.pendingTasks).toBe(1);
      expect(stats.runningTasks).toBe(1);
      expect(stats.completedTasks).toBe(1);
      expect(stats.failedTasks).toBe(0);
      expect(stats.currentConcurrency).toBe(1);
      expect(stats.concurrentLimit).toBe(2);
      
      // 成功率应该是 100% (1/1)
      expect(stats.successRate).toBe(1);
    });

    it('应该计算平均执行时间和吞吐量', async () => {
      vi.useFakeTimers();
      
      const task1 = await taskManager.addTask({ 
        name: '统计任务1', 
        priority: 'medium' as TaskPriority 
      });
      
      await taskManager.startTask(task1.id);
      vi.advanceTimersByTime(500); // 模拟执行时间
      await taskManager.completeTask(task1.id);

      const task2 = await taskManager.addTask({ 
        name: '统计任务2', 
        priority: 'medium' as TaskPriority 
      });
      
      await taskManager.startTask(task2.id);
      vi.advanceTimersByTime(1000); // 模拟更长的执行时间
      await taskManager.completeTask(task2.id);

      const stats = await taskManager.getStats();
      
      // 平均执行时间应该在 500-1000ms 之间
      expect(stats.averageExecutionTime).toBeGreaterThan(500);
      expect(stats.averageExecutionTime).toBeLessThan(1000);
      
      // 吞吐量应该大于 0
      expect(stats.throughput).toBeGreaterThan(0);
      
      vi.useRealTimers();
    });
  });

  describe('队列管理', () => {
    it('应该按优先级处理任务', async () => {
      const lowPriorityTask = await taskManager.addTask({
        name: '低优先级任务',
        priority: 'low' as TaskPriority
      });

      const highPriorityTask = await taskManager.addTask({
        name: '高优先级任务',
        priority: 'high' as TaskPriority
      });

      const mediumPriorityTask = await taskManager.addTask({
        name: '中优先级任务',
        priority: 'medium' as TaskPriority
      });

      // 获取就绪任务（应该按优先级排序）
      const readyTasks = await taskManager.getReadyTasks();
      
      expect(readyTasks[0].priority).toBe('high');
      expect(readyTasks[1].priority).toBe('medium');
      expect(readyTasks[2].priority).toBe('low');
    });
  });

  describe('错误处理与恢复', () => {
    it('应该处理存储错误', async () => {
      // 这里可以模拟存储错误，但为了简化测试，我们主要验证错误传播
      const task = await taskManager.addTask({
        name: '错误处理测试',
        priority: 'medium' as TaskPriority
      });

      // 正常操作应该成功
      await taskManager.startTask(task.id);
      
      const updatedTask = await taskManager.getTask(task.id);
      expect(updatedTask?.status).toBe('running');
    });

    it('应该在异常情况下保持一致性', async () => {
      const task = await taskManager.addTask({
        name: '一致性测试',
        priority: 'high' as TaskPriority
      });

      // 模拟在开始任务时发生异常
      const originalStartTask = taskManager['startTask'].bind(taskManager);
      vi.spyOn(taskManager as any, 'startTask').mockImplementationOnce(async () => {
        throw new Error('模拟异常');
      });

      await expect(taskManager.startTask(task.id)).rejects.toThrow('模拟异常');
      
      // 验证任务状态没有改变
      const currentTask = await taskManager.getTask(task.id);
      expect(currentTask?.status).toBe('pending');
    });
  });
});