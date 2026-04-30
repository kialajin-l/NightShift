// NightShift 记忆体系统集成测试

import { ConversationLogger } from './conversation-logger';
import { HabitLearner } from './habit-learner';
import { KnowledgeTransfer } from './knowledge-transfer';
import { MemoryStore } from './memory-store';
import { Message, LogEntry, TaskContext } from './memory-types';

/**
 * 记忆体系统集成测试
 */
class MemorySystemIntegrationTest {
  private logger: ConversationLogger;
  private learner: HabitLearner;
  private transfer: KnowledgeTransfer;
  private store: MemoryStore;
  
  constructor() {
    // 初始化所有组件
    this.logger = new ConversationLogger({
      maxLogEntries: 100,
      retentionDays: 7,
      logLevel: 'info'
    });
    
    this.learner = new HabitLearner({
      minConfidence: 0.6,
      minFrequency: 2,
      logLevel: 'info'
    });
    
    this.transfer = new KnowledgeTransfer({
      maxRelevantKnowledge: 3,
      minRelevance: 0.3,
      logLevel: 'info'
    });
    
    this.store = new MemoryStore({
      maxShortTermMemory: 50,
      shortTermRetentionHours: 1,
      logLevel: 'info'
    });
  }

  /**
   * 运行完整集成测试
   */
  async runIntegrationTest(): Promise<boolean> {
    try {
      console.log('=== 开始记忆体系统集成测试 ===');
      
      // 1. 测试对话记录
      const logTestPassed = await this.testConversationLogging();
      if (!logTestPassed) {
        console.error('❌ 对话记录测试失败');
        return false;
      }
      
      // 2. 测试习惯学习
      const habitTestPassed = await this.testHabitLearning();
      if (!habitTestPassed) {
        console.error('❌ 习惯学习测试失败');
        return false;
      }
      
      // 3. 测试知识传递
      const knowledgeTestPassed = await this.testKnowledgeTransfer();
      if (!knowledgeTestPassed) {
        console.error('❌ 知识传递测试失败');
        return false;
      }
      
      // 4. 测试记忆存储
      const memoryTestPassed = await this.testMemoryStorage();
      if (!memoryTestPassed) {
        console.error('❌ 记忆存储测试失败');
        return false;
      }
      
      // 5. 测试端到端流程
      const e2eTestPassed = await this.testEndToEndWorkflow();
      if (!e2eTestPassed) {
        console.error('❌ 端到端流程测试失败');
        return false;
      }
      
      console.log('✅ 所有集成测试通过！');
      return true;
      
    } catch (error) {
      console.error('❌ 集成测试异常:', error);
      return false;
    }
  }

  /**
   * 测试对话记录功能
   */
  private async testConversationLogging(): Promise<boolean> {
    try {
      console.log('\n--- 测试对话记录功能 ---');
      
      // 创建测试消息
      const testMessage: Message = {
        id: 'test-message-1',
        role: 'user',
        content: '请帮我创建一个React组件',
        timestamp: new Date(),
        metadata: {
          codeBlocks: [{
            language: 'typescript',
            code: 'function MyComponent() { return <div>Hello</div>; }',
            metadata: { quality: 0.8 }
          }],
          sentiment: 'positive',
          complexity: 'medium'
        }
      };
      
      // 记录消息
      await this.logger.logMessage(testMessage);
      console.log('✅ 消息记录成功');
      
      // 获取对话历史
      const history = await this.logger.getConversationHistory({
        sessionId: 'test-session',
        limit: 5
      });
      
      if (history.length === 0) {
        console.error('❌ 获取对话历史失败');
        return false;
      }
      
      console.log(`✅ 获取到 ${history.length} 条对话历史`);
      
      // 测试统计信息
      const stats = await this.logger.getStats();
      console.log(`✅ 日志统计: 总条目 ${stats.total}, 错误 ${stats.failed}`);
      
      return true;
      
    } catch (error) {
      console.error('对话记录测试失败:', error);
      return false;
    }
  }

