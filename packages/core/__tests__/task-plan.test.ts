import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  TaskFactory, 
  TaskPlan, 
  TaskStatus, 
  TaskPriority, 
  DirectedAcyclicGraph,
  AgentRole 
} from '../src/types/task-plan';

/**
 * 任务计划数据结构单元测试
 */
describe('TaskPlan 数据结构', () => {
  describe('TaskFactory', () => {
    it('应该正确创建任务', () => {
      const task = TaskFactory.createTask(
        '测试任务',
        '这是一个测试任务',
        'frontend',
        TaskPriority.HIGH
      );
      
      expect(task.id).toMatch(/^task-\d+$/);
      expect(task.title).toBe('测试任务');
      expect(task.description).toBe('这是一个测试任务');
      expect(task.agent).toBe('frontend');
      expect(task.priority).toBe(TaskPriority.HIGH);
      expect(task.status).toBe('pending');
      expect(task.createdAt).toBeInstanceOf(Date);
    });
    
    it('应该验证任务完整性', () => {
      const validTask = TaskFactory.createTask('有效任务', '描述', 'backend');
      expect(validTask.isValid()).toBe(true);
      
      // 模拟无效任务
      const invalidTask = { ...validTask, title: '' };
      expect(invalidTask.isValid()).toBe(false);
    });
    
    it('应该检查任务是否可以开始', () => {
      const task = TaskFactory.createTask('测试任务', '描述', 'frontend');
      
      // 初始状态应该是可以开始的
      expect(task.canStart()).toBe(true);
      
      // 添加依赖后应该不能开始
      const taskWithDeps = { ...task, dependencies: ['task-1'] };
      expect(taskWithDeps.canStart()).toBe(false);
    });
    
    it('应该计算任务进度', () => {
      const task = TaskFactory.createTask('测试任务', '描述', 'frontend');
      
      expect(task.getProgress()).toBe(0); // pending
      
      const runningTask = { ...task, status: 'running' as TaskStatus };
      expect(runningTask.getProgress()).toBe(50);
      
      const completedTask = { ...task, status: 'completed' as TaskStatus };
      expect(completedTask.getProgress()).toBe(100);
    });
    
    it('应该从用户需求生成任务计划', () => {
      const plan = TaskFactory.createTaskPlanFromPrompt('创建一个React前端组件');
      
      expect(plan.id).toMatch(/^plan-\d+$/);
      expect(plan.prompt).toBe('创建一个React前端组件');
      expect(plan.status).toBe('planning');
      expect(plan.tasks.length).toBeGreaterThan(0);
      expect(plan.totalTasks).toBe(plan.tasks.length);
      expect(plan.completedTasks).toBe(0);
    });
  });
  
  describe('TaskPlan 功能', () => {
    let plan: TaskPlan;
    
    beforeEach(() => {
      plan = TaskFactory.createTaskPlanFromPrompt('测试任务计划');
    });
    
    it('应该获取可执行的任务', () => {
      const readyTasks = plan.getReadyTasks();
      
      // 初始状态下所有任务都应该可以执行（没有依赖）
      expect(readyTasks.length).toBe(plan.tasks.length);
      
      readyTasks.forEach(task => {
        expect(task.canStart()).toBe(true);
      });
    });
    
    it('应该计算完成的任务数量', () => {
      expect(plan.getCompletedCount()).toBe(0);
      
      // 模拟完成一个任务
      plan.tasks[0].status = 'completed';
      expect(plan.getCompletedCount()).toBe(1);
    });
    
    it('应该计算总进度', () => {
      const initialProgress = plan.getTotalProgress();
      expect(initialProgress).toBe(0);
      
      // 完成一半任务
      const halfTasks = Math.floor(plan.tasks.length / 2);
      for (let i = 0; i < halfTasks; i++) {
        plan.tasks[i].status = 'completed';
      }
      
      const halfProgress = plan.getTotalProgress();
      expect(halfProgress).toBe(Math.round((halfTasks / plan.tasks.length) * 100));
      
      // 完成所有任务
      plan.tasks.forEach(task => {
        task.status = 'completed';
      });
      expect(plan.getTotalProgress()).toBe(100);
    });
    
    it('应该验证计划完整性', () => {
      const validation = plan.validate();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // 模拟无效计划（任务缺少必要字段）
      const invalidPlan = { ...plan };
      invalidPlan.tasks[0].title = '';
      
      const invalidValidation = invalidPlan.validate();
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors.length).toBeGreaterThan(0);
    });
    
    it('应该获取执行顺序', () => {
      const executionOrder = plan.getExecutionOrder();
      
      expect(executionOrder).toHaveLength(plan.tasks.length);
      expect(executionOrder).toEqual(plan.tasks.map(task => task.id));
    });
  });
  
  describe('DirectedAcyclicGraph (DAG)', () => {
    let dag: DirectedAcyclicGraph;
    
    beforeEach(() => {
      dag = new DirectedAcyclicGraph();
    });
    
    it('应该正确添加节点', () => {
      const task = TaskFactory.createTask('任务1', '描述', 'frontend');
      
      dag.addNode(task);
      
      expect(dag.nodes.has(task.id)).toBe(true);
      expect(dag.nodes.get(task.id)?.taskId).toBe(task.id);
    });
    
    it('应该检测循环依赖', () => {
      const task1 = TaskFactory.createTask('任务1', '描述', 'frontend');
      const task2 = TaskFactory.createTask('任务2', '描述', 'backend');
      
      dag.addNode(task1);
      dag.addNode(task2);
      
      // 添加正常依赖
      dag.addDependency(task1.id, task2.id);
      expect(dag.detectCycle()).toBe(false);
      
      // 添加循环依赖应该抛出错误
      expect(() => {
        dag.addDependency(task2.id, task1.id);
      }).toThrow();
    });
    
    it('应该进行拓扑排序', () => {
      const tasks = [
        TaskFactory.createTask('任务1', '描述', 'frontend'),
        TaskFactory.createTask('任务2', '描述', 'backend'),
        TaskFactory.createTask('任务3', '描述', 'test')
      ];
      
      tasks.forEach(task => dag.addNode(task));
      
      // 任务1 -> 任务2 -> 任务3
      dag.addDependency(tasks[0].id, tasks[1].id);
      dag.addDependency(tasks[1].id, tasks[2].id);
      
      const executionOrder = dag.getExecutionOrder();
      
      expect(executionOrder).toHaveLength(3);
      expect(executionOrder[0]).toBe(tasks[0].id); // 任务1 最先
      expect(executionOrder[1]).toBe(tasks[1].id); // 任务2 其次
      expect(executionOrder[2]).toBe(tasks[2].id); // 任务3 最后
    });
    
    it('应该获取关键路径', () => {
      const tasks = [
        TaskFactory.createTask('任务1', '描述', 'frontend'),
        TaskFactory.createTask('任务2', '描述', 'backend'),
        TaskFactory.createTask('任务3', '描述', 'test')
      ];
      
      tasks.forEach(task => dag.addNode(task));
      dag.addDependency(tasks[0].id, tasks[1].id);
      
      const criticalPath = dag.getCriticalPath();
      
      // 关键路径应该包含起始和结束节点
      expect(criticalPath).toContain(tasks[0].id);
      expect(criticalPath).toContain(tasks[1].id);
    });
    
    it('应该计算节点深度', () => {
      const tasks = [
        TaskFactory.createTask('任务1', '描述', 'frontend'),
        TaskFactory.createTask('任务2', '描述', 'backend'),
        TaskFactory.createTask('任务3', '描述', 'test')
      ];
      
      tasks.forEach(task => dag.addNode(task));
      dag.addDependency(tasks[0].id, tasks[1].id);
      dag.addDependency(tasks[1].id, tasks[2].id);
      
      expect(dag.getNodeDepth(tasks[0].id)).toBe(1); // 根节点
      expect(dag.getNodeDepth(tasks[1].id)).toBe(2); // 第二层
      expect(dag.getNodeDepth(tasks[2].id)).toBe(3); // 第三层
    });
  });
  
  describe('Agent 角色功能', () => {
    it('应该正确分配任务给不同 Agent', () => {
      const frontendTask = TaskFactory.createTask('前端任务', '创建组件', 'frontend');
      const backendTask = TaskFactory.createTask('后端任务', '实现API', 'backend');
      const testTask = TaskFactory.createTask('测试任务', '编写测试', 'test');
      const schedulerTask = TaskFactory.createTask('调度任务', '任务规划', 'scheduler');
      
      expect(frontendTask.agent).toBe('frontend');
      expect(backendTask.agent).toBe('backend');
      expect(testTask.agent).toBe('test');
      expect(schedulerTask.agent).toBe('scheduler');
    });
    
    it('应该根据需求类型自动分配 Agent', () => {
      const frontendPlan = TaskFactory.createTaskPlanFromPrompt('创建一个Vue组件');
      const backendPlan = TaskFactory.createTaskPlanFromPrompt('实现RESTful API');
      const testPlan = TaskFactory.createTaskPlanFromPrompt('编写单元测试');
      
      // 检查前端相关任务
      const frontendTasks = frontendPlan.tasks.filter(task => task.agent === 'frontend');
      expect(frontendTasks.length).toBeGreaterThan(0);
      
      // 检查后端相关任务
      const backendTasks = backendPlan.tasks.filter(task => task.agent === 'backend');
      expect(backendTasks.length).toBeGreaterThan(0);
      
      // 检查测试相关任务
      const testTasks = testPlan.tasks.filter(task => task.agent === 'test');
      expect(testTasks.length).toBeGreaterThan(0);
    });
  });
});

