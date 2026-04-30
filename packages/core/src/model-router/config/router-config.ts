/**
 * NightShift 模型路由配置系统
 * 支持配置化路由规则和模型管理
 */

import { RouterConfig, ModelConfig, RoutingRule } from '../types/model-router.js';

/**
 * 默认模型配置
 */
export const DEFAULT_MODELS: ModelConfig[] = [
  // 0 token 本地程序
  {
    name: 'local-file-rename',
    provider: 'local',
    type: 'program',
    capabilities: ['code_analysis'],
    costPerToken: 0,
    maxTokens: 0,
    contextLength: 0,
    supportedLanguages: ['*'],
    timeout: 5000
  },
  {
    name: 'eslint',
    provider: 'local',
    type: 'program',
    capabilities: ['code_analysis'],
    costPerToken: 0,
    maxTokens: 0,
    contextLength: 0,
    supportedLanguages: ['javascript', 'typescript'],
    timeout: 10000
  },
  {
    name: 'typescript',
    provider: 'local',
    type: 'program',
    capabilities: ['code_analysis'],
    costPerToken: 0,
    maxTokens: 0,
    contextLength: 0,
    supportedLanguages: ['typescript'],
    timeout: 15000
  },

  // 本地模型
  {
    name: 'qwen2.5:7b',
    provider: 'ollama',
    type: 'local_model',
    capabilities: ['code_generation', 'documentation'],
    costPerToken: 0.0000001,
    maxTokens: 4096,
    contextLength: 4096,
    supportedLanguages: ['*'],
    endpoint: 'http://localhost:11434',
    timeout: 30000,
    fallback: 'openrouter-free'
  },
  {
    name: 'qwen-coder:7b',
    provider: 'ollama',
    type: 'local_model',
    capabilities: ['code_generation', 'refactoring', 'bug_fixing'],
    costPerToken: 0.0000001,
    maxTokens: 4096,
    contextLength: 4096,
    supportedLanguages: ['*'],
    endpoint: 'http://localhost:11434',
    timeout: 30000,
    fallback: 'openrouter-free'
  },

  // 云端模型
  {
    name: 'glm-5',
    provider: 'openrouter',
    type: 'cloud_model',
    capabilities: ['architecture_design', 'planning', 'coordination'],
    costPerToken: 0.00001,
    maxTokens: 8192,
    contextLength: 8192,
    supportedLanguages: ['*'],
    timeout: 60000,
    fallback: 'qwen2.5:7b'
  },
  {
    name: 'qwen3.6-plus',
    provider: 'openrouter',
    type: 'cloud_model',
    capabilities: ['coordination', 'architecture_design', 'planning'],
    costPerToken: 0.00002,
    maxTokens: 16384,
    contextLength: 16384,
    supportedLanguages: ['*'],
    timeout: 60000,
    fallback: 'glm-5'
  },

  // 免费降级模型
  {
    name: 'openrouter-free',
    provider: 'openrouter',
    type: 'cloud_model',
    capabilities: ['code_generation', 'documentation'],
    costPerToken: 0.000005,
    maxTokens: 2048,
    contextLength: 2048,
    supportedLanguages: ['*'],
    timeout: 30000
  }
];

/**
 * 默认路由规则配置
 */