  /**
   * 测试习惯学习功能
   */
  private async testHabitLearning(): Promise<boolean> {
    try {
      console.log('\n--- 测试习惯学习功能 ---');
      
      // 创建测试日志
      const testLogs: LogEntry[] = [
        {
          id: 'test-log-1',
          type: 'message',
          timestamp: new Date(),
          data: {
            id: 'msg-1',
            role: 'user',
            content: '我喜欢使用React hooks',
            timestamp: new Date()
          },
          sessionId: 'test-session',
          userId: 'test-user',
          projectId: 'test-project',
          tags: ['react', 'hooks']
        },
        {
          id: 'test-log-2',
          type: 'message',
          timestamp: new Date(),
          data: {
            id: 'msg-2',
            role: 'assistant',
            content: '好的，我来帮你创建一个使用hooks的组件',
            timestamp: new Date(),
            metadata: {
              codeBlocks: [{
                language: 'typescript',
                code: 'const MyComponent = () => { const [state, setState] = useState(0); return <div>{state}</div>; }',
                metadata: { quality: 0.9 }
              }]
            }
          },
          sessionId: 'test-session',
          userId: 'test-user',
          projectId: 'test-project',
          tags: ['react', 'hooks', 'component']
        }
      ];
      
      // 分析习惯
      const habits = await this.learner.analyzeHabits(testLogs);
      console.log(`✅ 分析出 ${habits.length} 个习惯`);
      
      // 预测偏好
      const taskContext: TaskContext = {
        taskId: 'test-task-1',
        taskType: 'frontend',
        technologyStack: ['react', 'typescript'],
        complexity: 'medium',
        requirements: ['创建组件', '使用hooks'],
        constraints: []
      };
      
      const predictions = await this.learner.predictPreferences(taskContext);
      console.log(`✅ 生成 ${predictions.length} 个偏好预测`);
      
      // 获取习惯配置
      const profile = await this.learner.getHabitProfile();
      console.log(`✅ 获取习惯配置: ${profile.habits.length} 个习惯`);
      
      return true;
      
    } catch (error) {
      console.error('习惯学习测试失败:', error);
      return false;
    }
  }

  /**
   * 测试知识传递功能
   */
  private async testKnowledgeTransfer(): Promise<boolean> {
    try {
      console.log('\n--- 测试知识传递功能 ---');
      
      // 创建测试日志
      const testLogs: LogEntry[] = [
        {
          id: 'test-log-3',
          type: 'message',
          timestamp: new Date(),
          data: {
            id: 'msg-3',
            role: 'user',
            content: '我遇到了TypeError错误',
            timestamp: new Date(),
            metadata: {
              errors: [{
                name: 'TypeError',
                message: 'Cannot read property of undefined'
              }]
            }
          },
          sessionId: 'test-session',
          userId: 'test-user',
          projectId: 'test-project',
          tags: ['error', 'typescript']
        }
      ];
      
      // 提取知识
      const knowledge = await this.transfer.extractKnowledge(testLogs);
      console.log(`✅ 提取到 ${knowledge.length} 条知识`);
      
      // 更新知识库
      await this.transfer.updateKnowledgeBase(knowledge);
      console.log('✅ 知识库更新成功');
      
      // 测试知识传递
      const taskContext: TaskContext = {
        taskId: 'test-task-2',
        taskType: 'frontend',
        technologyStack: ['typescript'],
        complexity: 'medium',
        requirements: ['处理TypeError错误'],
        constraints: []
      };
      
      const knowledgeContext = await this.transfer.transferKnowledge(taskContext, {});
      console.log(`✅ 传递 ${knowledgeContext.relevantKnowledge.length} 条相关知识`);
      
      // 获取知识库统计
      const stats = await this.transfer.getKnowledgeBaseStats();
      console.log(`✅ 知识库统计: 总知识 ${stats.totalKnowledge}`);
      
      return true;
      
    } catch (error) {
      console.error('知识传递测试失败:', error);
      return false;
    }
  }

  /**
   * 测试记忆存储功能
   */
  private async testMemoryStorage(): Promise<boolean> {
    try {
      console.log('\n--- 测试记忆存储功能 ---');
      
      // 存储短期记忆
      const shortTermId = await this.store.storeShortTermMemory({
        sessionId: 'test-session',
        content: { message: '当前对话上下文' },
        timestamp: new Date(),
        importance: 'high'
      });
      console.log(`✅ 短期记忆存储成功: ${shortTermId}`);
      
      // 存储长期记忆
      const longTermId = await this.store.storeLongTermMemory({
        userId: 'test-user',
        type: 'knowledge',
        content: { pattern: '错误处理模式' },
        timestamp: new Date(),
        importance: 'medium'
      });
      console.log(`✅ 长期记忆存储成功: ${longTermId}`);
      
      // 存储工作记忆
      const workingId = await this.store.storeWorkingMemory({
        sessionId: 'test-session',
        currentTask: '测试任务',
        context: { step: 'integration-test' },
        activeKnowledge: [],
        recentActions: ['存储记忆'],
        timestamp: new Date()
      });
      console.log(`✅ 工作记忆存储成功: ${workingId}`);
      
      // 查询记忆
      const queryResult = await this.store.queryMemory({
        sessionId: 'test-session',
        includeShortTerm: true,
        includeLongTerm: true,
        includeWorking: true,
        limit: 5
      });
      
      console.log(`✅ 记忆查询成功: 短期 ${queryResult.shortTerm.length}, 长期 ${queryResult.longTerm.length}, 工作 ${queryResult.working.length}`);
      
      // 获取统计信息
      const stats = await this.store.getMemoryStats();
      console.log(`✅ 记忆统计: 短期 ${stats.totalShortTerm}, 长期 ${stats.totalLongTerm}, 工作 ${stats.totalWorking}`);
      
      return true;
      
    } catch (error) {
      console.error('记忆存储测试失败:', error);
      return false;
    }
  }

