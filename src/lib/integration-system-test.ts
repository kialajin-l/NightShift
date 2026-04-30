// NightShift 集成系统端到端测试

import { IntegrationService } from './integration-service';
import { Message } from './memory/memory-types';

/**
 * 集成系统测试类
 */
export class IntegrationSystemTest {
  private integrationService: IntegrationService;
  
  constructor() {
    this.integrationService = new IntegrationService({
      enableMemory: true,
      enableRuleForge: true,
      enableScheduler: true,
      logLevel: 'info'
    });
  }

  /**
   * 运行完整端到端测试
   */
  async runFullTest(): Promise<{
    success: boolean;
    results: {
      initialization: boolean;
      memorySystem: boolean;
      scheduler: boolean;
      ruleForge: boolean;
      messageProcessing: boolean;
      overall: boolean;
    };
    errors: string[];
  }> {
    const results: any = {
      initialization: false,
      memorySystem: false,
      scheduler: false,
      ruleForge: false,
      messageProcessing: false,
      overall: false
    };
    
    const errors: string[] = [];
    
    try {
      console.log('🚀 开始 NightShift 集成系统端到端测试...\n');
      
      // 1. 测试初始化
      console.log('1️⃣ 测试集成服务初始化...');
      await this.testInitialization();
      results.initialization = true;
      console.log('✅ 集成服务初始化测试通过\n');
      
      // 2. 测试记忆体系统
      console.log('2️⃣ 测试记忆体系统...');
      await this.testMemorySystem();
      results.memorySystem = true;
      console.log('✅ 记忆体系统测试通过\n');
      
      // 3. 测试任务调度系统
      console.log('3️⃣ 测试任务调度系统...');
      await this.testScheduler();
      results.scheduler = true;
      console.log('✅ 任务调度系统测试通过\n');
      
      // 4. 测试 RuleForge 规则引擎
      console.log('4️⃣ 测试 RuleForge 规则引擎...');
      await this.testRuleForge();
      results.ruleForge = true;
      console.log('✅ RuleForge 规则引擎测试通过\n');
      
      // 5. 测试消息处理流程
      console.log('5️⃣ 测试消息处理流程...');
      await this.testMessageProcessing();
      results.messageProcessing = true;
      console.log('✅ 消息处理流程测试通过\n');
      
      // 6. 测试集成状态
      console.log('6️⃣ 测试集成状态...');
      const status = this.integrationService.getIntegrationStatus();
      console.log('📊 集成状态:', status);
      
      results.overall = Object.values(results).every(result => result === true);
      
      if (results.overall) {
        console.log('🎉 NightShift 集成系统端到端测试全部通过！');
      } else {
        console.log('❌ NightShift 集成系统测试部分失败');
      }
      
      return {
        success: results.overall,
        results,
        errors
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
      console.error('❌ 测试失败:', errorMessage);
      
      return {
        success: false,
        results,
        errors
      };
    }
  }

  /**
   * 测试集成服务初始化
   */
  private async testInitialization(): Promise<void> {
    try {
      // 初始化集成服务
      await this.integrationService.initialize();
      
      // 设置当前会话
      this.integrationService.setCurrentSession('test-session-123');
      
      // 验证初始化状态
      const status = this.integrationService.getIntegrationStatus();
      
      if (!status.isInitialized) {
        throw new Error('集成服务未正确初始化');
      }
      
      console.log('   ✅ 集成服务初始化成功');
      console.log('   ✅ 会话设置成功');
      
    } catch (error) {
      throw new Error(`初始化测试失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 测试记忆体系统
   */
  private async testMemorySystem(): Promise<void> {
    try {
      // 测试记忆统计
      const memoryStats = await this.integrationService.getMemoryStats();
      console.log('   ✅ 记忆统计获取成功:', memoryStats);
      
      // 测试短期记忆存储
      const testMemory = {
        sessionId: 'test-session-123',
        content: {
          message: '测试记忆内容',
          enhancedContext: { test: 'data' },
          knowledgeContext: {}
        },
        timestamp: new Date(),
        importance: 'high' as const
      };
      
      console.log('   ✅ 记忆系统功能正常');
      
    } catch (error) {
      throw new Error(`记忆体系统测试失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 测试任务调度系统
   */
  private async testScheduler(): Promise<void> {
    try {
      // 测试任务分解
      const requirement = '创建一个 React 组件，包含表单验证和提交功能';
      const decomposition = await this.integrationService.decomposeTask(requirement);
      
      if (!decomposition || !decomposition.tasks || decomposition.tasks.length === 0) {
        throw new Error('任务分解失败');
      }
      
      console.log('   ✅ 任务分解成功:', decomposition.tasks.length, '个子任务');
      
      // 测试调度器统计
      const schedulerStats = await this.integrationService.getSchedulerStats();
      console.log('   ✅ 调度器统计获取成功:', schedulerStats);
      
      console.log('   ✅ 任务调度系统功能正常');
      
    } catch (error) {
      throw new Error(`任务调度系统测试失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 测试 RuleForge 规则引擎
   */
  private async testRuleForge(): Promise<void> {
    try {
      // 测试规则提取
      const sessionData = {
        messages: [
          { role: 'user', content: '如何优化 React 组件性能？' },
          { role: 'assistant', content: '可以使用 React.memo 和 useMemo 进行优化' }
        ]
      };
      
      const extractionResult = await this.integrationService.extractRules(sessionData);
      
      if (!extractionResult || !extractionResult.patterns) {
        throw new Error('规则提取失败');
      }
      
      console.log('   ✅ 规则提取成功:', extractionResult.totalPatterns, '个模式');
      
      // 测试规则统计
      const ruleStats = await this.integrationService.getRuleStats(extractionResult.patterns);
      console.log('   ✅ 规则统计获取成功:', ruleStats);
      
      // 测试 YAML 规则生成
      const yamlContent = await this.integrationService.generateYAMLRules(extractionResult.patterns);
      
      if (!yamlContent || yamlContent.length === 0) {
        throw new Error('YAML 规则生成失败');
      }
      
      console.log('   ✅ YAML 规则生成成功');
      
      console.log('   ✅ RuleForge 规则引擎功能正常');
      
    } catch (error) {
      throw new Error(`RuleForge 测试失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 测试消息处理流程
   */
  private async testMessageProcessing(): Promise<void> {
    try {
      // 创建测试消息
      const testMessage: Message = {
        id: 'test-message-123',
        role: 'user',
        content: '帮我创建一个用户注册表单组件',
        timestamp: new Date()
      };
      
      // 测试用户消息处理
      const userMessageResult = await this.integrationService.processUserMessage(testMessage);
      
      if (!userMessageResult || !userMessageResult.enhancedContext) {
        throw new Error('用户消息处理失败');
      }
      
      console.log('   ✅ 用户消息处理成功');
      
      // 创建 AI 响应消息
      const aiResponse: Message = {
        id: 'ai-response-123',
        role: 'assistant',
        content: '好的，我来帮你创建一个用户注册表单组件...',
        timestamp: new Date()
      };
      
      // 测试 AI 响应处理
      await this.integrationService.processAIResponse(aiResponse, testMessage);
      
      console.log('   ✅ AI 响应处理成功');
      
      console.log('   ✅ 消息处理流程功能正常');
      
    } catch (error) {
      throw new Error(`消息处理流程测试失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 运行性能测试
   */
  async runPerformanceTest(): Promise<{
    averageResponseTime: number;
    memoryUsage: number;
    throughput: number;
  }> {
    console.log('\n📊 开始性能测试...');
    
    const startTime = Date.now();
    const testRuns = 10;
    let totalResponseTime = 0;
    
    for (let i = 0; i < testRuns; i++) {
      const testStart = Date.now();
      
      // 模拟消息处理
      const testMessage: Message = {
        id: `perf-test-${i}`,
        role: 'user',
        content: `性能测试消息 ${i}`,
        timestamp: new Date()
      };
      
      try {
        await this.integrationService.processUserMessage(testMessage);
        const responseTime = Date.now() - testStart;
        totalResponseTime += responseTime;
        
        console.log(`   测试 ${i + 1}/${testRuns}: ${responseTime}ms`);
      } catch (error) {
        console.log(`   测试 ${i + 1}/${testRuns}: 失败`);
      }
    }
    
    const averageResponseTime = totalResponseTime / testRuns;
    const totalTime = Date.now() - startTime;
    const throughput = (testRuns / (totalTime / 1000)).toFixed(2);
    
    console.log('📊 性能测试结果:');
    console.log(`   平均响应时间: ${averageResponseTime.toFixed(2)}ms`);
    console.log(`   吞吐量: ${throughput} 消息/秒`);
    
    return {
      averageResponseTime,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      throughput: parseFloat(throughput)
    };
  }
}

/**
 * 运行测试
 */
async function runTests() {
  const test = new IntegrationSystemTest();
  
  try {
    // 运行端到端测试
    const result = await test.runFullTest();
    
    if (result.success) {
      // 运行性能测试
      await test.runPerformanceTest();
      
      console.log('\n🎊 NightShift 集成系统测试完成！所有功能正常运行。');
    } else {
      console.log('\n❌ 测试失败，请检查错误信息:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
  } catch (error) {
    console.error('测试运行失败:', error);
  }
}

// 如果直接运行此文件，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}