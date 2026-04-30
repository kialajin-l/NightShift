/**
 * 任务分解器演示脚本
 * 展示如何将自然语言 PRD 自动拆解为结构化任务列表
 */

import { TaskDecomposer } from '../src/scheduler/task-decomposer.js';
import { NaturalLanguageInput } from '../src/scheduler/types/task.js';

async function demonstrateTaskDecomposition() {
  console.log('🚀 NightShift 任务调度 Agent 演示\n');
  
  const decomposer = new TaskDecomposer();
  
  // 示例 1: 简单的登录页面需求
  console.log('📝 示例 1: 简单的登录页面需求');
  console.log('='.repeat(60));
  
  const simpleInput: NaturalLanguageInput = {
    text: '帮我做个登录页，要邮箱密码登录，记住我，还要有注册入口'
  };
  
  const simpleResult = await decomposer.decompose(simpleInput, 'demo-session-1');
  
  console.log('📊 分析结果:');
  console.log(`- 生成任务数量: ${simpleResult.tasks.length}`);
  console.log(`- 预估总时间: ${simpleResult.estimatedTotalTime} 分钟`);
  console.log(`- 依赖关系数量: ${simpleResult.dependencies.length}`);
  console.log(`- 关键路径长度: ${simpleResult.criticalPath.length}`);
  
  console.log('\n📋 生成的任务列表:');
  simpleResult.tasks.forEach((task, index) => {
    console.log(`${index + 1}. [${task.agent.toUpperCase()}] ${task.name}`);
    console.log(`   描述: ${task.description}`);
    console.log(`   预估时间: ${task.estimatedTime} 分钟`);
    console.log(`   优先级: ${task.priority}`);
    console.log(`   依赖: ${task.dependencies.length > 0 ? task.dependencies.join(', ') : '无'}`);
    console.log();
  });
  
  if (simpleResult.warnings.length > 0) {
    console.log('⚠️ 警告:');
    simpleResult.warnings.forEach(warning => console.log(`- ${warning}`));
    console.log();
  }
  
  if (simpleResult.suggestions.length > 0) {
    console.log('💡 建议:');
    simpleResult.suggestions.forEach(suggestion => console.log(`- ${suggestion}`));
    console.log();
  }
  
  // 示例 2: 复杂的需求（多轮对话）
  console.log('📝 示例 2: 复杂需求的多轮对话分解');
  console.log('='.repeat(60));
  
  const sessionId = 'demo-session-2';
  
  // 第一轮：初步需求
  const round1Input: NaturalLanguageInput = {
    text: '开发用户管理系统',
    context: {
      projectType: 'web应用',
      technologyStack: ['Vue', 'Node.js'],
      teamSize: 3,
      constraints: ['2周内完成']
    }
  };
  
  const round1Result = await decomposer.decompose(round1Input, sessionId);
  
  console.log('🔄 第一轮分解结果:');
  console.log(`- 任务数量: ${round1Result.tasks.length}`);
  console.log(`- 预估时间: ${round1Result.estimatedTotalTime} 分钟`);
  
  // 获取澄清问题
  const questions = await decomposer.getClarificationQuestions(sessionId);
  console.log('\n❓ 澄清问题:');
  questions.forEach((question, index) => {
    console.log(`${index + 1}. ${question}`);
  });
  
  // 第二轮：细化需求（模拟用户回答）
  console.log('\n🔄 第二轮：细化需求（基于用户回答）');
  
  const round2Input: NaturalLanguageInput = {
    text: '需要完整的 CRUD 功能，用户权限管理，还有数据统计面板。前端用 Vue 3，后端用 FastAPI',
    context: round1Input.context
  };
  
  const round2Result = await decomposer.decompose(round2Input, sessionId);
  
  console.log('📊 细化后的结果:');
  console.log(`- 总任务数量: ${round2Result.tasks.length}`);
  console.log(`- 新增任务: ${round2Result.tasks.length - round1Result.tasks.length}`);
  console.log(`- 最终预估时间: ${round2Result.estimatedTotalTime} 分钟`);
  
  // 按执行顺序显示任务
  console.log('\n⏱️ 任务执行顺序（拓扑排序）:');
  const dag = decomposer['dagGenerator'].generateDAG(round2Result.tasks, round2Result.dependencies);
  
  if (!dag.hasCycle && dag.topologicalOrder.length > 0) {
    dag.topologicalOrder.forEach((taskId, index) => {
      const task = round2Result.tasks.find(t => t.id === taskId);
      if (task) {
        const isCritical = dag.criticalPath.includes(taskId);
        const criticalMarker = isCritical ? '🔴' : '🔵';
        console.log(`${index + 1}. ${criticalMarker} [${task.agent.toUpperCase()}] ${task.name}`);
      }
    });
    
    console.log('\n🔴 标记为关键路径任务（不能延迟）');
  }
  
  // 示例 3: 技术栈推断
  console.log('\n📝 示例 3: 自动技术栈推断');
  console.log('='.repeat(60));
  
  const techInput: NaturalLanguageInput = {
    text: '用 React 和 Python 开发博客系统，要有文章管理、评论功能和搜索'
  };
  
  const techResult = await decomposer.decompose(techInput);
  
  // 分析技术栈分布
  const agentDistribution = techResult.tasks.reduce((acc, task) => {
    acc[task.agent] = (acc[task.agent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('👥 任务分布:');
  Object.entries(agentDistribution).forEach(([agent, count]) => {
    const percentage = ((count / techResult.tasks.length) * 100).toFixed(1);
    console.log(`- ${agent}: ${count} 个任务 (${percentage}%)`);
  });
  
  // 显示技术相关的任务
  console.log('\n💻 技术相关任务:');
  const techTasks = techResult.tasks.filter(task => 
    task.tags.some(tag => tag.includes('react') || tag.includes('python'))
  );
  
  techTasks.forEach(task => {
    const techTags = task.tags.filter(tag => 
      tag.includes('react') || tag.includes('python') || tag.includes('api')
    );
    console.log(`- ${task.name} [${techTags.join(', ')}]`);
  });
  
  // 示例 4: 错误处理和边界情况
  console.log('\n📝 示例 4: 错误处理和边界情况');
  console.log('='.repeat(60));
  
  const edgeCases = [
    { text: '', description: '空输入' },
    { text: '做一些东西', description: '模糊需求' },
    { text: '开发一个超级复杂的系统，包含人工智能、区块链、物联网、大数据分析、机器学习、深度学习、自然语言处理、计算机视觉、增强现实、虚拟现实、量子计算等所有最新技术', description: '过度复杂的需求' }
  ];
  
  for (const edgeCase of edgeCases) {
    console.log(`\n🔍 测试: ${edgeCase.description}`);
    console.log(`输入: "${edgeCase.text}"`);
    
    const result = await decomposer.decompose({ text: edgeCase.text });
    
    console.log(`结果: ${result.tasks.length} 个任务`);
    if (result.warnings.length > 0) {
      console.log(`警告: ${result.warnings[0]}`);
    }
  }
  
  console.log('\n🎉 演示完成！');
  console.log('\n💡 总结:');
  console.log('- 任务分解器能够将自然语言 PRD 自动拆解为结构化任务');
  console.log('- 支持多轮对话和需求细化');
  console.log('- 自动推断技术栈和依赖关系');
  console.log('- 生成可执行的 DAG 任务图');
  console.log('- 提供合理的警告和建议');
}

// 运行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateTaskDecomposition().catch(console.error);
}

export { demonstrateTaskDecomposition };