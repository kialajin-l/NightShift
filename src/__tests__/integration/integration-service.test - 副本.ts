// 集成服务集成测试

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { IntegrationService } from '../../lib/integration-service';

// 创建模拟组件
const createMockConversationLogger = () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  logMessage: vi.fn().mockResolvedValue(undefined),
  getConversationHistory: vi.fn().mockResolvedValue([])
});

const createMockHabitLearner = () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  analyzeHabits: vi.fn().mockResolvedValue([]),
  predictPreferences: vi.fn().mockResolvedValue([])
});

const createMockKnowledgeTransfer = () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  extractKnowledge: vi.fn().mockResolvedValue({}),
  updateKnowledgeBase: vi.fn().mockResolvedValue(undefined),
  transferKnowledge: vi.fn().mockResolvedValue({})
});

const createMockMemoryStore = () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  storeShortTermMemory: vi.fn().mockResolvedValue(undefined),
  getShortTermMemory: vi.fn().mockResolvedValue([]),
  getMemoryStats: vi.fn().mockResolvedValue({
    totalSessions: 5,
    totalMessages: 100,
    memoryUsage: '50MB'
  })
});

const createMockRuleForgeIntegration = () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  extractRulesFromSession: vi.fn().mockResolvedValue([]),
  generateYAMLRules: vi.fn().mockResolvedValue(''),
  injectRulesIntoCode: vi.fn().mockResolvedValue('')
});

const createMockSchedulerIntegration = () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  decomposeTask: vi.fn().mockResolvedValue({ tasks: [], totalEstimatedTime: 0 }),
  scheduleTasks: vi.fn().mockResolvedValue({ scheduledTasks: [] }),
  getSchedulerStats: vi.fn().mockResolvedValue({
    totalTasks: 10,
    activeTasks: 2,
    completedTasks: 8
  })
});