  /**
   * 测试端到端流程
   */
  private async testEndToEndWorkflow(): Promise<boolean> {
    try {
      console.log('\n--- 测试端到端流程 ---');
      
      // 模拟完整的开发对话流程
      const conversationMessages: Message[] = [
        {
          id: 'e2e-msg-1',
          role: 'user',
          content: '我需要创建一个用户登录组件',
          timestamp: new Date(),
          metadata: {
            sentiment: 'positive',
            complexity: 'medium'
          }
        },
        {
          id: 'e2e-msg-2',
          role: 'assistant',
          content: '好的，我来帮你创建一个React登录组件',
          timestamp: new Date(),
          metadata: {
            codeBlocks: [{
              language: 'typescript',
              code: `const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 登录逻辑
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">登录</button>
    </form>
  );
};`,
              metadata: { quality: 0.85, complexity: 0.7 }
            }]
          }
        },
        {
          id: 'e2e-msg-3',
          role: 'user',
          content: '这个组件需要验证输入',
          timestamp: new Date(),
          metadata: {
            sentiment: 'neutral',
            complexity: 'medium'
          }
        },
        {
          id: 'e2e-msg-4',
          role: 'assistant',
          content: '好的，我来添加输入验证',
          timestamp: new Date(),
          metadata: {
            codeBlocks: [{
              language: 'typescript',
              code: `const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string) => {
  return password.length >= 8;
};`,
              metadata: { quality: 0.9, complexity: 0.6 }
            }]
          }
        }
      ];
      
      // 记录所有消息
      for (const message of conversationMessages) {
        await this.logger.logMessage(message);
      }
      console.log('✅ 对话记录完成');
      
      // 分析习惯
      const logs = await this.logger.getConversationHistory({ limit: 10 });
      const habits = await this.learner.analyzeHabits(logs);
      console.log(`✅ 习惯分析完成: ${habits.length} 个习惯`);
      
      // 提取知识
      const knowledge = await this.transfer.extractKnowledge(logs);
      await this.transfer.updateKnowledgeBase(knowledge);
      console.log(`✅ 知识提取完成: ${knowledge.length} 条知识`);
      
      // 模拟新任务的知识传递
      const newTask: TaskContext = {
        taskId: 'e2e-task-1',
        taskType: 'frontend',
        technologyStack: ['react', 'typescript'],
        complexity: 'medium',
        requirements: ['创建表单组件', '输入验证'],
        constraints: []
      };
      
      const knowledgeContext = await this.transfer.transferKnowledge(newTask, {});
      console.log(`✅ 知识传递完成: ${knowledgeContext.relevantKnowledge.length} 条相关知识`);
      
      // 存储记忆
      await this.store.storeShortTermMemory({
        sessionId: 'e2e-session',
        content: { task: newTask, knowledge: knowledgeContext },
        timestamp: new Date(),
        importance: 'high'
      });
      console.log('✅ 记忆存储完成');
      
      console.log('✅ 端到端流程测试完成');
      return true;
      
    } catch (error) {
      console.error('端到端流程测试失败:', error);
      return false;
    }
  }

  /**
   * 清理测试数据
   */
  async cleanup(): Promise<void> {
    try {
      // 重置所有组件
      this.logger.reset();
      this.learner.reset();
      this.transfer.reset();
      this.store.reset();
      
      console.log('✅ 测试数据清理完成');
    } catch (error) {
      console.error('清理测试数据失败:', error);
    }
  }
}

// 运行测试
async function runTests() {
  const test = new MemorySystemIntegrationTest();
  
  try {
    const success = await test.runIntegrationTest();
    
    if (success) {
      console.log('\n🎉 记忆体系统集成测试通过！');
    } else {
      console.log('\n❌ 记忆体系统集成测试失败！');
    }
    
    // 清理测试数据
    await test.cleanup();
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('测试运行异常:', error);
    await test.cleanup();
    process.exit(1);
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runTests();
}

export { MemorySystemIntegrationTest };