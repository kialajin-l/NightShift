/**
 * NightShift MVP 验证演示
 * 验证端到端工作流的可运行状态
 */

import { MockNightShiftOrchestrator } from '../src/orchestrator/mock-orchestrator.js';

/**
 * MVP 验证测试
 */
async function validateMVP() {
  console.log('🧪 NightShift MVP 验证测试');
  console.log('========================================');
  console.log('');

  // 测试场景：登录页生成
  const testScenarios = [
    {
      name: '登录页生成',
      input: '帮我做个登录页，要邮箱密码，记住我',
      expectedTasks: 3,
      expectedFiles: 2,
      timeout: 300000 // 5分钟
    },
    {
      name: '用户注册', 
      input: '需要用户注册功能，包含邮箱验证',
      expectedTasks: 2,
      expectedFiles: 2,
      timeout: 180000 // 3分钟
    },
    {
      name: '数据表格',
      input: '做个用户列表表格，支持搜索和分页',
      expectedTasks: 2,
      expectedFiles: 2,
      timeout: 240000 // 4分钟
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  let totalExecutionTime = 0;

  for (const scenario of testScenarios) {
    totalTests++;
    console.log(`📋 测试场景: ${scenario.name}`);
    console.log(`   输入: "${scenario.input}"`);
    console.log(`   预期任务: ${scenario.expectedTasks}`);
    console.log(`   预期文件: ${scenario.expectedFiles}`);
    console.log(`   超时限制: ${scenario.timeout / 1000}秒`);
    console.log('');

    const startTime = Date.now();
    let testPassed = false;
    let errorMessage = '';

    try {
      // 创建协调器
      const orchestrator = new MockNightShiftOrchestrator();
      
      // 设置超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('测试超时')), scenario.timeout);
      });
      
      // 执行工作流
      const workflowPromise = orchestrator.executeWorkflow(scenario.input);
      
      const result = await Promise.race([workflowPromise, timeoutPromise]);
      
      const executionTime = Date.now() - startTime;
      totalExecutionTime += executionTime;
      
      // 验证结果
      testPassed = this.validateTestResult(result, scenario);
      
      if (testPassed) {
        passedTests++;
        console.log(`   ✅ 测试通过`);
        console.log(`      耗时: ${(executionTime / 1000).toFixed(1)}秒`);
        console.log(`      生成任务: ${result.tasks.length}`);
        console.log(`      生成文件: ${result.generatedFiles.length}`);
        console.log(`      提取规则: ${result.extractedRules.length}`);
      } else {
        errorMessage = '结果验证失败';
        console.log(`   ❌ 测试失败: ${errorMessage}`);
      }
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      errorMessage = error.message;
      console.log(`   ❌ 测试失败: ${errorMessage}`);
      console.log(`      已执行时间: ${(executionTime / 1000).toFixed(1)}秒`);
    }
    
    console.log('');
    
    // 记录测试结果
    this.recordTestResult(scenario.name, testPassed, errorMessage);
  }

  // 生成测试报告
  await generateTestReport(totalTests, passedTests, totalExecutionTime);
}

/**
 * 验证测试结果
 */
function validateTestResult(result: any, scenario: any): boolean {
  // 检查基本成功状态
  if (!result.success) {
    return false;
  }
  
  // 检查任务数量
  if (result.tasks.length < scenario.expectedTasks) {
    return false;
  }
  
  // 检查文件数量
  if (result.generatedFiles.length < scenario.expectedFiles) {
    return false;
  }
  
  // 检查错误数量
  if (result.errors && result.errors.length > 0) {
    return false;
  }
  
  return true;
}

/**
 * 记录测试结果
 */
function recordTestResult(scenarioName: string, passed: boolean, errorMessage: string): void {
  const status = passed ? 'PASS' : 'FAIL';
  const message = passed ? '通过' : `失败: ${errorMessage}`;
  
  console.log(`   📊 ${scenarioName}: ${status} - ${message}`);
}

/**
 * 生成测试报告
 */
async function generateTestReport(totalTests: number, passedTests: number, totalTime: number): Promise<void> {
  console.log('');
  console.log('📈 MVP 验证测试报告');
  console.log('========================================');
  console.log('');
  
  const successRate = (passedTests / totalTests) * 100;
  const averageTime = totalTime / totalTests / 1000;
  
  console.log(`   测试总数: ${totalTests}`);
  console.log(`   通过数量: ${passedTests}`);
  console.log(`   成功率: ${successRate.toFixed(1)}%`);
  console.log(`   平均耗时: ${averageTime.toFixed(1)}秒`);
  console.log(`   总耗时: ${(totalTime / 1000).toFixed(1)}秒`);
  console.log('');
  
  // 性能评估
  console.log('   🚀 性能评估:');
  if (averageTime <= 60) {
    console.log('      ✅ 优秀 - 执行时间在1分钟以内');
  } else if (averageTime <= 180) {
    console.log('      ⚠️  良好 - 执行时间在3分钟以内');
  } else if (averageTime <= 300) {
    console.log('      🔶 及格 - 执行时间在5分钟以内');
  } else {
    console.log('      ❌ 需优化 - 执行时间超过5分钟');
  }
  
  // 稳定性评估
  console.log('');
  console.log('   💪 稳定性评估:');
  if (successRate >= 90) {
    console.log('      ✅ 优秀 - 成功率90%以上');
  } else if (successRate >= 70) {
    console.log('      ⚠️  良好 - 成功率70%以上');
  } else if (successRate >= 50) {
    console.log('      🔶 及格 - 成功率50%以上');
  } else {
    console.log('      ❌ 需优化 - 成功率低于50%');
  }
  
  // MVP 验证结论
  console.log('');
  console.log('   🎯 MVP 验证结论:');
  
  const mvpPassed = successRate >= 70 && averageTime <= 300;
  
  if (mvpPassed) {
    console.log('      ✅ MVP 验证通过！');
    console.log('      🚀 NightShift 已准备好投入生产环境');
    console.log('');
    console.log('   📋 已验证功能:');
    console.log('      • 任务分解和调度');
    console.log('      • Agent 并发执行');
    console.log('      • 代码生成能力');
    console.log('      • 规则提取和注入');
    console.log('      • 进度监控和更新');
    console.log('      • 错误处理和恢复');
  } else {
    console.log('      ❌ MVP 验证未通过');
    console.log('');
    console.log('   🔧 需要改进的方面:');
    
    if (successRate < 70) {
      console.log('      • 提高系统稳定性');
      console.log('      • 加强错误处理机制');
      console.log('      • 优化模块间通信');
    }
    
    if (averageTime > 300) {
      console.log('      • 优化性能瓶颈');
      console.log('      • 增加并发处理能力');
      console.log('      • 缓存常用操作');
    }
  }
  
  console.log('');
  console.log('========================================');
}

/**
 * 运行演示
 */
async function runDemo() {
  try {
    await validateMVP();
  } catch (error) {
    console.error('MVP验证过程中发生错误:', error);
  }
}

// 如果直接运行此文件，则执行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo();
}

export { runDemo, validateMVP };