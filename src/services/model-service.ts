// 多服务商模型服务

import { ModelProvider, UsageStats } from '@/types';
import { storage, NightShiftError } from '@/utils';

/**
 * 模型服务类
 */
export class ModelService {
  private providers: Map<string, ModelProvider> = new Map();
  private usageStats: UsageStats = this.initializeUsageStats();

  constructor() {
    this.loadProviders();
    this.loadUsageStats();
  }

  /**
   * 初始化用量统计
   */
  private initializeUsageStats(): UsageStats {
    return {
      totalTokens: 0,
      totalCost: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      byProvider: {},
      byModel: {},
      byDate: {}
    };
  }

  /**
   * 加载提供商配置
   */
  private loadProviders(): void {
    try {
      const savedProviders = storage.get<ModelProvider[]>('nightshift-providers') || [];
      
      // 默认提供商配置
      const defaultProviders: ModelProvider[] = [
        {
          id: 'ollama-local',
          name: 'Ollama (本地)',
          type: 'ollama',
          baseUrl: 'http://localhost:11434',
          models: ['qwen-coder:7b', 'codellama:7b', 'deepseek-coder:6.7b'],
          isEnabled: true
        },
        {
          id: 'openrouter',
          name: 'OpenRouter',
          type: 'custom',
          baseUrl: 'https://openrouter.ai/api/v1',
          models: ['deepseek/deepseek-coder', 'anthropic/claude-3-sonnet'],
          isEnabled: false
        },
        {
          id: 'openai',
          name: 'OpenAI',
          type: 'openai',
          models: ['gpt-4', 'gpt-3.5-turbo'],
          isEnabled: false
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          type: 'anthropic',
          models: ['claude-3-sonnet', 'claude-3-haiku'],
          isEnabled: false
        }
      ];

      // 合并配置
      const allProviders = [...defaultProviders, ...savedProviders];
      
      this.providers.clear();
      allProviders.forEach(provider => {
        this.providers.set(provider.id, provider);
      });

    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  }

  /**
   * 加载用量统计
   */
  private loadUsageStats(): void {
    try {
      const savedStats = storage.get<UsageStats>('nightshift-usage-stats');
      if (savedStats) {
        this.usageStats = { ...this.initializeUsageStats(), ...savedStats };
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  }

  /**
   * 保存用量统计
   */
  private saveUsageStats(): void {
    try {
      storage.set('nightshift-usage-stats', this.usageStats);
    } catch (error) {
      console.error('Failed to save usage stats:', error);
    }
  }

  /**
   * 获取所有提供商
   */
  getProviders(): ModelProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * 获取启用的提供商
   */
  getEnabledProviders(): ModelProvider[] {
    return this.getProviders().filter(provider => provider.isEnabled);
  }

  /**
   * 获取提供商
   */
  getProvider(id: string): ModelProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * 添加或更新提供商
   */
  async saveProvider(provider: ModelProvider): Promise<void> {
    try {
      this.providers.set(provider.id, provider);
      
      // 保存到本地存储
      const providers = this.getProviders();
      storage.set('nightshift-providers', providers);
      
    } catch (error) {
      throw new NightShiftError(
        'Failed to save provider',
        'PROVIDER_SAVE_ERROR',
        error
      );
    }
  }

  /**
   * 删除提供商
   */
  async deleteProvider(id: string): Promise<void> {
    try {
      if (!this.providers.has(id)) {
        throw new NightShiftError('Provider not found', 'PROVIDER_NOT_FOUND');
      }
      
      this.providers.delete(id);
      
      // 保存到本地存储
      const providers = this.getProviders();
      storage.set('nightshift-providers', providers);
      
    } catch (error) {
      if (error instanceof NightShiftError) throw error;
      throw new NightShiftError(
        'Failed to delete provider',
        'PROVIDER_DELETE_ERROR',
        error
      );
    }
  }

  /**
   * 测试提供商连接
   */
  async testProvider(id: string): Promise<boolean> {
    const provider = this.getProvider(id);
    if (!provider) {
      throw new NightShiftError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    try {
      // 测试连接逻辑
      switch (provider.type) {
        case 'ollama':
          return await this.testOllamaConnection(provider);
        case 'openai':
          return await this.testOpenAIConnection(provider);
        case 'anthropic':
          return await this.testAnthropicConnection(provider);
        default:
          return await this.testCustomConnection(provider);
      }
    } catch (error) {
      console.error(`Provider test failed for ${provider.name}:`, error);
      return false;
    }
  }

  /**
   * 测试 Ollama 连接
   */
  private async testOllamaConnection(provider: ModelProvider): Promise<boolean> {
    try {
      const response = await fetch(`${provider.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * 测试 OpenAI 连接
   */
  private async testOpenAIConnection(provider: ModelProvider): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * 测试 Anthropic 连接
   */
  private async testAnthropicConnection(provider: ModelProvider): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': provider.apiKey || '',
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * 测试自定义连接
   */
  private async testCustomConnection(provider: ModelProvider): Promise<boolean> {
    try {
      if (!provider.baseUrl) return false;
      
      const response = await fetch(`${provider.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * 记录用量统计
   */
  recordUsage(
    providerId: string,
    modelName: string,
    tokens: number,
    cost: number,
    success: boolean = true
  ): void {
    const today = new Date().toISOString().split('T')[0];
    
    // 更新总体统计
    this.usageStats.totalTokens += tokens;
    this.usageStats.totalCost += cost;
    this.usageStats.totalRequests += 1;
    
    if (success) {
      this.usageStats.successfulRequests += 1;
    } else {
      this.usageStats.failedRequests += 1;
    }
    
    // 更新提供商统计
    if (!this.usageStats.byProvider[providerId]) {
      this.usageStats.byProvider[providerId] = {
        providerId,
        tokens: 0,
        cost: 0,
        requests: 0
      };
    }
    
    this.usageStats.byProvider[providerId].tokens += tokens;
    this.usageStats.byProvider[providerId].cost += cost;
    this.usageStats.byProvider[providerId].requests += 1;
    
    // 更新模型统计
    const modelKey = `${providerId}:${modelName}`;
    if (!this.usageStats.byModel[modelKey]) {
      this.usageStats.byModel[modelKey] = {
        modelName,
        tokens: 0,
        cost: 0,
        requests: 0
      };
    }
    
    this.usageStats.byModel[modelKey].tokens += tokens;
    this.usageStats.byModel[modelKey].cost += cost;
    this.usageStats.byModel[modelKey].requests += 1;
    
    // 更新日期统计
    if (today) {
      if (!this.usageStats.byDate[today]) {
        this.usageStats.byDate[today] = {
          date: today,
          tokens: 0,
          cost: 0,
          requests: 0
        };
      }
      
      this.usageStats.byDate[today].tokens += tokens;
      this.usageStats.byDate[today].cost += cost;
      this.usageStats.byDate[today].requests += 1;
    }
    
    // 保存统计
    this.saveUsageStats();
  }

  /**
   * 获取用量统计
   */
  getUsageStats(): UsageStats {
    return { ...this.usageStats };
  }

  /**
   * 重置用量统计
   */
  resetUsageStats(): void {
    this.usageStats = this.initializeUsageStats();
    this.saveUsageStats();
  }

  /**
   * 获取推荐模型（基于任务类型）
   */
  getRecommendedModel(taskType: string): { providerId: string; modelName: string } {
    const enabledProviders = this.getEnabledProviders();
    
    // 简单的推荐逻辑
    if (taskType.includes('code') || taskType.includes('programming')) {
      // 代码任务优先选择代码模型
      for (const provider of enabledProviders) {
        const codeModel = provider.models.find(model => 
          model.includes('coder') || model.includes('code')
        );
        if (codeModel) {
          return { providerId: provider.id, modelName: codeModel };
        }
      }
    }
    
    // 默认返回第一个启用的提供商和模型
    if (enabledProviders.length > 0) {
      const provider = enabledProviders[0];
      if (provider && provider.id && provider.models && provider.models.length > 0) {
        return { 
          providerId: provider.id, 
          modelName: provider.models[0]
        };
      }
    }
    
    throw new NightShiftError('No enabled providers found', 'NO_PROVIDERS_AVAILABLE');
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.providers.clear();
  }
}