export const DEFAULT_RULES: RoutingRule[] = [
  // 简单任务规则（0 token）
  {
    id: 'rule-simple-file-rename',
    name: '文件重命名规则',
    conditions: [
      { type: 'task_type', field: 'type', operator: 'equals', value: 'file_rename' }
    ],
    actions: [
      { type: 'select_model', target: 'model', value: 'local-file-rename' }
    ],
    priority: 100,
    enabled: true
  },
  {
    id: 'rule-simple-syntax-check',
    name: '语法检查规则',
    conditions: [
      { type: 'task_type', field: 'type', operator: 'equals', value: 'syntax_check' }
    ],
    actions: [
      { type: 'select_model', target: 'model', value: 'eslint' }
    ],
    priority: 100,
    enabled: true
  },
  {
    id: 'rule-simple-type-validation',
    name: '类型验证规则',
    conditions: [
      { type: 'task_type', field: 'type', operator: 'equals', value: 'type_validation' }
    ],
    actions: [
      { type: 'select_model', target: 'model', value: 'typescript' }
    ],
    priority: 100,
    enabled: true
  },

  // 中等任务规则（本地模型）
  {
    id: 'rule-medium-component-generation',
    name: '组件生成规则',
    conditions: [
      { type: 'task_type', field: 'type', operator: 'equals', value: 'component_generation' },
      { type: 'complexity', field: 'complexity', operator: 'equals', value: 'medium' }
    ],
    actions: [
      { type: 'select_model', target: 'model', value: 'qwen2.5:7b' }
    ],
    priority: 90,
    enabled: true
  },
  {
    id: 'rule-medium-api-development',
    name: 'API开发规则',
    conditions: [
      { type: 'task_type', field: 'type', operator: 'equals', value: 'api_development' },
      { type: 'complexity', field: 'complexity', operator: 'equals', value: 'medium' }
    ],
    actions: [
      { type: 'select_model', target: 'model', value: 'qwen-coder:7b' }
    ],
    priority: 90,
    enabled: true
  },
  {
    id: 'rule-medium-bug-fixing',
    name: 'Bug修复规则',
    conditions: [
      { type: 'task_type', field: 'type', operator: 'equals', value: 'bug_fixing' },
      { type: 'complexity', field: 'complexity', operator: 'equals', value: 'medium' }
    ],
    actions: [
      { type: 'select_model', target: 'model', value: 'qwen-coder:7b' }
    ],
    priority: 90,
    enabled: true
  },

  // 复杂任务规则（云端模型）
  {
    id: 'rule-complex-architecture-design',
    name: '架构设计规则',
    conditions: [
      { type: 'task_type', field: 'type', operator: 'equals', value: 'architecture_design' },
      { type: 'complexity', field: 'complexity', operator: 'equals', value: 'complex' }
    ],
    actions: [
      { type: 'select_model', target: 'model', value: 'glm-5' }
    ],
    priority: 80,
    enabled: true
  },
  {
    id: 'rule-complex-coordination',
    name: '跨模块协调规则',
    conditions: [
      { type: 'task_type', field: 'type', operator: 'equals', value: 'coordination' },
      { type: 'complexity', field: 'complexity', operator: 'equals', value: 'complex' }
    ],
    actions: [
      { type: 'select_model', target: 'model', value: 'qwen3.6-plus' }
    ],
    priority: 80,
    enabled: true
  },
  {
    id: 'rule-complex-code-refactoring',
    name: '代码重构规则',
    conditions: [
      { type: 'task_type', field: 'type', operator: 'equals', value: 'code_refactoring' },
      { type: 'complexity', field: 'complexity', operator: 'equals', value: 'complex' }
    ],
    actions: [
      { type: 'select_model', target: 'model', value: 'qwen3.6-plus' }
    ],
    priority: 80,
    enabled: true
  }
];

/**
 * 默认路由配置
 */
export const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  models: DEFAULT_MODELS,
  rules: DEFAULT_RULES,
  fallback: {
    primary: {
      name: 'default',
      provider: 'local',
      type: 'program',
      capabilities: ['code_generation'],
      costPerToken: 0,
      maxTokens: 0,
      contextLength: 0,
      supportedLanguages: ['*'],
      timeout: 5000
    },
    fallbacks: [],
    maxAttempts: 3,
    userPromptThreshold: 10
  },
  limits: {
    dailyTokenLimit: 100000,
    monthlyCostLimit: 100,
    maxRequestPerMinute: 60
  },
  monitoring: {
    enableUsageTracking: true,
    enablePerformanceMonitoring: true,
    alertThresholds: [
      {
        metric: 'cost',
        threshold: 50,
        severity: 'medium',
        action: 'alert'
      },
      {
        metric: 'error_rate',
        threshold: 0.1,
        severity: 'high',
        action: 'throttle'
      },
      {
        metric: 'quota_usage',
        threshold: 0.8,
        severity: 'medium',
        action: 'alert'
      }
    ]
  },
  logging: {
    level: 'info',
    enableRequestLogging: true,
    enableResponseLogging: false
  }
};

