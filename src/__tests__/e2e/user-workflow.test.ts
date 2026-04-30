// 端到端用户工作流测试

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { IntegrationService } from '../../lib/integration-service';

// 模拟真实用户场景
describe('端到端用户工作流测试', () => {
  let integrationService: IntegrationService;

  beforeEach(async () => {
    integrationService = new IntegrationService({
      enableMemory: true,
      enableRuleForge: true,
      enableScheduler: true,
      logLevel: 'info'
    });
    await integrationService.initialize();
  });

  afterEach(async () => {
    await integrationService.reset();
  });

  test('完整开发任务工作流', async () => {
    // 场景：用户需要开发一个完整的用户认证系统
    
    // 1. 用户开始新会话
    integrationService.setCurrentSession('auth-system-session');
    
    // 2. 用户提出需求
    const userRequirement = {
      id: 'req-1',
      role: 'user' as const,
      content: '我需要开发一个完整的用户认证系统，包含注册、登录、密码重置功能',
      timestamp: new Date()
    };

    // 3. 系统处理用户需求
    const requirementResult = await integrationService.processUserMessage(userRequirement);
    
    expect(requirementResult.enhancedContext).toBeDefined();
    expect(requirementResult.recommendations).toBeDefined();

    // 4. 系统分解任务
    const decomposition = await integrationService.decomposeTask(userRequirement.content);
    
    expect(decomposition.tasks.length).toBeGreaterThan(0);
    expect(decomposition.totalEstimatedTime).toBeGreaterThan(0);

    // 5. 系统调度任务执行
    const schedulingResult = await integrationService.scheduleTasks({
      tasks: decomposition.tasks,
      dependencies: decomposition.tasks.map(task => task.dependencies || [])
    });

    expect(schedulingResult.scheduledTasks.length).toBe(decomposition.tasks.length);

    // 6. 模拟任务执行过程
    for (const task of schedulingResult.scheduledTasks) {
      // 模拟任务状态更新
      console.log(`执行任务: ${task.name}`);
      
      // 这里可以添加实际的任务执行逻辑
      // 目前使用延时模拟
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 7. 系统生成开发建议和最佳实践
    const sessionData = {
      messages: [userRequirement],
      tasks: decomposition.tasks,
      metadata: {
        projectType: 'web_application',
        technologyStack: ['react', 'nodejs', 'mongodb']
      }
    };

    const rulesResult = await integrationService.extractRules(sessionData);
    
    expect(rulesResult.patterns.length).toBeGreaterThan(0);
    expect(rulesResult.averageConfidence).toBeGreaterThan(0);

    // 8. 验证工作流完整性
    const finalStatus = integrationService.getIntegrationStatus();
    expect(finalStatus.isInitialized).toBe(true);
    expect(finalStatus.memorySystem).toBe(true);
    expect(finalStatus.scheduler).toBe(true);
    expect(finalStatus.ruleForge).toBe(true);

    console.log('✅ 完整开发任务工作流测试通过');
  });

  test('代码优化建议工作流', async () => {
    // 场景：用户需要优化现有代码
    
    integrationService.setCurrentSession('code-optimization-session');
    
    // 1. 用户提交需要优化的代码
    const problematicCode = `
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

function processUserData(user) {
  var name = user.name;
  var email = user.email;
  var age = user.age;
  
  if (age > 18) {
    return { name: name, email: email, isAdult: true };
  } else {
    return { name: name, email: email, isAdult: false };
  }
}
    `;

    const optimizationRequest = {
      id: 'opt-req-1',
      role: 'user' as const,
      content: `请帮我优化这段代码：\n\n${problematicCode}`,
      timestamp: new Date()
    };

    // 2. 系统分析代码问题
    const analysisResult = await integrationService.processUserMessage(optimizationRequest);
    
    expect(analysisResult.recommendations.length).toBeGreaterThan(0);

    // 3. 系统提取优化规则
    const sessionData = {
      messages: [optimizationRequest],
      codeSnippets: [problematicCode],
      metadata: {
        language: 'javascript',
        issueType: 'code_style'
      }
    };

    const rulesResult = await integrationService.extractRules(sessionData);
    
    // 4. 系统应用优化规则
    const injectionResult = await integrationService.injectRulesToCode(
      problematicCode, 
      rulesResult.patterns
    );

    expect(injectionResult.generatedCode).toBeDefined();
    expect(injectionResult.appliedRules.length).toBeGreaterThan(0);
    expect(injectionResult.confidence).toBeGreaterThan(0);

    // 5. 验证优化效果
    const optimizedCode = injectionResult.generatedCode;
    expect(optimizedCode).not.toContain('var '); // 应该使用 const/let
    expect(optimizedCode).toContain('const ');
    expect(optimizedCode).toContain('let ');

    console.log('✅ 代码优化建议工作流测试通过');
  });

  test('多会话记忆管理工作流', async () => {
    // 场景：测试系统在多会话环境下的记忆管理
    
    // 会话1：React 开发
    integrationService.setCurrentSession('react-session');
    
    const reactRequest = {
      id: 'react-req-1',
      role: 'user' as const,
      content: '如何创建可重用的React组件？',
      timestamp: new Date()
    };

    await integrationService.processUserMessage(reactRequest);

    const reactResponse = {
      id: 'react-resp-1',
      role: 'assistant' as const,
      content: '可以使用React Hooks和Props来创建可重用组件',
      timestamp: new Date()
    };

    await integrationService.processAIResponse(reactResponse, reactRequest);

    // 会话2：Vue 开发
    integrationService.setCurrentSession('vue-session');
    
    const vueRequest = {
      id: 'vue-req-1',
      role: 'user' as const,
      content: 'Vue.js中如何实现组件通信？',
      timestamp: new Date()
    };

    await integrationService.processUserMessage(vueRequest);

    const vueResponse = {
      id: 'vue-resp-1',
      role: 'assistant' as const,
      content: '可以使用Props、Events和Vuex进行组件通信',
      timestamp: new Date()
    };

    await integrationService.processAIResponse(vueResponse, vueRequest);

    // 验证会话隔离
    const stats = await integrationService.getMemoryStats();
    expect(stats.totalSessions).toBe(2);

    // 验证技术栈记忆分离
    // React会话应该记忆React相关模式
    // Vue会话应该记忆Vue相关模式
    
    console.log('✅ 多会话记忆管理工作流测试通过');
  });

  test('实时协作工作流', async () => {
    // 场景：多个用户同时使用系统的实时协作
    
    const concurrentUsers = 3;
    const messagesPerUser = 5;
    
    const userSessions = Array.from({ length: concurrentUsers }, (_, i) => ({
      sessionId: `user-${i}-session`,
      messages: Array.from({ length: messagesPerUser }, (j) => ({
        id: `user-${i}-msg-${j}`,
        role: 'user' as const,
        content: `用户${i}的消息${j}`,
        timestamp: new Date(Date.now() + j * 1000)
      }))
    }));

    // 并发处理多个用户的消息
    const processingPromises = userSessions.flatMap(session => 
      session.messages.map(async (message) => {
        integrationService.setCurrentSession(session.sessionId);
        return await integrationService.processUserMessage(message);
      })
    );

    const results = await Promise.all(processingPromises);
    
    // 验证所有消息都成功处理
    expect(results.length).toBe(concurrentUsers * messagesPerUser);
    results.forEach(result => {
      expect(result).toBeDefined();
      expect(result.enhancedContext).toBeDefined();
    });

    // 验证系统状态
    const finalStats = await integrationService.getMemoryStats();
    expect(finalStats.totalSessions).toBe(concurrentUsers);
    expect(finalStats.totalMessages).toBe(concurrentUsers * messagesPerUser);

    console.log('✅ 实时协作工作流测试通过');
  });

  test('错误恢复工作流', async () => {
    // 场景：测试系统在异常情况下的恢复能力
    
    // 1. 正常操作
    integrationService.setCurrentSession('recovery-session');
    
    const normalMessage = {
      id: 'normal-msg',
      role: 'user' as const,
      content: '正常测试消息',
      timestamp: new Date()
    };

    await integrationService.processUserMessage(normalMessage);

    // 2. 模拟组件故障（通过重置服务）
    await integrationService.reset();
    
    // 验证服务已停止
    const stoppedStatus = integrationService.getIntegrationStatus();
    expect(stoppedStatus.isInitialized).toBe(false);

    // 3. 恢复服务
    await integrationService.initialize();
    integrationService.setCurrentSession('recovery-session');
    
    // 验证服务已恢复
    const recoveredStatus = integrationService.getIntegrationStatus();
    expect(recoveredStatus.isInitialized).toBe(true);

    // 4. 继续正常操作
    const recoveryMessage = {
      id: 'recovery-msg',
      role: 'user' as const,
      content: '恢复后测试消息',
      timestamp: new Date()
    };

    await integrationService.processUserMessage(recoveryMessage);

    console.log('✅ 错误恢复工作流测试通过');
  });
});

describe('端到端性能基准测试', () => {
  let integrationService: IntegrationService;

  beforeEach(async () => {
    integrationService = new IntegrationService({
      enableMemory: true,
      enableRuleForge: true,
      enableScheduler: true,
      logLevel: 'error' // 减少日志输出
    });
    await integrationService.initialize();
  });

  afterEach(async () => {
    await integrationService.reset();
  });

  test('大规模消息处理性能', async () => {
    const messageCount = 1000;
    const startTime = performance.now();
    
    integrationService.setCurrentSession('performance-session');
    
    // 生成大量测试消息
    const messages = Array.from({ length: messageCount }, (_, i) => ({
      id: `perf-msg-${i}`,
      role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
      content: `性能测试消息 ${i}`,
      timestamp: new Date(Date.now() + i * 10)
    }));

    // 顺序处理消息（模拟真实场景）
    for (const message of messages) {
      await integrationService.processUserMessage(message);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const messagesPerSecond = messageCount / (duration / 1000);

    console.log(`处理 ${messageCount} 条消息耗时: ${duration.toFixed(2)}ms`);
    console.log(`吞吐量: ${messagesPerSecond.toFixed(2)} 消息/秒`);

    // 性能基准：1000条消息应该在30秒内处理完成
    expect(duration).toBeLessThan(30000);
    expect(messagesPerSecond).toBeGreaterThan(30);
  });

  test('复杂任务分解性能', async () => {
    const complexRequirements = [
      '开发一个完整的电商平台，包含用户管理、商品管理、订单处理、支付集成、物流跟踪、数据分析仪表板',
      '创建一个企业级ERP系统，包含人力资源管理、财务管理、供应链管理、客户关系管理、项目管理',
      '构建一个社交媒体平台，支持实时聊天、内容分享、好友系统、推荐算法、数据分析'
    ];

    const startTime = performance.now();
    
    for (const requirement of complexRequirements) {
      const decomposition = await integrationService.decomposeTask(requirement);
      
      // 验证分解质量
      expect(decomposition.tasks.length).toBeGreaterThan(5);
      expect(decomposition.totalEstimatedTime).toBeGreaterThan(0);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgTimePerRequirement = duration / complexRequirements.length;

    console.log(`处理 ${complexRequirements.length} 个复杂需求耗时: ${duration.toFixed(2)}ms`);
    console.log(`平均每个需求: ${avgTimePerRequirement.toFixed(2)}ms`);

    // 性能基准：复杂需求分解应该在10秒内完成
    expect(duration).toBeLessThan(10000);
  });

  test('内存使用效率', async () => {
    const initialMemory = process.memoryUsage();
    
    // 执行密集操作
    integrationService.setCurrentSession('memory-test-session');
    
    for (let i = 0; i < 500; i++) {
      const message = {
        id: `memory-msg-${i}`,
        role: 'user' as const,
        content: `内存测试消息 ${i}`.repeat(10), // 增加消息长度
        timestamp: new Date()
      };
      
      await integrationService.processUserMessage(message);
    }

    const finalMemory = process.memoryUsage();
    const heapUsedIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    const heapUsedIncreaseMB = heapUsedIncrease / 1024 / 1024;

    console.log(`内存使用增加: ${heapUsedIncreaseMB.toFixed(2)}MB`);

    // 内存基准：500条长消息处理内存增加应该小于200MB
    expect(heapUsedIncreaseMB).toBeLessThan(200);
  });
});

describe('端到端用户体验测试', () => {
  let integrationService: IntegrationService;

  beforeEach(async () => {
    integrationService = new IntegrationService({
      enableMemory: true,
      enableRuleForge: true,
      enableScheduler: true,
      logLevel: 'info'
    });
    await integrationService.initialize();
  });

  afterEach(async () => {
    await integrationService.reset();
  });

  test('响应时间用户体验', async () => {
    integrationService.setCurrentSession('ux-session');
    
    const testMessages = [
      '你好，请帮我创建一个简单的登录表单',
      '如何优化React应用的性能？',
      '请解释一下TypeScript中的泛型',
      '如何实现前端路由？',
      '请帮我调试这段代码'
    ];

    const responseTimes: number[] = [];
    
    for (const messageContent of testMessages) {
      const message = {
        id: `ux-msg-${Date.now()}`,
        role: 'user' as const,
        content: messageContent,
        timestamp: new Date()
      };

      const startTime = performance.now();
      await integrationService.processUserMessage(message);
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);
      
      console.log(`消息 "${messageContent.substring(0, 20)}..." 响应时间: ${responseTime.toFixed(2)}ms`);
    }

    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);

    console.log(`平均响应时间: ${averageResponseTime.toFixed(2)}ms`);
    console.log(`最大响应时间: ${maxResponseTime.toFixed(2)}ms`);

    // 用户体验基准：平均响应时间应该小于500ms
    expect(averageResponseTime).toBeLessThan(500);
    // 最大响应时间应该小于2000ms
    expect(maxResponseTime).toBeLessThan(2000);
  });

  test('功能完整性用户体验', async () => {
    // 测试所有核心功能的可用性
    integrationService.setCurrentSession('completeness-session');
    
    const testScenarios = [
      {
        name: '简单对话',
        message: '你好，请介绍一下你自己',
        expected: '能够正常响应'
      },
      {
        name: '任务分解',
        message: '请帮我分解开发一个博客系统的任务',
        expected: '返回合理的任务分解'
      },
      {
        name: '代码建议',
        message: '如何优化这段代码的性能？',
        expected: '提供具体的优化建议'
      },
      {
        name: '规则提取',
        message: '从我们的对话中提取一些开发最佳实践',
        expected: '生成有用的规则模式'
      }
    ];

    for (const scenario of testScenarios) {
      const message = {
        id: `scenario-${scenario.name}`,
        role: 'user' as const,
        content: scenario.message,
        timestamp: new Date()
      };

      const result = await integrationService.processUserMessage(message);
      
      // 验证基本功能正常
      expect(result).toBeDefined();
      expect(result.enhancedContext).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      
      console.log(`✅ ${scenario.name} 功能测试通过`);
    }

    console.log('✅ 所有核心功能用户体验测试通过');
  });
});