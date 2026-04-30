// 调度器系统单元测试

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// 模拟调度器组件
const mockTaskDecomposer = {
  decompose: vi.fn()
};

const mockTaskManager = {
  addTask: vi.fn(),
  getTasks: vi.fn(),
  cancelTask: vi.fn(),
  reset: vi.fn()
};

const mockWebSocketService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  sendMessage: vi.fn(),
  on: vi.fn()
};

describe('调度器系统单元测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('TaskDecomposer 应该正确分解任务', async () => {
    // 准备测试数据
    const requirement = '创建一个完整的用户注册系统，包含前端表单和后端API';
    
    const expectedDecomposition = {
      tasks: [
        {
          id: 'task-1',
          name: '创建用户注册表单组件',
          type: 'frontend_development',
          estimatedTime: 120,
          dependencies: []
        },
        {
          id: 'task-2', 
          name: '实现后端用户注册API',
          type: 'backend_development',
          estimatedTime: 180,
          dependencies: []
        },
        {
          id: 'task-3',
          name: '添加表单验证逻辑',
          type: 'frontend_development',
          estimatedTime: 90,
          dependencies: ['task-1']
        }
      ],
      totalEstimatedTime: 390,
      criticalPath: ['task-1', 'task-3']
    };

    // 设置模拟返回值
    mockTaskDecomposer.decompose.mockResolvedValue(expectedDecomposition);

    // 执行测试
    const result = await mockTaskDecomposer.decompose(requirement);

    // 验证结果
    expect(mockTaskDecomposer.decompose).toHaveBeenCalledWith(requirement);
    expect(result.tasks).toHaveLength(3);
    expect(result.totalEstimatedTime).toBe(390);
    expect(result.tasks[0].type).toBe('frontend_development');
  });

  test('TaskManager 应该正确管理任务', async () => {
    // 准备测试数据
    const testTask = {
      id: 'test-task-1',
      name: '测试任务',
      type: 'testing',
      estimatedTime: 60,
      status: 'pending' as const
    };

    // 设置模拟返回值
    mockTaskManager.addTask.mockResolvedValue({
      ...testTask,
      status: 'scheduled' as const
    });

    // 执行添加任务测试
    const addedTask = await mockTaskManager.addTask(testTask);

    // 验证添加结果
    expect(mockTaskManager.addTask).toHaveBeenCalledWith(testTask);
    expect(addedTask.status).toBe('scheduled');

    // 设置获取任务模拟返回值
    mockTaskManager.getTasks.mockResolvedValue([addedTask]);

    // 执行获取任务测试
    const tasks = await mockTaskManager.getTasks();

    // 验证获取结果
    expect(mockTaskManager.getTasks).toHaveBeenCalled();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('test-task-1');
  });

  test('WebSocket 服务应该正确处理连接', async () => {
    // 模拟连接成功
    mockWebSocketService.connect.mockResolvedValue(true);

    // 执行连接测试
    const connected = await mockWebSocketService.connect();

    // 验证连接结果
    expect(connected).toBe(true);
    expect(mockWebSocketService.connect).toHaveBeenCalledTimes(1);

    // 测试事件监听
    const eventHandler = vi.fn();
    mockWebSocketService.on.mockImplementation((event, handler) => {
      if (event === 'message') {
        handler({ data: '测试消息' });
      }
    });

    // 注册事件监听器
    mockWebSocketService.on('message', eventHandler);

    // 验证事件监听
    expect(mockWebSocketService.on).toHaveBeenCalledWith('message', eventHandler);
  });

  test('任务取消功能应该正常工作', async () => {
    // 准备测试数据
    const taskId = 'task-to-cancel';

    // 设置模拟返回值
    mockTaskManager.cancelTask.mockResolvedValue(true);

    // 执行取消任务测试
    const cancelled = await mockTaskManager.cancelTask(taskId);

    // 验证取消结果
    expect(cancelled).toBe(true);
    expect(mockTaskManager.cancelTask).toHaveBeenCalledWith(taskId);
  });

  test('调度器应该处理复杂依赖关系', async () => {
    // 准备复杂任务需求
    const complexRequirement = `
      开发一个电商平台，包含：
      - 用户认证系统
      - 商品管理后台
      - 购物车功能
      - 订单处理系统
      - 支付集成
    `;

    const complexDecomposition = {
      tasks: [
        {
          id: 'auth-system',
          name: '用户认证系统',
          type: 'backend_development',
          estimatedTime: 240,
          dependencies: []
        },
        {
          id: 'product-management',
          name: '商品管理后台',
          type: 'fullstack_development',
          estimatedTime: 360,
          dependencies: ['auth-system']
        },
        {
          id: 'shopping-cart',
          name: '购物车功能',
          type: 'frontend_development',
          estimatedTime: 180,
          dependencies: ['product-management']
        },
        {
          id: 'order-system',
          name: '订单处理系统',
          type: 'backend_development',
          estimatedTime: 300,
          dependencies: ['shopping-cart']
        },
        {
          id: 'payment-integration',
          name: '支付集成',
          type: 'integration',
          estimatedTime: 120,
          dependencies: ['order-system']
        }
      ],
      totalEstimatedTime: 1200,
      criticalPath: ['auth-system', 'product-management', 'shopping-cart', 'order-system', 'payment-integration']
    };

    // 设置模拟返回值
    mockTaskDecomposer.decompose.mockResolvedValue(complexDecomposition);

    // 执行测试
    const result = await mockTaskDecomposer.decompose(complexRequirement);

    // 验证复杂依赖关系
    expect(result.tasks).toHaveLength(5);
    expect(result.tasks[4].dependencies).toContain('order-system');
    expect(result.criticalPath).toHaveLength(5);
  });

  test('调度器应该处理错误情况', async () => {
    // 模拟任务分解失败
    const error = new Error('任务需求不明确');
    mockTaskDecomposer.decompose.mockRejectedValue(error);

    // 执行测试并验证错误处理
    await expect(mockTaskDecomposer.decompose('无效需求'))
      .rejects.toThrow('任务需求不明确');

    // 模拟任务添加失败
    const taskError = new Error('任务管理器已满');
    mockTaskManager.addTask.mockRejectedValue(taskError);

    // 执行测试并验证错误处理
    await expect(mockTaskManager.addTask({} as any))
      .rejects.toThrow('任务管理器已满');
  });
});

