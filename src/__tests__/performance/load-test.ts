// 性能负载测试套件

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { IntegrationService } from '../../lib/integration-service';

// 性能测试配置
const PERFORMANCE_CONFIG = {
  // 并发用户数
  CONCURRENT_USERS: 10,
  
  // 每个用户的消息数
  MESSAGES_PER_USER: 20,
  
  // 性能基准阈值
  RESPONSE_TIME_THRESHOLD: 1000, // 1秒
  MEMORY_USAGE_THRESHOLD: 500,   // 500MB
  CPU_USAGE_THRESHOLD: 80,       // 80%
  
  // 测试持续时间（毫秒）
  TEST_DURATION: 30000, // 30秒
};

describe('性能负载测试', () => {
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

  test('高并发用户负载测试', async () => {
    console.log(`开始高并发负载测试: ${PERFORMANCE_CONFIG.CONCURRENT_USERS} 并发用户`);
    
    const startTime = performance.now();
    const testResults = {
      totalMessages: 0,
      successfulMessages: 0,
      failedMessages: 0,
      totalResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity
    };

    // 模拟并发用户
    const userPromises = Array.from(
      { length: PERFORMANCE_CONFIG.CONCURRENT_USERS }, 
      async (_, userIndex) => {
        const sessionId = `user-${userIndex}-session`;
        integrationService.setCurrentSession(sessionId);

        for (let msgIndex = 0; msgIndex < PERFORMANCE_CONFIG.MESSAGES_PER_USER; msgIndex++) {
          const message = {
            id: `user-${userIndex}-msg-${msgIndex}`,
            role: 'user' as const,
            content: `用户${userIndex}的消息${msgIndex}`,
            timestamp: new Date()
          };

          const messageStartTime = performance.now();
          
          try {
            await integrationService.processUserMessage(message);
            const responseTime = performance.now() - messageStartTime;
            
            testResults.totalMessages++;
            testResults.successfulMessages++;
            testResults.totalResponseTime += responseTime;
            testResults.maxResponseTime = Math.max(testResults.maxResponseTime, responseTime);
            testResults.minResponseTime = Math.min(testResults.minResponseTime, responseTime);
            
          } catch (error) {
            testResults.totalMessages++;
            testResults.failedMessages++;
            console.error(`用户${userIndex}消息${msgIndex}处理失败:`, error);
          }
        }
      }
    );

    // 等待所有用户完成
    await Promise.all(userPromises);
    
    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    // 计算性能指标
    const avgResponseTime = testResults.totalResponseTime / testResults.successfulMessages;
    const throughput = testResults.totalMessages / (totalDuration / 1000);
    const successRate = (testResults.successfulMessages / testResults.totalMessages) * 100;

    // 输出性能报告
    console.log('=== 高并发负载测试结果 ===');
    console.log(`总消息数: ${testResults.totalMessages}`);
    console.log(`成功消息: ${testResults.successfulMessages}`);
    console.log(`失败消息: ${testResults.failedMessages}`);
    console.log(`成功率: ${successRate.toFixed(2)}%`);
    console.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`最大响应时间: ${testResults.maxResponseTime.toFixed(2)}ms`);
    console.log(`最小响应时间: ${testResults.minResponseTime.toFixed(2)}ms`);
    console.log(`吞吐量: ${throughput.toFixed(2)} 消息/秒`);
    console.log(`总测试时间: ${totalDuration.toFixed(2)}ms`);

    // 性能断言
    expect(successRate).toBeGreaterThanOrEqual(95); // 成功率 >= 95%
    expect(avgResponseTime).toBeLessThan(PERFORMANCE_CONFIG.RESPONSE_TIME_THRESHOLD);
    expect(testResults.maxResponseTime).toBeLessThan(PERFORMANCE_CONFIG.RESPONSE_TIME_THRESHOLD * 2);
    expect(throughput).toBeGreaterThan(50); // 吞吐量 > 50 消息/秒
  });

  test('内存使用监控测试', async () => {
    console.log('开始内存使用监控测试');
    
    const initialMemory = process.memoryUsage();
    const memorySamples: number[] = [];
    
    integrationService.setCurrentSession('memory-test-session');
    
    // 执行密集操作并监控内存
    for (let i = 0; i < 1000; i++) {
      const message = {
        id: `memory-msg-${i}`,
        role: 'user' as const,
        content: `内存测试消息 ${i}`.repeat(5), // 增加消息长度
        timestamp: new Date()
      };
      
      await integrationService.processUserMessage(message);
      
      // 每100条消息采样一次内存使用
      if (i % 100 === 0) {
        const currentMemory = process.memoryUsage();
        memorySamples.push(currentMemory.heapUsed);
      }
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
    
    // 分析内存使用模式
    const maxMemoryUsage = Math.max(...memorySamples);
    const avgMemoryUsage = memorySamples.reduce((a, b) => a + b, 0) / memorySamples.length;
    const memoryStability = Math.max(...memorySamples) - Math.min(...memorySamples);
    
    console.log('=== 内存使用监控测试结果 ===');
    console.log(`初始内存: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`最终内存: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`内存增加: ${memoryIncreaseMB.toFixed(2)}MB`);
    console.log(`最大内存使用: ${(maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    console.log(`平均内存使用: ${(avgMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    console.log(`内存稳定性: ${(memoryStability / 1024 / 1024).toFixed(2)}MB`);
    
    // 内存性能断言
    expect(memoryIncreaseMB).toBeLessThan(PERFORMANCE_CONFIG.MEMORY_USAGE_THRESHOLD);
    expect(maxMemoryUsage / 1024 / 1024).toBeLessThan(PERFORMANCE_CONFIG.MEMORY_USAGE_THRESHOLD * 1.5);
  });

  test('长时间运行稳定性测试', async () => {
    console.log('开始长时间运行稳定性测试');
    
    const testStartTime = performance.now();
    let messageCount = 0;
    let errorCount = 0;
    const responseTimes: number[] = [];
    
    integrationService.setCurrentSession('stability-test-session');
    
    // 持续运行测试直到达到时间限制
    while (performance.now() - testStartTime < PERFORMANCE_CONFIG.TEST_DURATION) {
      const message = {
        id: `stability-msg-${messageCount}`,
        role: 'user' as const,
        content: `稳定性测试消息 ${messageCount}`,
        timestamp: new Date()
      };
      
      const startTime = performance.now();
      
      try {
        await integrationService.processUserMessage(message);
        const responseTime = performance.now() - startTime;
        responseTimes.push(responseTime);
        messageCount++;
        
        // 添加随机延迟模拟真实场景
        await new Promise(resolve => 
          setTimeout(resolve, Math.random() * 100)
        );
        
      } catch (error) {
        errorCount++;
        console.error(`消息${messageCount}处理失败:`, error);
      }
    }
    
    const testEndTime = performance.now();
    const totalDuration = testEndTime - testStartTime;
    
    // 计算稳定性指标
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const throughput = messageCount / (totalDuration / 1000);
    const errorRate = (errorCount / (messageCount + errorCount)) * 100;
    
    // 分析响应时间稳定性
    const responseTimeStdDev = Math.sqrt(
      responseTimes.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length
    );
    
    console.log('=== 长时间运行稳定性测试结果 ===');
    console.log(`测试持续时间: ${(totalDuration / 1000).toFixed(2)}秒`);
    console.log(`处理消息数: ${messageCount}`);
    console.log(`错误数: ${errorCount}`);
    console.log(`错误率: ${errorRate.toFixed(2)}%`);
    console.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`响应时间标准差: ${responseTimeStdDev.toFixed(2)}ms`);
    console.log(`吞吐量: ${throughput.toFixed(2)} 消息/秒`);
    
    // 稳定性断言
    expect(errorRate).toBeLessThan(1); // 错误率 < 1%
    expect(responseTimeStdDev).toBeLessThan(avgResponseTime * 0.5); // 响应时间稳定性
    expect(throughput).toBeGreaterThan(10); // 持续吞吐量 > 10 消息/秒
  });

  test('资源使用效率测试', async () => {
    console.log('开始资源使用效率测试');
    
    const initialResources = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
    
    integrationService.setCurrentSession('efficiency-test-session');
    
    // 执行标准工作负载
    const workload = Array.from({ length: 100 }, (_, i) => ({
      id: `efficiency-msg-${i}`,
      role: 'user' as const,
      content: `效率测试消息 ${i}`,
      timestamp: new Date()
    }));
    
    const startTime = performance.now();
    
    for (const message of workload) {
      await integrationService.processUserMessage(message);
    }
    
    const endTime = performance.now();
    const finalResources = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(initialResources.cpu)
    };
    
    const duration = endTime - startTime;
    const memoryIncrease = finalResources.memory.heapUsed - initialResources.memory.heapUsed;
    const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
    const cpuUsagePercent = (finalResources.cpu.user + finalResources.cpu.system) / (duration * 1000) * 100;
    
    console.log('=== 资源使用效率测试结果 ===');
    console.log(`工作负载: 100条消息`);
    console.log(`处理时间: ${duration.toFixed(2)}ms`);
    console.log(`内存增加: ${memoryIncreaseMB.toFixed(2)}MB`);
    console.log(`CPU使用率: ${cpuUsagePercent.toFixed(2)}%`);
    console.log(`消息处理速率: ${(100 / (duration / 1000)).toFixed(2)} 消息/秒`);
    console.log(`内存效率: ${(memoryIncreaseMB / 100).toFixed(4)}MB/消息`);
    console.log(`CPU效率: ${(cpuUsagePercent / 100).toFixed(4)}%/消息`);
    
    // 效率断言
    expect(memoryIncreaseMB).toBeLessThan(50); // 100条消息内存增加 < 50MB
    expect(cpuUsagePercent).toBeLessThan(PERFORMANCE_CONFIG.CPU_USAGE_THRESHOLD);
    expect(duration).toBeLessThan(10000); // 100条消息应该在10秒内完成
  });

  test('可扩展性测试', async () => {
    console.log('开始可扩展性测试');
    
    const scalabilityResults = {
      userCounts: [1, 5, 10, 20],
      throughputs: [] as number[],
      responseTimes: [] as number[]
    };
    
    for (const userCount of scalabilityResults.userCounts) {
      console.log(`测试 ${userCount} 个并发用户...`);
      
      const startTime = performance.now();
      let messageCount = 0;
      let totalResponseTime = 0;
      
      // 模拟并发用户
      const userPromises = Array.from({ length: userCount }, async (_, userIndex) => {
        const sessionId = `scalability-user-${userIndex}`;
        integrationService.setCurrentSession(sessionId);
        
        for (let i = 0; i < 10; i++) {
          const message = {
            id: `scalability-${userIndex}-${i}`,
            role: 'user' as const,
            content: `可扩展性测试消息`,
            timestamp: new Date()
          };
          
          const messageStart = performance.now();
          await integrationService.processUserMessage(message);
          const responseTime = performance.now() - messageStart;
          
          messageCount++;
          totalResponseTime += responseTime;
        }
      });
      
      await Promise.all(userPromises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const throughput = messageCount / (duration / 1000);
      const avgResponseTime = totalResponseTime / messageCount;
      
      scalabilityResults.throughputs.push(throughput);
      scalabilityResults.responseTimes.push(avgResponseTime);
      
      console.log(`  ${userCount}用户 - 吞吐量: ${throughput.toFixed(2)} 消息/秒, 平均响应: ${avgResponseTime.toFixed(2)}ms`);
    }
    
    // 分析可扩展性
    const scalabilityFactor = scalabilityResults.throughputs[scalabilityResults.throughputs.length - 1] / 
                             scalabilityResults.throughputs[0];
    
    console.log('=== 可扩展性测试结果 ===');
    console.log('用户数 -> 吞吐量 (消息/秒), 平均响应时间 (ms)');
    scalabilityResults.userCounts.forEach((users, index) => {
      console.log(`${users} -> ${scalabilityResults.throughputs[index].toFixed(2)}, ${scalabilityResults.responseTimes[index].toFixed(2)}`);
    });
    console.log(`可扩展性因子: ${scalabilityFactor.toFixed(2)}`);
    
    // 可扩展性断言
    expect(scalabilityFactor).toBeGreaterThan(0.5); // 应该有基本的可扩展性
    expect(scalabilityResults.responseTimes[scalabilityResults.responseTimes.length - 1])
      .toBeLessThan(PERFORMANCE_CONFIG.RESPONSE_TIME_THRESHOLD * 2); // 高负载下响应时间可接受
  });
});

describe('性能基准比较测试', () => {
  test('不同配置下的性能比较', async () => {
    console.log('开始不同配置性能比较测试');
    
    const configs = [
      { name: '完整功能', enableMemory: true, enableRuleForge: true, enableScheduler: true },
      { name: '仅记忆系统', enableMemory: true, enableRuleForge: false, enableScheduler: false },
      { name: '仅任务调度', enableMemory: false, enableRuleForge: false, enableScheduler: true },
      { name: '仅规则引擎', enableMemory: false, enableRuleForge: true, enableScheduler: false }
    ];
    
    const performanceResults: any[] = [];
    
    for (const config of configs) {
      console.log(`测试配置: ${config.name}`);
      
      const service = new IntegrationService({
        enableMemory: config.enableMemory,
        enableRuleForge: config.enableRuleForge,
        enableScheduler: config.enableScheduler,
        logLevel: 'error'
      });
      
      await service.initialize();
      service.setCurrentSession(`config-test-${config.name}`);
      
      const startTime = performance.now();
      let messageCount = 0;
      let totalResponseTime = 0;
      
      // 标准测试工作负载
      for (let i = 0; i < 50; i++) {
        const message = {
          id: `config-${config.name}-${i}`,
          role: 'user' as const,
          content: `配置测试消息 ${i}`,
          timestamp: new Date()
        };
        
        const messageStart = performance.now();
        await service.processUserMessage(message);
        const responseTime = performance.now() - messageStart;
        
        messageCount++;
        totalResponseTime += responseTime;
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const throughput = messageCount / (duration / 1000);
      const avgResponseTime = totalResponseTime / messageCount;
      
      performanceResults.push({
        config: config.name,
        throughput,
        avgResponseTime,
        duration
      });
      
      await service.reset();
    }
    
    console.log('=== 配置性能比较结果 ===');
    performanceResults.forEach(result => {
      console.log(`${result.config}: 吞吐量 ${result.throughput.toFixed(2)} 消息/秒, 平均响应 ${result.avgResponseTime.toFixed(2)}ms`);
    });
    
    // 性能比较分析
    const fullConfig = performanceResults.find(r => r.config === '完整功能');
    const memoryOnly = performanceResults.find(r => r.config === '仅记忆系统');
    
    // 验证完整配置的性能在可接受范围内
    expect(fullConfig.avgResponseTime).toBeLessThan(PERFORMANCE_CONFIG.RESPONSE_TIME_THRESHOLD);
    expect(fullConfig.throughput).toBeGreaterThan(10);
  });
});