/**
 * 任务管理器演示脚本
 * 展示 NightShift 任务管理器的核心功能
 */

import { NightShiftTaskManager } from '../src/task-manager/task-manager.js';
import { TaskPriority, TaskPlugin } from '../src/task-manager/types/task-manager.js';

/**
 * 示例插件：日志记录插件
 */
class LoggingPlugin implements TaskPlugin {
  name = 'LoggingPlugin';
  version = '1.0.0';

  async onTaskAdded(task: any): Promise<void> {
    console.log(`[插件] 任务已添加: ${task.name} (${task.id})`);
  }

  async onTaskStarted(task: any): Promise<void> {
    console.log(`[插件] 任务已开始: ${task.name} (${task.id})`);
  }

  async onTaskCompleted(task: any): Promise<void> {
    console.log(`[插件] 任务已完成: ${task.name} (${task.id})`);
  }

  async onTaskFailed(task: any): Promise<void> {
    console.log(`[插件] 任务已失败: ${task.name} (${task.id}) - ${task.error}`);
  }
}

/**
 * 示例插件：统计插件
 */
class StatisticsPlugin implements TaskPlugin {
  name = 'StatisticsPlugin';
  version = '1.0.0';
  
  private taskCount = 0;
  private successCount = 0;

  async onTaskAdded(task: any): Promise<void> {
    this.taskCount++;
  }

  async onTaskCompleted(task: any): Promise<void> {
    this.successCount++;
  }

  async onShutdown(): Promise<void> {
    const successRate = this.taskCount > 0 ? (this.successCount / this.taskCount * 100).toFixed(1) : '0';
    console.log(`[统计插件] 总任务数: ${this.taskCount}, 成功率: ${successRate}%`);
  }
}