/**
 * 配置验证器
 */
export class RouterConfigValidator {
  /**
   * 验证路由配置
   */
  static validate(config: RouterConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证模型配置
    if (!Array.isArray(config.models)) {
      errors.push('models 必须是数组');
    } else {
      config.models.forEach((model, index) => {
        const modelErrors = this.validateModelConfig(model);
        if (modelErrors.length > 0) {
          errors.push(`模型 ${index} (${model.name}): ${modelErrors.join(', ')}`);
        }
      });
    }

    // 验证路由规则
    if (!Array.isArray(config.rules)) {
      errors.push('rules 必须是数组');
    } else {
      config.rules.forEach((rule, index) => {
        const ruleErrors = this.validateRoutingRule(rule);
        if (ruleErrors.length > 0) {
          errors.push(`规则 ${index} (${rule.name}): ${ruleErrors.join(', ')}`);
        }
      });
    }

    // 验证限制配置
    if (config.limits.dailyTokenLimit <= 0) {
      errors.push('dailyTokenLimit 必须大于 0');
    }
    if (config.limits.monthlyCostLimit <= 0) {
      errors.push('monthlyCostLimit 必须大于 0');
    }
    if (config.limits.maxRequestPerMinute <= 0) {
      errors.push('maxRequestPerMinute 必须大于 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证模型配置
   */
  private static validateModelConfig(model: ModelConfig): string[] {
    const errors: string[] = [];

    if (!model.name || typeof model.name !== 'string') {
      errors.push('name 是必需的字符串');
    }

    if (!model.provider || typeof model.provider !== 'string') {
      errors.push('provider 是必需的字符串');
    }

    if (!model.type || !['program', 'local_model', 'cloud_model'].includes(model.type)) {
      errors.push('type 必须是 program, local_model 或 cloud_model');
    }

    if (!Array.isArray(model.capabilities) || model.capabilities.length === 0) {
      errors.push('capabilities 必须是非空数组');
    }

    if (typeof model.costPerToken !== 'number' || model.costPerToken < 0) {
      errors.push('costPerToken 必须是非负数');
    }

    if (typeof model.maxTokens !== 'number' || model.maxTokens < 0) {
      errors.push('maxTokens 必须是非负数');
    }

    if (typeof model.contextLength !== 'number' || model.contextLength < 0) {
      errors.push('contextLength 必须是非负数');
    }

    if (!Array.isArray(model.supportedLanguages) || model.supportedLanguages.length === 0) {
      errors.push('supportedLanguages 必须是非空数组');
    }

    if (typeof model.timeout !== 'number' || model.timeout <= 0) {
      errors.push('timeout 必须是正数');
    }

    return errors;
  }

  /**
   * 验证路由规则
   */
  private static validateRoutingRule(rule: RoutingRule): string[] {
    const errors: string[] = [];

    if (!rule.id || typeof rule.id !== 'string') {
      errors.push('id 是必需的字符串');
    }

    if (!rule.name || typeof rule.name !== 'string') {
      errors.push('name 是必需的字符串');
    }

    if (!Array.isArray(rule.conditions) || rule.conditions.length === 0) {
      errors.push('conditions 必须是非空数组');
    }

    if (!Array.isArray(rule.actions) || rule.actions.length === 0) {
      errors.push('actions 必须是非空数组');
    }

    if (typeof rule.priority !== 'number' || rule.priority < 0) {
      errors.push('priority 必须是非负数');
    }

    if (typeof rule.enabled !== 'boolean') {
      errors.push('enabled 必须是布尔值');
    }

    return errors;
  }
}

/**
 * 配置加载器
 */
export class RouterConfigLoader {
  /**
   * 从文件加载配置
   */
  static async loadFromFile(filePath: string): Promise<RouterConfig> {
    try {
      // 简化实现：实际应该读取文件
      const config = DEFAULT_ROUTER_CONFIG;
      const validation = RouterConfigValidator.validate(config);
      
      if (!validation.valid) {
        throw new Error(`配置验证失败: ${validation.errors.join('; ')}`);
      }
      
      return config;
    } catch (error) {
      console.error(`加载配置文件失败: ${error.message}`);
      return DEFAULT_ROUTER_CONFIG;
    }
  }

  /**
   * 从环境变量加载配置
   */
  static loadFromEnv(): RouterConfig {
    const config = { ...DEFAULT_ROUTER_CONFIG };

    // 从环境变量读取配置
    if (process.env.ROUTER_DAILY_TOKEN_LIMIT) {
      config.limits.dailyTokenLimit = parseInt(process.env.ROUTER_DAILY_TOKEN_LIMIT, 10);
    }

    if (process.env.ROUTER_MONTHLY_COST_LIMIT) {
      config.limits.monthlyCostLimit = parseFloat(process.env.ROUTER_MONTHLY_COST_LIMIT);
    }

    if (process.env.ROUTER_MAX_REQUESTS_PER_MINUTE) {
      config.limits.maxRequestPerMinute = parseInt(process.env.ROUTER_MAX_REQUESTS_PER_MINUTE, 10);
    }

    if (process.env.ROUTER_LOG_LEVEL) {
      config.logging.level = process.env.ROUTER_LOG_LEVEL as any;
    }

    return config;
  }

  /**
   * 合并多个配置源
   */
  static mergeConfigs(...configs: Partial<RouterConfig>[]): RouterConfig {
    return configs.reduce((merged, current) => {
      const mergedLimits = { ...merged.limits, ...current.limits };
      const mergedMonitoring = { ...merged.monitoring, ...current.monitoring };
      const mergedLogging = { ...merged.logging, ...current.logging };
      
      return {
        ...merged,
        ...current,
        models: [...(merged.models || []), ...(current.models || [])],
        rules: [...(merged.rules || []), ...(current.rules || [])],
        limits: {
          dailyTokenLimit: mergedLimits.dailyTokenLimit || DEFAULT_ROUTER_CONFIG.limits.dailyTokenLimit,
          monthlyCostLimit: mergedLimits.monthlyCostLimit || DEFAULT_ROUTER_CONFIG.limits.monthlyCostLimit,
          maxRequestPerMinute: mergedLimits.maxRequestPerMinute || DEFAULT_ROUTER_CONFIG.limits.maxRequestPerMinute
        },
        monitoring: mergedMonitoring,
        logging: mergedLogging
      };
    }, DEFAULT_ROUTER_CONFIG);
  }
}

/**
 * 配置管理器
 */
export class RouterConfigManager {
  private config: RouterConfig;
  private configFile?: string;

  constructor(initialConfig?: RouterConfig) {
    this.config = initialConfig || DEFAULT_ROUTER_CONFIG;
  }

  /**
   * 获取当前配置
   */
  getConfig(): RouterConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<RouterConfig>): void {
    const validation = RouterConfigValidator.validate({ ...this.config, ...updates });
    if (!validation.valid) {
      throw new Error(`配置更新失败: ${validation.errors.join('; ')}`);
    }

    this.config = { ...this.config, ...updates };
    console.log('路由配置已更新');
  }

  /**
   * 重新加载配置
   */
  async reloadConfig(): Promise<void> {
    if (this.configFile) {
      this.config = await RouterConfigLoader.loadFromFile(this.configFile);
    } else {
      this.config = RouterConfigLoader.loadFromEnv();
    }
    console.log('路由配置已重新加载');
  }

  /**
   * 设置配置文件路径
   */
  setConfigFile(filePath: string): void {
    this.configFile = filePath;
  }

  /**
   * 导出配置为JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 导入配置
   */
  importConfig(configJson: string): void {
    try {
      const config = JSON.parse(configJson);
      const validation = RouterConfigValidator.validate(config);
      
      if (!validation.valid) {
        throw new Error(`配置导入失败: ${validation.errors.join('; ')}`);
      }

      this.config = config;
      console.log('路由配置已导入');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`配置导入失败: ${errorMessage}`);
    }
  }
}