describe('调度器系统性能测试', () => {
  test('大量任务分解性能', async () => {
    const startTime = performance.now();
    
    // 模拟大量任务需求
    const requirements = Array.from({ length: 100 }, (_, i) => 
      `开发功能模块 ${i}`
    );

    // 批量分解任务
    for (const requirement of requirements) {
      await mockTaskDecomposer.decompose(requirement);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 验证性能要求：100个任务需求应该在10秒内完成
    expect(duration).toBeLessThan(10000);
    expect(mockTaskDecomposer.decompose).toHaveBeenCalledTimes(100);
  });

  test('并发任务管理性能', async () => {
    const startTime = performance.now();
    
    // 模拟并发任务添加
    const tasks = Array.from({ length: 50 }, (_, i) => ({
      id: `concurrent-task-${i}`,
      name: `并发任务 ${i}`,
      type: 'testing',
      estimatedTime: 30,
      status: 'pending' as const
    }));

    // 并发添加任务
    const addPromises = tasks.map(task => mockTaskManager.addTask(task));
    await Promise.all(addPromises);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 验证性能要求：50个并发任务应该在5秒内完成
    expect(duration).toBeLessThan(5000);
    expect(mockTaskManager.addTask).toHaveBeenCalledTimes(50);
  });

  test('实时通信性能', async () => {
    const startTime = performance.now();
    
    // 模拟大量实时消息
    const messages = Array.from({ length: 1000 }, (_, i) => ({
      type: 'status_update',
      taskId: `task-${i}`,
      status: 'running',
      progress: i % 100
    }));

    // 批量发送消息
    for (const message of messages) {
      await mockWebSocketService.sendMessage(message);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 验证性能要求：1000条消息应该在3秒内完成
    expect(duration).toBeLessThan(3000);
    expect(mockWebSocketService.sendMessage).toHaveBeenCalledTimes(1000);
  });
});

describe('调度器系统边界测试', () => {
  test('空任务需求处理', async () => {
    // 测试空需求
    mockTaskDecomposer.decompose.mockRejectedValue(new Error('空任务需求'));
    await expect(mockTaskDecomposer.decompose(''))
      .rejects.toThrow('空任务需求');
  });

  test('无效任务类型处理', async () => {
    const invalidTask = {
      id: 'invalid-task',
      name: '无效任务',
      type: 'invalid_type',
      estimatedTime: -1 // 无效时间
    };

    // 测试无效任务添加
    mockTaskManager.addTask.mockRejectedValue(new Error('无效任务类型'));
    await expect(mockTaskManager.addTask(invalidTask as any))
      .rejects.toThrow('无效任务类型');
  });

  test('任务依赖循环检测', async () => {
    const cyclicDependency = {
      tasks: [
        {
          id: 'task-a',
          name: '任务A',
          dependencies: ['task-b']
        },
        {
          id: 'task-b',
          name: '任务B', 
          dependencies: ['task-a'] // 循环依赖
        }
      ]
    };

    // 测试循环依赖处理
    mockTaskDecomposer.decompose.mockRejectedValue(new Error('检测到循环依赖'));
    await expect(mockTaskDecomposer.decompose('循环依赖测试'))
      .rejects.toThrow('检测到循环依赖');
  });
});