async function demonstrateTaskManager() {
  console.log('🚀 NightShift 任务管理器演示\n');
  
  // 创建任务管理器实例
  const taskManager = new NightShiftTaskManager({
    maxConcurrent: 3,           // 最大并发数
    defaultTimeout: 30 * 1000,  // 默认超时时间 30秒
    defaultMaxRetries: 2        // 默认最大重试次数
  });

  // 注册插件
  await taskManager.registerPlugin(new LoggingPlugin());
  await taskManager.registerPlugin(new StatisticsPlugin());

  // 初始化任务管理器
  await taskManager.initialize();
  
  console.log('📊 初始统计信息:');
  const initialStats = await taskManager.getStats();
  console.log(`- 并发限制: ${initialStats.concurrentLimit}`);
  console.log(`- 默认超时: ${initialStats.concurrentLimit}ms`);
  console.log(`- 当前并发: ${initialStats.currentConcurrency}\n`);

  // 示例 1: 基本任务管理
  console.log('📝 示例 1: 基本任务管理');
  console.log('='.repeat(60));
  
  const task1 = await taskManager.addTask({
    name: '用户登录功能开发',
    description: '实现用户登录界面和认证逻辑',
    priority: 'high' as TaskPriority,
    tags: ['frontend', 'authentication'],
    metadata: {
      assignee: 'developer1',
      project: '用户管理系统'
    }
  });

  const task2 = await taskManager.addTask({
    name: '数据库设计',
    description: '设计用户表和权限表',
    priority: 'critical' as TaskPriority,
    tags: ['backend', 'database'],
    timeout: 60 * 1000, // 1分钟超时
    maxRetries: 1
  });

  console.log('✅ 任务添加完成');
  console.log(`- 任务1: ${task1.name} (${task1.id})`);
  console.log(`- 任务2: ${task2.name} (${task2.id})\n`);

  // 示例 2: 任务状态转换
  console.log('📝 示例 2: 任务状态转换');
  console.log('='.repeat(60));
  
  // 开始任务1
  await taskManager.startTask(task1.id);
  console.log('▶️  任务1已开始执行');
  
  // 查看任务状态
  const task1Status = await taskManager.getTaskStatus(task1.id);
  console.log(`📋 任务1状态: ${task1Status}`);
  
  // 完成任务1
  await taskManager.completeTask(task1.id, { 
    result: 'success', 
    implementation: '使用 Vue 3 + TypeScript 实现'
  });
  console.log('✅ 任务1已完成');
  
  // 示例 3: 并发控制
  console.log('\n📝 示例 3: 并发控制演示');
  console.log('='.repeat(60));
  
  // 创建多个任务
  const concurrentTasks = await Promise.all([
    taskManager.addTask({ name: '并发任务1', priority: 'medium' as TaskPriority }),
    taskManager.addTask({ name: '并发任务2', priority: 'medium' as TaskPriority }),
    taskManager.addTask({ name: '并发任务3', priority: 'medium' as TaskPriority }),
    taskManager.addTask({ name: '并发任务4', priority: 'medium' as TaskPriority })
  ]);

  // 开始前3个任务（达到并发限制）
  await Promise.all([
    taskManager.startTask(concurrentTasks[0].id),
    taskManager.startTask(concurrentTasks[1].id),
    taskManager.startTask(concurrentTasks[2].id)
  ]);

  const runningStats = await taskManager.getStats();
  console.log(`👥 当前并发数: ${runningStats.currentConcurrency}/${runningStats.concurrentLimit}`);
  console.log(`🏃 运行中任务: ${runningStats.runningTasks}`);
  
  // 尝试开始第4个任务（应该被阻塞）
  try {
    await taskManager.startTask(concurrentTasks[3].id);
    console.log('❌ 第4个任务意外开始（这不应该发生）');
  } catch (error) {
    console.log('✅ 第4个任务被正确阻塞（并发限制生效）');
  }
  
  // 完成一个任务，释放并发许可
  await taskManager.completeTask(concurrentTasks[0].id);
  console.log('🔓 释放一个并发许可');
  
  // 现在可以开始第4个任务
  await taskManager.startTask(concurrentTasks[3].id);
  console.log('✅ 第4个任务现在可以开始');
  
  // 完成剩余任务
  await Promise.all([
    taskManager.completeTask(concurrentTasks[1].id),
    taskManager.completeTask(concurrentTasks[2].id),
    taskManager.completeTask(concurrentTasks[3].id)
  ]);

  // 示例 4: 重试机制
  console.log('\n📝 示例 4: 重试机制演示');
  console.log('='.repeat(60));
  
  const retryTask = await taskManager.addTask({
    name: '重试测试任务',
    priority: 'medium' as TaskPriority,
    maxRetries: 2
  });

  await taskManager.startTask(retryTask.id);
  await taskManager.failTask(retryTask.id, '第一次执行失败');
  console.log('❌ 任务第一次失败');
  
  // 重试任务
  await taskManager.retryTask(retryTask.id);
  console.log('🔄 任务已重试');
  
  await taskManager.startTask(retryTask.id);
  await taskManager.failTask(retryTask.id, '第二次执行失败');
  console.log('❌ 任务第二次失败');
  
  // 再次重试
  await taskManager.retryTask(retryTask.id);
  console.log('🔄 任务第二次重试');
  
  // 这次成功
  await taskManager.startTask(retryTask.id);
  await taskManager.completeTask(retryTask.id);
  console.log('✅ 任务最终成功完成');
  
  const finalTask = await taskManager.getTask(retryTask.id);
  console.log(`📊 重试次数: ${finalTask?.retryCount}`);

  // 示例 5: 依赖管理
  console.log('\n📝 示例 5: 依赖管理演示');
  console.log('='.repeat(60));
  
  const dependencyTask = await taskManager.addTask({
    name: '数据库迁移',
    priority: 'high' as TaskPriority
  });

  const dependentTask = await taskManager.addTask({
    name: 'API 开发',
    priority: 'medium' as TaskPriority,
    dependencies: [dependencyTask.id]
  });

  console.log('🔗 创建依赖关系: API 开发 → 数据库迁移');
  
  // 尝试开始依赖任务（应该失败）
  try {
    await taskManager.startTask(dependentTask.id);
    console.log('❌ 依赖任务意外开始（这不应该发生）');
  } catch (error) {
    console.log('✅ 依赖任务被正确阻塞（依赖检查生效）');
  }
  
  // 完成依赖任务
  await taskManager.startTask(dependencyTask.id);
  await taskManager.completeTask(dependencyTask.id);
  console.log('✅ 依赖任务已完成');
  
  // 现在可以开始依赖任务
  await taskManager.startTask(dependentTask.id);
  await taskManager.completeTask(dependentTask.id);
  console.log('✅ 依赖任务现在可以开始并完成');

  // 示例 6: 事件系统
  console.log('\n📝 示例 6: 事件系统演示');
  console.log('='.repeat(60));
  
  // 监听任务事件
  taskManager.on('task.added', (data) => {
    console.log(`📢 事件: 任务添加 - ${data.task.name}`);
  });
  
  taskManager.on('task.completed', (data) => {
    console.log(`📢 事件: 任务完成 - ${data.task.name}`);
  });
  
  const eventTask = await taskManager.addTask({
    name: '事件测试任务',
    priority: 'low' as TaskPriority
  });
  
  await taskManager.startTask(eventTask.id);
  await taskManager.completeTask(eventTask.id);

  // 最终统计信息
  console.log('\n📊 最终统计信息:');
  console.log('='.repeat(60));
  
  const finalStats = await taskManager.getStats();
  console.log(`总任务数: ${finalStats.totalTasks}`);
  console.log(`已完成: ${finalStats.completedTasks}`);
  console.log(`已失败: ${finalStats.failedTasks}`);
  console.log(`成功率: ${(finalStats.successRate * 100).toFixed(1)}%`);
  console.log(`平均执行时间: ${finalStats.averageExecutionTime.toFixed(0)}ms`);
  console.log(`吞吐量: ${finalStats.throughput.toFixed(2)} 任务/分钟`);
  
  // 关闭任务管理器
  await taskManager.shutdown();
  
  console.log('\n🎉 演示完成！');
  console.log('\n💡 总结:');
  console.log('- 任务管理器支持完整的任务生命周期管理');
  console.log('- 并发控制确保系统稳定性');
  console.log('- 重试机制提高任务可靠性');
  console.log('- 依赖管理保证执行顺序');
  console.log('- 事件系统支持实时监控');
  console.log('- 插件架构提供扩展性');
}

// 运行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateTaskManager().catch(console.error);
}

export { demonstrateTaskManager };