/**
 * 模型路由器单元测试
 */
describe('ModelRouter', () => {
  it('应该正确注册提供商', async () => {
    const { ModelRouter } = await import('../src/model-router/model-router');
    const router = new ModelRouter();
    
    const providerConfig = {
      id: 'test-provider',
      name: '测试提供商',
      provider: 'openai' as const,
      priority: 5,
      costPerToken: 0.0001,
      maxTokens: 4000,
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 60000
      },
      capabilities: ['code' as const, 'reasoning' as const],
      enabled: true
    };
    
    router.registerProvider(providerConfig);
    
    const providers = router.getProviders();
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe('test-provider');
  });
  
  it('应该选择最优提供商', async () => {
    const { ModelRouter } = await import('../src/model-router/model-router');
    const router = new ModelRouter();
    
    // 注册多个提供商
    router.registerProvider({
      id: 'provider-1',
      name: '提供商1',
      provider: 'openai',
      priority: 5,
      costPerToken: 0.0001,
      maxTokens: 4000,
      rateLimit: { requestsPerMinute: 60, tokensPerMinute: 60000 },
      capabilities: ['code'],
      enabled: true
    });
    
    router.registerProvider({
      id: 'provider-2',
      name: '提供商2',
      provider: 'anthropic',
      priority: 8,
      costPerToken: 0.0002,
      maxTokens: 8000,
      rateLimit: { requestsPerMinute: 30, tokensPerMinute: 30000 },
      capabilities: ['code', 'reasoning'],
      enabled: true
    });
    
    const request = {
      taskType: 'code-generation',
      complexity: 5,
      estimatedTokens: 1000,
      requiredCapabilities: ['code'] as const,
      latencyRequirement: 'medium' as const
    };
    
    const result = router.selectProvider(request);
    
    expect(result).not.toBeNull();
    expect(result?.providerId).toBe('provider-2'); // 优先级更高的提供商
    expect(result?.confidence).toBeGreaterThan(0);
    expect(result?.fallbackPlan).toHaveLength(1);
  });
});

