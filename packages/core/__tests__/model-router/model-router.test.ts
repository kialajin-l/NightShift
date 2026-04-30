/**
 * NightShift 模型路由系统单元测试
 */

import { SmartModelRouter } from '../../src/model-router/model-router.js';
import { Task, ModelConfig, RouterError, TaskComplexity } from '../../src/model-router/types/model-router.js';

describe('SmartModelRouter', () => {
  let router: SmartModelRouter;

  beforeEach(() => {
    router = new SmartModelRouter();
  });

  describe('初始化', () => {
    test('应该正确初始化默认模型', () => {
      const models = router.getAvailableModels();
      expect(models.length).toBeGreaterThan(0);
      
      // 检查默认模型类型
      const modelTypes = models.map(m => m.type);
      expect(modelTypes).toContain('program');
      expect(modelTypes).toContain('local_model');
      expect(modelTypes).toContain('cloud_model');
    });

    test('应该正确初始化默认路由规则', () => {
      const config = router.getConfig();
      expect(config.rules).toBeDefined();
      expect(config.rules.length).toBeGreaterThan(0);
    });

    test('应该正确初始化用量统计', () => {
      const stats = router.getUsageStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.totalTokens).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.modelUsage.size).toBe(0);
      expect(stats.timeSeries.length).toBe(0);
    });
  });

  describe('任务路由', () => {
    const simpleTask: Task = {
      id: 'test-simple',
      name: '文件重命名',
      description: '重命名文件',
      type: 'file_rename',
      complexity: 'simple' as TaskComplexity,
      estimatedTokens: 0,
      priority: 'normal',
      constraints: []
    };

    const mediumTask: Task = {
      id: 'test-medium',
      name: '组件生成',
      description: '生成Vue组件',
      type: 'component_generation',
      complexity: 'medium' as TaskComplexity,
      estimatedTokens: 500,
      priority: 'normal',
      constraints: [],
      technology: {
        frontend: { language: 'vue' }
      }
    };

    const complexTask: Task = {
      id: 'test-complex',
      name: '架构设计',
      description: '设计系统架构',
      type: 'architecture_design',
      complexity: 'complex' as TaskComplexity,
      estimatedTokens: 2000,
      priority: 'high',
      constraints: []
    };

    test('应该为简单任务路由到本地程序', async () => {
      const result = await router.route(simpleTask);
      expect(result.model.type).toBe('program');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasoning).toContain('文件重命名');
    });

    test('应该为中等任务路由到本地模型', async () => {
      const result = await router.route(mediumTask);
      expect(result.model.type).toBe('local_model');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    test('应该为复杂任务路由到云端模型', async () => {
      const result = await router.route(complexTask);
      expect(result.model.type).toBe('cloud_model');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasoning).toContain('任务复杂度');
    });

    test('应该拒绝无效任务', async () => {
      const invalidTask: Task = {
        id: '',
        name: '',
        description: '',
        type: 'file_rename',
        complexity: 'simple' as TaskComplexity,
        estimatedTokens: -1,
        priority: 'normal',
        constraints: []
      };

      await expect(router.route(invalidTask)).rejects.toThrow(RouterError);
    });

    test('应该应用路由规则', async () => {
      // 添加自定义规则
      router.addRule({
        id: 'test-rule',
        name: '测试规则',
        conditions: [
          { type: 'task_type', field: 'type', operator: 'equals', value: 'component_generation' }
        ],
        actions: [
          { type: 'select_model', target: 'model', value: 'qwen2.5:7b' }
        ],
        priority: 100,
        enabled: true
      });

      const result = await router.route(mediumTask);
      expect(result.model.name).toBe('qwen2.5:7b');
      expect(result.reasoning).toContain('匹配路由规则');
    });
  });

  describe('模型执行', () => {
    const testPrompt = '这是一个测试提示';

    test('应该成功执行本地程序', async () => {
      const model = router.getAvailableModels().find(m => m.type === 'program');
      expect(model).toBeDefined();

      if (model) {
        const result = await router.execute(testPrompt, model);
        expect(result.success).toBe(true);
        expect(result.output).toContain('本地程序执行结果');
        expect(result.tokensUsed).toBe(0);
        expect(result.cost).toBe(0);
      }
    });

    test('应该成功执行本地模型', async () => {
      const model = router.getAvailableModels().find(m => m.type === 'local_model');
      expect(model).toBeDefined();

      if (model) {
        const result = await router.execute(testPrompt, model);
        expect(result.success).toBe(true);
        expect(result.output).toContain('本地模型生成内容');
        expect(result.tokensUsed).toBeGreaterThan(0);
        expect(result.cost).toBeGreaterThanOrEqual(0);
      }
    });

    test('应该成功执行云端模型', async () => {
      const model = router.getAvailableModels().find(m => m.type === 'cloud_model');
      expect(model).toBeDefined();

      if (model) {
        const result = await router.execute(testPrompt, model);
        expect(result.success).toBe(true);
        expect(result.output).toContain('云端模型生成内容');
        expect(result.tokensUsed).toBeGreaterThan(0);
        expect(result.cost).toBeGreaterThanOrEqual(0);
      }
    });

    test('应该拒绝不可用模型', async () => {
      const invalidModel: ModelConfig = {
        name: 'invalid-model',
        provider: 'invalid',
        type: 'local_model',
        capabilities: ['code_generation'],
        costPerToken: 0.001,
        maxTokens: 1000,
        contextLength: 1000,
        supportedLanguages: ['*'],
        timeout: 5000
      };

      await expect(router.execute(testPrompt, invalidModel)).rejects.toThrow(RouterError);
    });
  });

  describe('用量统计', () => {
    test('应该正确记录用量', async () => {
      const model = router.getAvailableModels().find(m => m.type === 'local_model');
      expect(model).toBeDefined();

      if (model) {
        const initialStats = router.getUsageStats();
        expect(initialStats.totalRequests).toBe(0);

        await router.execute('测试提示', model);

        const updatedStats = router.getUsageStats();
        expect(updatedStats.totalRequests).toBe(1);
        expect(updatedStats.totalTokens).toBeGreaterThan(0);
        expect(updatedStats.modelUsage.has(model.name)).toBe(true);

        const modelUsage = updatedStats.modelUsage.get(model.name);
        expect(modelUsage?.requests).toBe(1);
        expect(modelUsage?.tokens).toBeGreaterThan(0);
      }
    });

    test('应该正确重置用量统计', () => {
      // 先记录一些用量
      const model = router.getAvailableModels().find(m => m.type === 'local_model');
      if (model) {
        router.trackUsage(model.name, 100);
      }

      router.resetUsageStats();

      const stats = router.getUsageStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.totalTokens).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.modelUsage.size).toBe(0);
    });

    test('应该正确计算成本', () => {
      const model = router.getAvailableModels().find(m => m.type === 'cloud_model');
      expect(model).toBeDefined();

      if (model) {
        const tokens = 1000;
        router.trackUsage(model.name, tokens);

        const stats = router.getUsageStats();
        const expectedCost = model.costPerToken * tokens;
        expect(stats.totalCost).toBeCloseTo(expectedCost, 4);
      }
    });
  });

  describe('健康检查', () => {
    test('应该返回健康状态', () => {
      const health = router.healthCheck();
      expect(health.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(health.metrics).toBeDefined();
      expect(Array.isArray(health.issues)).toBe(true);
    });

    test('应该检测模型可用性问题', () => {
      // 注销所有模型来模拟不可用状态
      const models = router.getAvailableModels();
      models.forEach(model => {
        router.unregisterModel(model.name);
      });

      const health = router.healthCheck();
      expect(health.status).toBe('unhealthy');
      expect(health.issues.length).toBeGreaterThan(0);
      expect(health.issues[0].type).toBe('model_unavailable');
    });
  });

  describe('配置管理', () => {
    test('应该支持配置更新', () => {
      const newConfig = {
        limits: {
          dailyTokenLimit: 50000,
          monthlyCostLimit: 50,
          maxRequestPerMinute: 30
        }
      };

      router.updateConfig(newConfig);

      const updatedConfig = router.getConfig();
      expect(updatedConfig.limits.dailyTokenLimit).toBe(50000);
      expect(updatedConfig.limits.monthlyCostLimit).toBe(50);
      expect(updatedConfig.limits.maxRequestPerMinute).toBe(30);
    });

    test('应该支持模型注册和注销', () => {
      const initialCount = router.getAvailableModels().length;

      const newModel: ModelConfig = {
        name: 'test-model',
        provider: 'test',
        type: 'local_model',
        capabilities: ['code_generation'],
        costPerToken: 0.0001,
        maxTokens: 2048,
        contextLength: 2048,
        supportedLanguages: ['javascript', 'typescript'],
        timeout: 10000
      };

      router.registerModel(newModel);
      expect(router.getAvailableModels().length).toBe(initialCount + 1);

      router.unregisterModel('test-model');
      expect(router.getAvailableModels().length).toBe(initialCount);
    });

    test('应该支持路由规则管理', () => {
      const rule = {
        id: 'test-rule-2',
        name: '测试规则2',
        conditions: [
          { type: 'task_type', field: 'type', operator: 'equals', value: 'bug_fixing' }
        ],
        actions: [
          { type: 'select_model', target: 'model', value: 'qwen-coder:7b' }
        ],
        priority: 95,
        enabled: true
      };

      router.addRule(rule);
      router.updateRule('test-rule-2', { enabled: false });
      router.removeRule('test-rule-2');

      // 验证规则已删除
      const config = router.getConfig();
      const ruleExists = config.rules.some(r => r.id === 'test-rule-2');
      expect(ruleExists).toBe(false);
    });
  });

  describe('错误处理', () => {
    test('应该正确处理路由错误', async () => {
      const invalidTask: Task = {
        id: 'invalid',
        name: '无效任务',
        description: '',
        type: 'invalid_type' as any,
        complexity: 'simple' as TaskComplexity,
        estimatedTokens: 0,
        priority: 'normal',
        constraints: []
      };

      await expect(router.route(invalidTask)).rejects.toThrow(RouterError);
    });

    test('应该处理模型执行失败', async () => {
      // 创建一个不可用的模型配置
      const unavailableModel: ModelConfig = {
        name: 'unavailable',
        provider: 'none',
        type: 'local_model',
        capabilities: ['code_generation'],
        costPerToken: 0.001,
        maxTokens: 1000,
        contextLength: 1000,
        supportedLanguages: ['*'],
        timeout: 5000
      };

      await expect(router.execute('test', unavailableModel)).rejects.toThrow(RouterError);
    });

    test('应该处理超出配额限制', async () => {
      // 设置极低的配额限制
      router.updateConfig({
        limits: {
          dailyTokenLimit: 1,
          monthlyCostLimit: 0.001,
          maxRequestPerMinute: 1
        }
      });

      const model = router.getAvailableModels().find(m => m.type === 'local_model');
      if (model) {
        // 第一次执行应该成功
        await router.execute('test', model);
        
        // 第二次执行应该失败（超出配额）
        await expect(router.execute('test', model)).rejects.toThrow(RouterError);
      }
    });
  });

  describe('性能监控', () => {
    test('应该记录性能指标', async () => {
      const model = router.getAvailableModels().find(m => m.type === 'local_model');
      expect(model).toBeDefined();

      if (model) {
        await router.execute('测试性能监控', model);
        
        // 检查健康状态中的性能指标
        const health = router.healthCheck();
        expect(health.metrics.averageLatency).toBeGreaterThan(0);
        expect(health.metrics.errorRate).toBeLessThanOrEqual(1);
        expect(health.metrics.availableModels).toBeGreaterThan(0);
      }
    });

    test('应该计算成功率', async () => {
      const model = router.getAvailableModels().find(m => m.type === 'local_model');
      if (model) {
        // 执行多次来测试成功率计算
        for (let i = 0; i < 3; i++) {
          await router.execute(`测试${i}`, model);
        }

        const health = router.healthCheck();
        expect(health.metrics.errorRate).toBe(0); // 所有执行都应该成功
      }
    });
  });
});