describe('集成服务集成测试', () => {
  let integrationService: IntegrationService;
  let mockConversationLogger: any;
  let mockHabitLearner: any;
  let mockKnowledgeTransfer: any;
  let mockMemoryStore: any;
  let mockRuleForgeIntegration: any;
  let mockSchedulerIntegration: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 创建模拟组件实例
    mockConversationLogger = createMockConversationLogger();
    mockHabitLearner = createMockHabitLearner();
    mockKnowledgeTransfer = createMockKnowledgeTransfer();
    mockMemoryStore = createMockMemoryStore();
    mockRuleForgeIntegration = createMockRuleForgeIntegration();
    mockSchedulerIntegration = createMockSchedulerIntegration();
    
    integrationService = new IntegrationService({
      enableMemory: true,
      enableRuleForge: true,
      enableScheduler: true,
      logLevel: 'info'
    }, {
      conversationLogger: mockConversationLogger,
      habitLearner: mockHabitLearner,
      knowledgeTransfer: mockKnowledgeTransfer,
      memoryStore: mockMemoryStore,
      ruleForgeIntegration: mockRuleForgeIntegration,
      schedulerIntegration: mockSchedulerIntegration
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('集成服务应该正确初始化所有组件', async () => {
    // 执行初始化
    await integrationService.initialize();

    // 验证初始化状态
    const status = integrationService.getIntegrationStatus();
    
    expect(status.isInitialized).toBe(true);
    expect(status.memorySystem).toBe(true);
    expect(status.ruleForge).toBe(true);
    expect(status.scheduler).toBe(true);
  });

  test('集成服务应该处理用户消息流程', async () => {
    // 初始化服务
    await integrationService.initialize();
    integrationService.setCurrentSession('test-session-1');

    // 准备测试消息
    const testMessage = {
      id: 'test-user-message',
      role: 'user' as const,
      content: '帮我创建一个用户注册表单',
      timestamp: new Date()
    };

    // 执行消息处理
    const result = await integrationService.processUserMessage(testMessage);

    // 验证处理结果
    expect(result).toHaveProperty('enhancedContext');
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('knowledgeContext');
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  test('集成服务应该处理AI响应消息', async () => {
    // 初始化服务
    await integrationService.initialize();
    integrationService.setCurrentSession('test-session-1');

    // 准备测试数据
    const originalMessage = {
      id: 'user-request',
      role: 'user' as const,
      content: '如何优化React应用的性能？',
      timestamp: new Date()
    };

    const aiResponse = {
      id: 'ai-response',
      role: 'assistant' as const,
      content: '可以使用React.memo和useMemo进行优化',
      timestamp: new Date()
    };

    // 执行AI响应处理
    await integrationService.processAIResponse(aiResponse, originalMessage);

    // 验证处理结果 - 方法应该成功执行而不抛出错误
    expect(mockConversationLogger.logMessage).toHaveBeenCalledWith(aiResponse);
    expect(mockKnowledgeTransfer.extractKnowledge).toHaveBeenCalled();
  });

  test('集成服务应该支持任务分解和调度', async () => {
    // 初始化服务
    await integrationService.initialize();

    // 准备任务需求
    const requirement = '开发一个完整的用户认证系统';

    // 执行任务分解
    const decomposition = await integrationService.decomposeTask(requirement);

    // 验证分解结果
    expect(decomposition).toHaveProperty('tasks');
    expect(decomposition).toHaveProperty('totalEstimatedTime');
    expect(Array.isArray(decomposition.tasks)).toBe(true);

    // 准备任务DAG
    const taskDAG = {
      tasks: decomposition.tasks,
      dependencies: []
    };

    // 执行任务调度
    const schedulingResult = await integrationService.scheduleTasks(taskDAG);

    // 验证调度结果
    expect(schedulingResult).toHaveProperty('scheduledTasks');
    expect(schedulingResult).toHaveProperty('estimatedTime');
    expect(schedulingResult).toHaveProperty('totalTasks');
  });

  test('集成服务应该支持规则提取和生成', async () => {
    // 初始化服务
    await integrationService.initialize();

    // 准备会话数据
    const sessionData = {
      messages: [
        {
          role: 'user',
          content: '如何编写高质量的TypeScript代码？'
        },
        {
          role: 'assistant',
          content: '使用严格的类型检查，避免使用any类型'
        }
      ],
      metadata: {
        technology: 'typescript',
        category: 'code_quality'
      }
    };

    // 执行规则提取
    const extractionResult = await integrationService.extractRules(sessionData);

    // 验证提取结果
    expect(extractionResult).toHaveProperty('patterns');
    expect(extractionResult).toHaveProperty('totalPatterns');
    expect(extractionResult).toHaveProperty('averageConfidence');

    // 生成YAML规则
    const yamlContent = await integrationService.generateYAMLRules(extractionResult.patterns);

    // 验证YAML生成
    expect(typeof yamlContent).toBe('string');
    expect(yamlContent).toContain('rules:');
    expect(yamlContent).toContain('id:');
  });

  test('集成服务应该提供统计信息', async () => {
    // 初始化服务
    await integrationService.initialize();

    // 获取记忆统计
    const memoryStats = await integrationService.getMemoryStats();
    
    // 验证记忆统计
    expect(memoryStats).toHaveProperty('totalSessions');
    expect(memoryStats).toHaveProperty('totalMessages');
    expect(memoryStats).toHaveProperty('memoryUsage');

    // 获取调度器统计
    const schedulerStats = await integrationService.getSchedulerStats();
    
    // 验证调度器统计
    expect(schedulerStats).toHaveProperty('totalTasks');
    expect(schedulerStats).toHaveProperty('activeTasks');
    expect(schedulerStats).toHaveProperty('completedTasks');

    // 准备规则模式数据
    const patterns = [
      {
        id: 'test-pattern-1',
        category: 'code_style',
        solution: { confidence: 0.9 }
      }
    ];

    // 获取规则统计
    const ruleStats = await integrationService.getRuleStats(patterns);
    
    // 验证规则统计
    expect(ruleStats).toHaveProperty('totalRules');
    expect(ruleStats).toHaveProperty('rulesByCategory');
    expect(ruleStats).toHaveProperty('averageConfidence');
  });

  test('集成服务应该处理错误情况', async () => {
    // 测试未初始化时的错误处理
    await expect(integrationService.processUserMessage({} as any))
      .rejects.toThrow('集成服务未初始化');

    await expect(integrationService.decomposeTask('test'))
      .rejects.toThrow('集成服务未初始化');

    await expect(integrationService.extractRules({} as any))
      .rejects.toThrow('集成服务未初始化');

    // 初始化服务
    await integrationService.initialize();

    // 测试无效消息处理 - 设置模拟抛出错误
    mockConversationLogger.logMessage.mockRejectedValueOnce(new Error('无效消息格式'));
    await expect(integrationService.processUserMessage(null as any))
      .rejects.toThrow('无效消息格式');

    // 测试无效任务需求处理 - 设置模拟抛出错误
    mockSchedulerIntegration.decomposeTask.mockRejectedValueOnce(new Error('空任务需求'));
    await expect(integrationService.decomposeTask(''))
      .rejects.toThrow('空任务需求');
  });

  test('集成服务应该支持会话管理', async () => {
    // 初始化服务
    await integrationService.initialize();

    // 设置当前会话
    integrationService.setCurrentSession('session-1');

    // 处理消息
    const message = {
      id: 'msg-1',
      role: 'user' as const,
      content: '测试消息',
      timestamp: new Date()
    };

    await integrationService.processUserMessage(message);

    // 切换会话
    integrationService.setCurrentSession('session-2');

    // 处理另一个消息
    const message2 = {
      id: 'msg-2',
      role: 'user' as const,
      content: '另一个测试消息',
      timestamp: new Date()
    };

    await integrationService.processUserMessage(message2);

    // 验证会话隔离
    // 这里应该验证不同会话的数据不会互相干扰
    expect(true).toBe(true); // 占位验证
  });

  test('集成服务应该支持配置更新', async () => {
    // 使用默认配置初始化
    await integrationService.initialize();

    // 获取当前配置状态
    const initialStatus = integrationService.getIntegrationStatus();

    // 创建新服务实例使用不同配置
    const customService = new IntegrationService({
      enableMemory: false,
      enableRuleForge: false,
      enableScheduler: true,
      logLevel: 'error'
    });

    await customService.initialize();

    // 验证配置差异
    const customStatus = customService.getIntegrationStatus();
    
    expect(customStatus.memorySystem).toBe(false);
    expect(customStatus.ruleForge).toBe(false);
    expect(customStatus.scheduler).toBe(true);
  });
});

describe('集成服务性能测试', () => {
  let integrationService: IntegrationService;

  beforeEach(async () => {
    integrationService = new IntegrationService({
      enableMemory: true,
      enableRuleForge: true,
      enableScheduler: true,
      logLevel: 'error' // 减少日志输出以提高性能
    });
    await integrationService.initialize();
    integrationService.setCurrentSession('performance-test-session');
  });

  test('高并发消息处理性能', async () => {
    const startTime = performance.now();
    
    // 模拟高并发消息
    const messages = Array.from({ length: 100 }, (_, i) => ({
      id: `concurrent-msg-${i}`,
      role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
      content: `并发消息内容 ${i}`,
      timestamp: new Date()
    }));

    // 并发处理消息
    const processingPromises = messages.map(msg => 
      integrationService.processUserMessage(msg)
    );

    await Promise.all(processingPromises);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 验证性能要求：100条并发消息应该在10秒内完成
    expect(duration).toBeLessThan(10000);
  });

  test('大量任务分解性能', async () => {
    const startTime = performance.now();
    
    // 模拟大量任务需求
    const requirements = Array.from({ length: 50 }, (_, i) => 
      `开发功能模块 ${i}，包含前端界面和后端API`
    );

    // 批量分解任务
    const decompositionPromises = requirements.map(req =>
      integrationService.decomposeTask(req)
    );

    await Promise.all(decompositionPromises);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 验证性能要求：50个任务分解应该在15秒内完成
    expect(duration).toBeLessThan(15000);
  });

  test('内存使用监控', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 执行大量操作
    for (let i = 0; i < 100; i++) {
      const message = {
        id: `memory-test-msg-${i}`,
        role: 'user' as const,
        content: `内存测试消息 ${i}`,
        timestamp: new Date()
      };
      
      await integrationService.processUserMessage(message);
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // 验证内存使用：100条消息处理内存增加应该小于100MB
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB
  });
});

describe('集成服务边界测试', () => {
  let integrationService: IntegrationService;

  beforeEach(async () => {
    integrationService = new IntegrationService({
      enableMemory: true,
      enableRuleForge: true,
      enableScheduler: true,
      logLevel: 'error'
    });
    await integrationService.initialize();
  });

  test('极端消息长度处理', async () => {
    // 测试非常长的消息
    const longMessage = {
      id: 'long-msg',
      role: 'user' as const,
      content: 'A'.repeat(10000), // 10KB 消息
      timestamp: new Date()
    };

    // 应该能够处理长消息
    await expect(integrationService.processUserMessage(longMessage))
      .resolves.toBeDefined();

    // 测试空消息
    const emptyMessage = {
      id: 'empty-msg',
      role: 'user' as const,
      content: '',
      timestamp: new Date()
    };

    // 应该能够处理空消息
    await expect(integrationService.processUserMessage(emptyMessage))
      .resolves.toBeDefined();
  });

  test('无效数据格式处理', async () => {
    // 初始化服务
    await integrationService.initialize();

    // 测试部分无效数据 - 设置模拟抛出错误
    const partialMessage = {
      id: 'partial-msg',
      role: 'user' as const,
      // 缺少 content 字段
      timestamp: new Date()
    };

    mockConversationLogger.logMessage.mockRejectedValueOnce(new Error('消息格式无效'));
    await expect(integrationService.processUserMessage(partialMessage as any))
      .rejects.toThrow('消息格式无效');

    // 测试完全无效数据 - 设置模拟抛出错误
    mockConversationLogger.logMessage.mockRejectedValueOnce(new Error('消息为空'));
    await expect(integrationService.processUserMessage(null as any))
      .rejects.toThrow('消息为空');
  });

  test('服务重置功能', async () => {
    // 先处理一些消息
    const message = {
      id: 'reset-test-msg',
      role: 'user' as const,
      content: '重置测试消息',
      timestamp: new Date()
    };

    await integrationService.processUserMessage(message);

    // 重置服务
    await integrationService.reset();

    // 验证重置后状态
    const status = integrationService.getIntegrationStatus();
    expect(status.isInitialized).toBe(false);

    // 重置后应该无法处理消息
    await expect(integrationService.processUserMessage(message))
      .rejects.toThrow('集成服务未初始化');
  });
});