/**
 * 任务分解器单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskDecomposer } from '../../src/scheduler/task-decomposer.js';
import { NaturalLanguageInput } from '../../src/scheduler/types/task.js';

describe('TaskDecomposer', () => {
  let decomposer: TaskDecomposer;

  beforeEach(() => {
    decomposer = new TaskDecomposer();
  });

  describe('关键词分析', () => {
    it('应该正确识别登录相关关键词', () => {
      const input: NaturalLanguageInput = {
        text: '帮我做个登录页，要邮箱密码登录，记住我，还要有注册入口'
      };

      const result = decomposer['keywordAnalyzer'].analyze(input);

      expect(result.keywords).toContain('登录');
      expect(result.keywords).toContain('邮箱');
      expect(result.keywords).toContain('密码');
      expect(result.keywords).toContain('记住我');
      expect(result.keywords).toContain('注册');
      
      expect(result.categories).toContain('authentication');
      expect(result.complexity).toBe('medium');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('应该识别技术栈关键词', () => {
      const input: NaturalLanguageInput = {
        text: '用 Vue 和 Node.js 开发用户管理系统'
      };

      const result = decomposer['keywordAnalyzer'].analyze(input);

      expect(result.technologyStack).toContain('frontend');
      expect(result.technologyStack).toContain('backend');
      expect(result.keywords).toContain('vue');
      expect(result.keywords).toContain('node');
    });

    it('应该评估复杂度', () => {
      const simpleInput: NaturalLanguageInput = { text: '做个登录页' };
      const complexInput: NaturalLanguageInput = { 
        text: '开发完整的用户认证系统，包含登录注册、密码重置、邮箱验证、权限管理、第三方登录集成等功能'
      };

      const simpleResult = decomposer['keywordAnalyzer'].analyze(simpleInput);
      const complexResult = decomposer['keywordAnalyzer'].analyze(complexInput);

      expect(simpleResult.complexity).toBe('simple');
      expect(complexResult.complexity).toBe('complex');
    });
  });

  describe('任务生成', () => {
    it('应该从 PRD 生成正确的任务列表', async () => {
      const input: NaturalLanguageInput = {
        text: '帮我做个登录页，要邮箱密码登录，记住我，还要有注册入口'
      };

      const result = await decomposer.decompose(input);

      expect(result.tasks.length).toBeGreaterThan(0);
      
      // 验证任务结构
      const loginPageTask = result.tasks.find(t => t.name.includes('登录页面'));
      expect(loginPageTask).toBeDefined();
      expect(loginPageTask?.agent).toBe('frontend');
      expect(loginPageTask?.priority).toBe('high');

      const loginApiTask = result.tasks.find(t => t.name.includes('登录 API'));
      expect(loginApiTask).toBeDefined();
      expect(loginApiTask?.agent).toBe('backend');

      const registerPageTask = result.tasks.find(t => t.name.includes('注册页面'));
      expect(registerPageTask).toBeDefined();
    });

    it('应该为每个任务生成唯一 ID', async () => {
      const input: NaturalLanguageInput = {
        text: '开发登录功能'
      };

      const result = await decomposer.decompose(input);
      
      const taskIds = result.tasks.map(t => t.id);
      const uniqueIds = new Set(taskIds);
      
      expect(taskIds.length).toBe(uniqueIds.size);
      
      // 验证 ID 格式
      result.tasks.forEach(task => {
        expect(task.id).toMatch(/^[a-z-]+-[a-z0-9]+-[a-z0-9]+$/);
      });
    });
  });

  describe('依赖推断', () => {
    it('应该正确推断前端任务对后端 API 的依赖', async () => {
      const input: NaturalLanguageInput = {
        text: '开发登录页面和对应的 API'
      };

      const result = await decomposer.decompose(input);
      
      const frontendTasks = result.tasks.filter(t => t.agent === 'frontend');
      const backendTasks = result.tasks.filter(t => t.agent === 'backend');
      
      expect(frontendTasks.length).toBeGreaterThan(0);
      expect(backendTasks.length).toBeGreaterThan(0);
      
      // 验证依赖关系
      const hasFrontendToBackendDependency = result.dependencies.some(dep => {
        const fromTask = result.tasks.find(t => t.id === dep.from);
        const toTask = result.tasks.find(t => t.id === dep.to);
        return fromTask?.agent === 'frontend' && toTask?.agent === 'backend';
      });
      
      expect(hasFrontendToBackendDependency).toBe(true);
    });

    it('应该检测循环依赖', async () => {
      // 创建有循环依赖的任务
      const tasks = [
        {
          id: 'task-1',
          name: '任务1',
          description: '测试任务1',
          agent: 'frontend' as const,
          dependencies: ['task-2'],
          priority: 'medium' as const,
          status: 'pending' as const,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'task-2',
          name: '任务2',
          description: '测试任务2',
          agent: 'backend' as const,
          dependencies: ['task-1'],
          priority: 'medium' as const,
          status: 'pending' as const,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const dependencies = [
        { from: 'task-1', to: 'task-2', type: 'hard' as const },
        { from: 'task-2', to: 'task-1', type: 'hard' as const }
      ];

      const cycles = decomposer['dependencyResolver'].detectCycles(dependencies, tasks);
      
      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0]).toContain('task-1');
      expect(cycles[0]).toContain('task-2');
    });
  });

  describe('DAG 生成', () => {
    it('应该生成有效的 DAG', async () => {
      const input: NaturalLanguageInput = {
        text: '开发登录注册功能'
      };

      const result = await decomposer.decompose(input);
      const dag = decomposer['dagGenerator'].generateDAG(result.tasks, result.dependencies);

      expect(dag.nodes.size).toBe(result.tasks.length);
      expect(dag.edges.length).toBe(result.dependencies.length);
      
      // 验证拓扑排序
      if (!dag.hasCycle) {
        expect(dag.topologicalOrder.length).toBe(result.tasks.length);
        
        // 验证排序的正确性
        const orderIndex = new Map(dag.topologicalOrder.map((id, index) => [id, index]));
        
        for (const dep of result.dependencies) {
          const fromIndex = orderIndex.get(dep.from);
          const toIndex = orderIndex.get(dep.to);
          
          if (fromIndex !== undefined && toIndex !== undefined) {
            expect(fromIndex).toBeLessThan(toIndex);
          }
        }
      }
    });

    it('应该识别关键路径', async () => {
      const input: NaturalLanguageInput = {
        text: '开发完整的认证系统'
      };

      const result = await decomposer.decompose(input);
      const dag = decomposer['dagGenerator'].generateDAG(result.tasks, result.dependencies);

      if (!dag.hasCycle && dag.criticalPath.length > 0) {
        // 关键路径应该包含高优先级任务
        const criticalTasks = dag.criticalPath.map(id => 
          result.tasks.find(t => t.id === id)
        ).filter(Boolean);
        
        expect(criticalTasks.length).toBeGreaterThan(0);
        
        // 关键路径上的任务应该有较高的优先级
        const highPriorityTasks = criticalTasks.filter(t => 
          t.priority === 'high' || t.priority === 'critical'
        );
        
        expect(highPriorityTasks.length).toBeGreaterThan(0);
      }
    });
  });

  describe('RuleForge 集成', () => {
    it('应该正确匹配任务模板', async () => {
      const input: NaturalLanguageInput = {
        text: '需要登录页面和注册功能'
      };

      const templates = await decomposer['ruleForgeIntegrator'].matchPatterns(input);
      
      expect(templates.length).toBeGreaterThan(0);
      
      const loginTemplate = templates.find(t => t.id === 'auth-login-page');
      const registerTemplate = templates.find(t => t.id === 'auth-register-page');
      
      expect(loginTemplate).toBeDefined();
      expect(registerTemplate).toBeDefined();
    });

    it('应该验证任务依赖的合理性', async () => {
      // 创建不合理的任务列表（前端任务没有对应的后端支持）
      const tasks = [
        {
          id: 'frontend-only',
          name: '前端页面',
          description: '只有前端没有后端',
          agent: 'frontend' as const,
          dependencies: [],
          estimatedTime: 120,
          priority: 'medium' as const,
          status: 'pending' as const,
          tags: ['ui_component'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const validation = await decomposer['ruleForgeIntegrator'].validateTaskDependencies(tasks);
      
      expect(validation.isValid).toBe(true); // 技术上有效，但会有警告
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('缺少对应的后端 API 支持');
    });
  });

  describe('对话管理', () => {
    it('应该管理多轮对话状态', async () => {
      const sessionId = 'test-session-123';
      const input: NaturalLanguageInput = {
        text: '开发登录功能'
      };

      // 第一轮对话
      await decomposer.decompose(input, sessionId);
      const state1 = decomposer.getConversationState(sessionId);
      
      expect(state1).toBeDefined();
      expect(state1?.sessionId).toBe(sessionId);
      expect(state1?.currentInput.text).toBe(input.text);
      expect(state1?.previousTasks.length).toBeGreaterThan(0);

      // 第二轮对话（需求细化）
      const refinedInput: NaturalLanguageInput = {
        text: '需要记住我功能和邮箱验证'
      };

      await decomposer.decompose(refinedInput, sessionId);
      const state2 = decomposer.getConversationState(sessionId);
      
      expect(state2?.previousTasks.length).toBeGreaterThan(state1?.previousTasks.length || 0);
    });

    it('应该生成合理的澄清问题', async () => {
      const input: NaturalLanguageInput = {
        text: '开发用户界面'
      };

      await decomposer.decompose(input, 'test-session');
      const questions = await decomposer.getClarificationQuestions('test-session');
      
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(3);
      
      // 问题应该与技术栈或功能细节相关
      questions.forEach(question => {
        expect(question).toMatch(/[？?]$/); // 以问号结尾
        expect(question.length).toBeLessThan(100); // 问题长度合理
      });
    });
  });

  describe('错误处理', () => {
    it('应该处理空输入', async () => {
      const input: NaturalLanguageInput = { text: '' };
      
      const result = await decomposer.decompose(input);
      
      expect(result.tasks.length).toBe(0);
      expect(result.estimatedTotalTime).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('应该处理无法识别的需求', async () => {
      const input: NaturalLanguageInput = {
        text: '开发一些不知道是什么的功能'
      };
      
      const result = await decomposer.decompose(input);
      
      // 即使无法识别具体功能，也应该返回合理的结果
      expect(result.tasks.length).toBeGreaterThanOrEqual(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内处理复杂需求', async () => {
      const complexInput: NaturalLanguageInput = {
        text: `开发完整的电商系统，包含：
        1. 用户认证（登录、注册、第三方登录）
        2. 商品管理（CRUD、分类、搜索）
        3. 购物车和订单系统
        4. 支付集成（支付宝、微信）
        5. 后台管理系统
        6. 移动端适配
        7. 性能优化和 SEO`
      };

      const startTime = Date.now();
      const result = await decomposer.decompose(complexInput);
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(5000); // 5秒内完成
      expect(result.tasks.length).toBeGreaterThan(5); // 生成多个任务
      expect(result.estimatedTotalTime).toBeGreaterThan(0);
      
      console.log(`复杂需求处理时间: ${processingTime}ms`);
      console.log(`生成任务数量: ${result.tasks.length}`);
      console.log(`预估总时间: ${result.estimatedTotalTime}分钟`);
    });
  });
});