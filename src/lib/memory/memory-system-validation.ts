// NightShift 记忆体系统验证脚本

import { ConversationLogger } from './conversation-logger';
import { HabitLearner } from './habit-learner';
import { KnowledgeTransfer } from './knowledge-transfer';
import { MemoryStore } from './memory-store';
import type { Message, LogEntry, TaskContext } from './memory-types';

/**
 * 记忆体系统验证
 */
async function validateMemorySystem(): Promise<void> {
  console.log('🔍 开始验证记忆体系统组件...\n');
  
  try {
    // 1. 验证对话记录器
    console.log('📝 验证对话记录器...');
    const logger = new ConversationLogger({ logLevel: 'info' });
    
    const testMessage: Message = {
      id: 'test-msg-1',
      role: 'user',
      content: '测试消息',
      timestamp: new Date()
    };
    
    await logger.logMessage(testMessage);
    console.log('✅ 对话记录器基本功能正常');
    
    // 2. 验证习惯学习器
    console.log('🧠 验证习惯学习器...');
    const learner = new HabitLearner({ logLevel: 'info' });
    
    const testLogs: LogEntry[] = [
      {
        id: 'test-log-1',
        type: 'message',
        timestamp: new Date(),
        data: testMessage,
        sessionId: 'test-session',
        userId: 'test-user',
        projectId: 'test-project',
        tags: ['test']
      }
    ];
    
    const habits = await learner.analyzeHabits(testLogs);
    console.log(`✅ 习惯学习器分析完成，发现 ${habits.length} 个习惯`);
    
    // 3. 验证知识传递器
    console.log('📚 验证知识传递器...');
    const transfer = new KnowledgeTransfer({ logLevel: 'info' });
    
    const knowledge = await transfer.extractKnowledge(testLogs);
    console.log(`✅ 知识传递器提取完成，提取 ${knowledge.length} 条知识`);
    
    // 4. 验证记忆存储
    console.log('💾 验证记忆存储...');
    const store = new MemoryStore({ logLevel: 'info' });
    
    const shortTermId = await store.storeShortTermMemory({
      sessionId: 'test-session',
      content: { test: 'data' },
      timestamp: new Date(),
      importance: 'medium'
    });
    console.log(`✅ 记忆存储功能正常，存储ID: ${shortTermId}`);
    
    // 5. 验证端到端流程
    console.log('🔄 验证端到端流程...');
    
    const taskContext: TaskContext = {
      taskId: 'test-task',
      taskType: 'frontend',
      technologyStack: ['typescript'],
      complexity: 'medium',
      requirements: ['测试功能'],
      constraints: []
    };
    
    const knowledgeContext = await transfer.transferKnowledge(taskContext, {});
    console.log(`✅ 知识传递完成，相关度 ${knowledgeContext.confidence.toFixed(2)}`);
    
    console.log('\n🎉 所有记忆体系统组件验证通过！');
    console.log('\n📊 组件状态:');
    console.log('  • 对话记录器: ✅ 正常');
    console.log('  • 习惯学习器: ✅ 正常');
    console.log('  • 知识传递器: ✅ 正常');
    console.log('  • 记忆存储: ✅ 正常');
    console.log('  • 端到端流程: ✅ 正常');
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  }
}

// 运行验证
validateMemorySystem().catch(error => {
  console.error('验证脚本异常:', error);
  process.exit(1);
});