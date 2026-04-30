/**
 * NightShift 模型路由系统演示
 * 展示智能模型分配和路由功能
 */

import { SmartModelRouter } from '../src/model-router/model-router.js';
import { Task, TaskComplexity } from '../src/model-router/types/model-router.js';

/**
 * 演示函数
 */
async function demonstrateModelRouter() {
  console.log('=== NightShift 模型路由系统演示 ===\n');

  // 创建模型路由实例
  const router = new SmartModelRouter();
  
  console.log('1. 系统初始化完成');
  console.log(`   可用模型数量: ${router.getAvailableModels().length}`);
  console.log(`   路由规则数量: ${router.getConfig().rules.length}`);
  console.log('');

  // 演示任务路由
  console.log('2. 任务路由演示');
  
  // 简单任务：文件重命名
  const simpleTask: Task = {
    id: 'demo-simple-1',
    name: '重命名组件文件',
    description: '将 Button.vue 重命名为 PrimaryButton.vue',
    type: 'file_rename',
    complexity: 'simple' as TaskComplexity,
    estimatedTokens: 0,
    priority: 'normal',
    constraints: []
  };

  const simpleResult = await router.route(simpleTask);
  console.log(`   📁 简单任务: ${simpleTask.name}`);
  console.log(`     路由结果: ${simpleResult.model.name} (${simpleResult.model.type})`);
  console.log(`     置信度: ${(simpleResult.confidence * 100).toFixed(1)}%`);
  console.log(`     理由: ${simpleResult.reasoning}`);
  console.log('');

  // 中等任务：组件生成
  const mediumTask: Task = {
    id: 'demo-medium-1',
    name: '生成用户信息卡片组件',
    description: '创建一个显示用户头像、姓名和邮箱的Vue组件',
    type: 'component_generation',
    complexity: 'medium' as TaskComplexity,
    estimatedTokens: 800,
    priority: 'normal',
    constraints: [],
    technology: {
      frontend: {
        framework: 'vue',
        language: 'typescript'
      }
    }
  };

  const mediumResult = await router.route(mediumTask);
  console.log(`   🧩 中等任务: ${mediumTask.name}`);
  console.log(`     路由结果: ${mediumResult.model.name} (${mediumResult.model.type})`);
  console.log(`     置信度: ${(mediumResult.confidence * 100).toFixed(1)}%`);
  console.log(`     理由: ${mediumResult.reasoning}`);
  console.log(`     备选模型: ${mediumResult.alternatives.map(m => m.name).join(', ')}`);
  console.log('');

  // 复杂任务：架构设计
  const complexTask: Task = {
    id: 'demo-complex-1',
    name: '设计电商系统架构',
    description: '设计一个支持用户注册、商品浏览、购物车、订单管理的完整电商系统架构',
    type: 'architecture_design',
    complexity: 'complex' as TaskComplexity,
    estimatedTokens: 3000,
    priority: 'high',
    constraints: [
      { type: 'budget', value: 50 }
    ]
  };

  const complexResult = await router.route(complexTask);
  console.log(`   🏗️  复杂任务: ${complexTask.name}`);
  console.log(`     路由结果: ${complexResult.model.name} (${complexResult.model.type})`);
  console.log(`     置信度: ${(complexResult.confidence * 100).toFixed(1)}%`);
  console.log(`     理由: ${complexResult.reasoning}`);
  console.log(`     备选模型: ${complexResult.alternatives.map(m => m.name).join(', ')}`);
  console.log('');

  // 演示模型执行
  console.log('3. 模型执行演示');
  
  const testPrompt = '请生成一个简单的Vue组件，显示"Hello World"';
  const model = mediumResult.model;
  
  console.log(`   执行模型: ${model.name}`);
  console.log(`   提示内容: ${testPrompt.substring(0, 50)}...`);
  
  try {
    const executionResult = await router.execute(testPrompt, model);
    console.log(`   ✅ 执行成功`);
    console.log(`      输出: ${executionResult.output.substring(0, 80)}...`);
    console.log(`      使用token: ${executionResult.tokensUsed}`);
    console.log(`      执行时间: ${executionResult.executionTime}ms`);
    console.log(`      成本: $${executionResult.cost.toFixed(6)}`);
  } catch (error) {
    console.log(`   ❌ 执行失败: ${error.message}`);
  }
  console.log('');

  // 演示用量统计
  console.log('4. 用量统计演示');
  
  const stats = router.getUsageStats();
  console.log(`   总请求数: ${stats.totalRequests}`);
  console.log(`   总token数: ${stats.totalTokens}`);
  console.log(`   总成本: $${stats.totalCost.toFixed(4)}`);
  console.log(`   成功率: ${(stats.successRate * 100).toFixed(1)}%`);
  console.log(`   平均延迟: ${stats.averageLatency.toFixed(0)}ms`);
  
  if (stats.modelUsage.size > 0) {
    console.log('   各模型用量:');
    stats.modelUsage.forEach((usage, modelName) => {
      console.log(`     ${modelName}: ${usage.requests} 请求, ${usage.tokens} tokens, $${usage.cost.toFixed(4)}`);
    });
  }
  console.log('');

  // 演示健康检查
  console.log('5. 健康检查演示');
  
  const health = router.healthCheck();
  console.log(`   系统状态: ${health.status}`);
  console.log(`   可用模型: ${health.metrics.availableModels}/${health.metrics.totalModels}`);
  console.log(`   平均延迟: ${health.metrics.averageLatency.toFixed(0)}ms`);
  console.log(`   错误率: ${(health.metrics.errorRate * 100).toFixed(1)}%`);
  console.log(`   配额使用率: ${(health.metrics.quotaUsage * 100).toFixed(1)}%`);
  
  if (health.issues.length > 0) {
    console.log('   发现的问题:');
    health.issues.forEach(issue => {
      console.log(`     [${issue.severity}] ${issue.type}: ${issue.description}`);
    });
  } else {
    console.log('   ✅ 系统运行正常');
  }
  console.log('');

  // 演示配置管理
  console.log('6. 配置管理演示');
  
  const config = router.getConfig();
  console.log(`   每日token限制: ${config.limits.dailyTokenLimit}`);
  console.log(`   每月成本限制: $${config.limits.monthlyCostLimit}`);
  console.log(`   每分钟请求限制: ${config.limits.maxRequestPerMinute}`);
  
  // 演示配置更新
  router.updateConfig({
    limits: {
      dailyTokenLimit: 50000,
      monthlyCostLimit: 50,
      maxRequestPerMinute: 30
    }
  });
  
  const updatedConfig = router.getConfig();
  console.log(`   更新后每日token限制: ${updatedConfig.limits.dailyTokenLimit}`);
  console.log(`   更新后每月成本限制: $${updatedConfig.limits.monthlyCostLimit}`);
  console.log('');

  // 演示路由规则管理
  console.log('7. 路由规则管理演示');
  
  // 添加自定义规则
  router.addRule({
    id: 'demo-custom-rule',
    name: '演示自定义规则',
    conditions: [
      { type: 'task_type', field: 'type', operator: 'equals', value: 'bug_fixing' }
    ],
    actions: [
      { type: 'select_model', target: 'model', value: 'qwen-coder:7b' }
    ],
    priority: 95,
    enabled: true
  });
  
  console.log(`   添加自定义规则: 演示自定义规则`);
  console.log(`   当前规则总数: ${router.getConfig().rules.length}`);
  
  // 测试自定义规则
  const bugFixingTask: Task = {
    id: 'demo-bug-fix',
    name: '修复登录验证Bug',
    description: '修复用户登录时的验证逻辑错误',
    type: 'bug_fixing',
    complexity: 'medium' as TaskComplexity,
    estimatedTokens: 600,
    priority: 'high',
    constraints: []
  };

  const bugFixResult = await router.route(bugFixingTask);
  console.log(`   Bug修复任务路由结果: ${bugFixResult.model.name}`);
  console.log(`   路由理由: ${bugFixResult.reasoning}`);
  
  // 删除自定义规则
  router.removeRule('demo-custom-rule');
  console.log(`   删除自定义规则后规则总数: ${router.getConfig().rules.length}`);
  console.log('');

  console.log('=== 演示完成 ===');
  console.log('');
  console.log('📊 系统总结:');
  console.log(`   • 支持 ${router.getAvailableModels().length} 个模型`);
  console.log(`   • 配置了 ${router.getConfig().rules.length} 个路由规则`);
  console.log(`   • 处理了 ${stats.totalRequests} 个请求`);
  console.log(`   • 总成本: $${stats.totalCost.toFixed(4)}`);
  console.log(`   • 系统状态: ${health.status}`);
}

/**
 * 运行演示
 */
async function runDemo() {
  try {
    await demonstrateModelRouter();
  } catch (error) {
    console.error('演示过程中发生错误:', error);
  }
}

// 如果直接运行此文件，则执行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo();
}

export { runDemo };