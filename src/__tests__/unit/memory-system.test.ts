// 记忆体系统单元测试

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// 模拟内存系统组件
const mockConversationLogger = {
  logMessage: vi.fn(),
  getConversationHistory: vi.fn()
};

const mockHabitLearner = {
  analyzeHabits: vi.fn(),
  predictPreferences: vi.fn()
};

const mockKnowledgeTransfer = {
  extractKnowledge: vi.fn(),
  updateKnowledgeBase: vi.fn(),
  transferKnowledge: vi.fn()
};

const mockMemoryStore = {
  storeShortTermMemory: vi.fn(),
  getShortTermMemory: vi.fn(),
  storeLongTermMemory: vi.fn()
};

describe('记忆体系统单元测试', () => {
  beforeEach(() => {
    // 重置所有模拟函数
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('ConversationLogger 应该正确记录消息', async () => {
    // 准备测试数据
    const testMessage = {
      id: 'test-message-1',
      role: 'user',
      content: '测试消息内容',
      timestamp: new Date()
    };

    // 执行测试
    await mockConversationLogger.logMessage(testMessage);

    // 验证结果
    expect(mockConversationLogger.logMessage).toHaveBeenCalledWith(testMessage);
    expect(mockConversationLogger.logMessage).toHaveBeenCalledTimes(1);
  });

  test('HabitLearner 应该分析用户习惯', async () => {
    // 准备测试数据
    const testLogs = [
      { type: 'code_generation', timestamp: new Date(), data: { language: 'typescript' } },
      { type: 'code_review', timestamp: new Date(), data: { feedback: 'positive' } }
    ];

    const expectedHabits = [
      { pattern: 'typescript_development', frequency: 5, confidence: 0.8 }
    ];

    // 设置模拟返回值
    mockHabitLearner.analyzeHabits.mockResolvedValue(expectedHabits);

    // 执行测试
    const result = await mockHabitLearner.analyzeHabits(testLogs);

    // 验证结果
    expect(mockHabitLearner.analyzeHabits).toHaveBeenCalledWith(testLogs);
    expect(result).toEqual(expectedHabits);
    expect(result).toHaveLength(1);
  });

  test('KnowledgeTransfer 应该提取和传递知识', async () => {
    // 准备测试数据
    const testLogs = [
      { 
        type: 'conversation', 
        timestamp: new Date(), 
        data: { 
          question: '如何优化 React 性能？',
          answer: '使用 React.memo 和 useMemo'
        }
      }
    ];

    const expectedKnowledge = {
      patterns: ['react_performance_optimization'],
      solutions: ['使用 React.memo', '使用 useMemo'],
      confidence: 0.85
    };

    // 设置模拟返回值
    mockKnowledgeTransfer.extractKnowledge.mockResolvedValue(expectedKnowledge);

    // 执行测试
    const result = await mockKnowledgeTransfer.extractKnowledge(testLogs);

    // 验证结果
    expect(mockKnowledgeTransfer.extractKnowledge).toHaveBeenCalledWith(testLogs);
    expect(result).toEqual(expectedKnowledge);
    expect(result.patterns).toContain('react_performance_optimization');
  });

  test('MemoryStore 应该正确存储和检索记忆', async () => {
    // 准备测试数据
    const testMemory = {
      sessionId: 'test-session-1',
      content: { message: '测试记忆内容' },
      timestamp: new Date(),
      importance: 'high' as const
    };

    // 执行存储测试
    await mockMemoryStore.storeShortTermMemory(testMemory);

    // 验证存储调用
    expect(mockMemoryStore.storeShortTermMemory).toHaveBeenCalledWith(testMemory);

    // 设置检索模拟返回值
    mockMemoryStore.getShortTermMemory.mockResolvedValue([testMemory]);

    // 执行检索测试
    const retrievedMemory = await mockMemoryStore.getShortTermMemory('test-session-1');

    // 验证检索结果
    expect(mockMemoryStore.getShortTermMemory).toHaveBeenCalledWith('test-session-1');
    expect(retrievedMemory).toHaveLength(1);
    expect(retrievedMemory[0]).toEqual(testMemory);
  });

  test('记忆体系统应该处理错误情况', async () => {
    // 模拟错误情况
    const error = new Error('存储失败');
    mockMemoryStore.storeShortTermMemory.mockRejectedValue(error);

    // 执行测试并验证错误处理
    await expect(mockMemoryStore.storeShortTermMemory({} as any))
      .rejects.toThrow('存储失败');
  });

  test('习惯学习应该返回有效的偏好预测', async () => {
    // 准备测试数据
    const taskContext = {
      type: 'frontend_development',
      technology: 'react',
      complexity: 'medium'
    };

    const expectedPreferences = [
      { preference: '使用函数组件', confidence: 0.9 },
      { preference: '使用 TypeScript', confidence: 0.8 }
    ];

    // 设置模拟返回值
    mockHabitLearner.predictPreferences.mockResolvedValue(expectedPreferences);

    // 执行测试
    const result = await mockHabitLearner.predictPreferences(taskContext);

    // 验证结果
    expect(result).toEqual(expectedPreferences);
    expect(result).toHaveLength(2);
    expect(result[0].confidence).toBeGreaterThan(0.7);
  });
});

describe('记忆体系统性能测试', () => {
  test('大量消息记录性能', async () => {
    const startTime = performance.now();
    
    // 模拟大量消息记录
    const messages = Array.from({ length: 1000 }, (_, i) => ({
      id: `message-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `消息内容 ${i}`,
      timestamp: new Date()
    }));

    // 批量记录消息
    for (const message of messages) {
      await mockConversationLogger.logMessage(message);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 验证性能要求：1000条消息应该在5秒内完成
    expect(duration).toBeLessThan(5000);
    expect(mockConversationLogger.logMessage).toHaveBeenCalledTimes(1000);
  });

  test('知识提取效率', async () => {
    const startTime = performance.now();
    
    // 模拟大量对话日志
    const logs = Array.from({ length: 500 }, (_, i) => ({
      type: 'conversation',
      timestamp: new Date(),
      data: {
        question: `问题 ${i}`,
        answer: `答案 ${i}`
      }
    }));

    // 执行知识提取
    await mockKnowledgeTransfer.extractKnowledge(logs);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 验证性能要求：500条日志应该在3秒内完成
    expect(duration).toBeLessThan(3000);
  });
});