/**
 * 用量统计器单元测试
 */
describe('UsageTracker', () => {
  it('应该正确记录用量事件', async () => {
    const { UsageTracker } = await import('../src/usage-tracker/usage-tracker');
    const tracker = new UsageTracker({ persistenceEnabled: false });
    
    const usageEvent = {
      providerId: 'test-provider',
      modelName: 'gpt-4',
      taskType: 'code-generation',
      tokens: {
        prompt: 100,
        completion: 50,
        total: 150
      },
      cost: 0.015,
      duration: 2000,
      success: true
    };
    
    await tracker.recordUsage(usageEvent);
    
    const dailySummary = tracker.getDailySummary();
    expect(dailySummary.totalTokens).toBe(150);
    expect(dailySummary.totalCost).toBe(0.015);
    expect(dailySummary.totalRequests).toBe(1);
  });
  
  it('应该检查成本限制', async () => {
    const { UsageTracker } = await import('../src/usage-tracker/usage-tracker');
    const tracker = new UsageTracker({
      costLimits: {
        dailyLimit: 0.01, // 设置很低的限额
        monthlyLimit: 0.1,
        alertThreshold: 0.5,
        autoStop: true
      },
      persistenceEnabled: false
    });
    
    const usageEvent = {
      providerId: 'test-provider',
      modelName: 'gpt-4',
      taskType: 'code-generation',
      tokens: {
        prompt: 100,
        completion: 50,
        total: 150
      },
      cost: 0.02, // 超过每日限额
      duration: 2000,
      success: true
    };
    
    // 监听限额超限事件
    const limitExceededHandler = vi.fn();
    tracker.on('dailyLimitExceeded', limitExceededHandler);
    
    await tracker.recordUsage(usageEvent);
    
    expect(limitExceededHandler).toHaveBeenCalled();
  });
  
  it('应该生成用量报告', async () => {
    const { UsageTracker } = await import('../src/usage-tracker/usage-tracker');
    const tracker = new UsageTracker({ persistenceEnabled: false });
    
    // 记录多个事件
    await tracker.recordUsage({
      providerId: 'provider-1',
      modelName: 'gpt-4',
      taskType: 'code-generation',
      tokens: { prompt: 100, completion: 50, total: 150 },
      cost: 0.015,
      duration: 2000,
      success: true
    });
    
    await tracker.recordUsage({
      providerId: 'provider-2',
      modelName: 'claude-3',
      taskType: 'reasoning',
      tokens: { prompt: 200, completion: 100, total: 300 },
      cost: 0.03,
      duration: 3000,
      success: false,
      error: 'API错误'
    });
    
    const report = tracker.getProviderPerformanceReport();
    
    expect(report).toHaveLength(2);
    expect(report[0].providerId).toBe('provider-1');
    expect(report[0].successRate).toBe(1);
    expect(report[1].providerId).toBe('provider-2');
    expect(report[1].successRate).toBe(0);
  });
});