// NightShift 配置管理系统

import { EventBus, Event, getEventBus } from '../event-system/event-bus';
import { ErrorHandler } from '../error-handler';
import { IntegrationModule } from '../../types/integration';

/**
 * 配置值类型
 */
export type ConfigValue = string | number | boolean | object | any[] | null;

/**
 * 配置架构定义
 */
export interface ConfigSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  default?: ConfigValue;
  description?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
    custom?: (value: ConfigValue) => boolean;
  };
  nested?: Record<string, ConfigSchema>; // 用于对象类型
  items?: ConfigSchema; // 用于数组类型
}

/**
 * 配置变更事件
 */
export interface ConfigChangeEvent {
  key: string;
  oldValue: ConfigValue;
  newValue: ConfigValue;
  timestamp: string;
  source: string;
}

/**
 * 配置源接口
 */
export interface ConfigSource {
  name: string;
  priority: number; // 优先级（数字越大优先级越高）
  
  /**
   * 加载配置
   */
  load(): Promise<Record<string, ConfigValue>>;
  
  /**
   * 保存配置
   */
  save(config: Record<string, ConfigValue>): Promise<void>;
  
  /**
   * 检查配置源是否可用
   */
  isAvailable(): Promise<boolean>;
}

/**
 * 配置管理器选项
 */
export interface ConfigManagerOptions {
  schema?: Record<string, ConfigSchema>;
  sources?: ConfigSource[];
  autoReload?: boolean;
  reloadInterval?: number;
  enableValidation?: boolean;
  enableCaching?: boolean;
  cacheTtl?: number;
}

/**
 * 配置管理器类
 */
export class ConfigManager {
  private config: Map<string, ConfigValue> = new Map();
  private schema: Map<string, ConfigSchema> = new Map();
  private sources: ConfigSource[] = [];
  private eventBus: EventBus;
  private options: ConfigManagerOptions;
  private isInitialized = false;
  private reloadTimer?: NodeJS.Timeout;

  constructor(options: ConfigManagerOptions = {}) {
    this.eventBus = getEventBus();
    this.options = {
      autoReload: false,
      reloadInterval: 30000, // 30秒
      enableValidation: true,
      enableCaching: true,
      cacheTtl: 300000, // 5分钟
      ...options
    };

    // 初始化架构
    this.initializeSchema();
  }

  /**
   * 初始化配置管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await ErrorHandler.safeExecute(async () => {
      // 按优先级排序配置源
      this.sources.sort((a, b) => b.priority - a.priority);
      
      // 加载配置
      await this.loadConfig();
      
      // 设置自动重载
      if (this.options.autoReload) {
        this.setupAutoReload();
      }
      
      this.isInitialized = true;
      
      console.log('配置管理器初始化完成');
      
    }, IntegrationModule.CONFIGURATION as any, '配置管理器初始化');
  }

  /**
   * 初始化架构
   */
  private initializeSchema(): void {
    if (this.options.schema) {
      for (const [key, schema] of Object.entries(this.options.schema)) {
        this.schema.set(key, schema);
      }
    }

    // 添加默认架构
    this.addDefaultSchema();
  }

  /**
   * 添加默认架构
   */
  private addDefaultSchema(): void {
    const defaultSchema: Record<string, ConfigSchema> = {
      'app.name': {
        type: 'string',
        default: 'NightShift',
        description: '应用程序名称',
        required: true
      },
      'app.version': {
        type: 'string',
        default: '1.0.0',
        description: '应用程序版本'
      },
      'app.environment': {
        type: 'string',
        default: 'development',
        description: '运行环境',
        validation: {
          enum: ['development', 'staging', 'production']
        }
      },
      'app.debug': {
        type: 'boolean',
        default: false,
        description: '调试模式'
      },
      'server.port': {
        type: 'number',
        default: 3000,
        description: '服务器端口',
        validation: {
          min: 1,
          max: 65535
        }
      },
      'database.url': {
        type: 'string',
        description: '数据库连接URL',
        required: true
      },
      'cache.enabled': {
        type: 'boolean',
        default: true,
        description: '启用缓存'
      },
      'cache.ttl': {
        type: 'number',
        default: 300000,
        description: '缓存生存时间（毫秒）'
      }
    };

    for (const [key, schema] of Object.entries(defaultSchema)) {
      if (!this.schema.has(key)) {
        this.schema.set(key, schema);
      }
    }
  }

  /**
   * 加载配置
   */
  private async loadConfig(): Promise<void> {
    const mergedConfig: Record<string, ConfigValue> = {};
    
    // 按优先级从各个源加载配置
    for (const source of this.sources) {
      try {
        if (await source.isAvailable()) {
          const sourceConfig = await source.load();
          Object.assign(mergedConfig, sourceConfig);
          console.log(`从 ${source.name} 加载配置`);
        }
      } catch (error) {
        console.warn(`从 ${source.name} 加载配置失败:`, error);
      }
    }

    // 应用默认值
    this.applyDefaults(mergedConfig);
    
    // 验证配置
    if (this.options.enableValidation) {
      this.validateConfig(mergedConfig);
    }
    
    // 更新配置
    await this.updateConfig(mergedConfig, 'system');
  }

  /**
   * 应用默认值
   */
  private applyDefaults(config: Record<string, ConfigValue>): void {
    for (const [key, schema] of this.schema.entries()) {
      if (!(key in config) && schema.default !== undefined) {
        config[key] = schema.default;
      }
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(config: Record<string, ConfigValue>): void {
    const errors: string[] = [];
    
    for (const [key, value] of Object.entries(config)) {
      const schema = this.schema.get(key);
      if (schema) {
        const error = this.validateValue(key, value, schema);
        if (error) {
          errors.push(error);
        }
      }
    }
    
    // 检查必需配置
    for (const [key, schema] of this.schema.entries()) {
      if (schema.required && !(key in config)) {
        errors.push(`必需配置缺失: ${key}`);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`配置验证失败:\n${errors.join('\n')}`);
    }
  }

  /**
   * 验证单个配置值
   */
  private validateValue(key: string, value: ConfigValue, schema: ConfigSchema): string | null {
    // 检查类型
    if (schema.type === 'string' && typeof value !== 'string') {
      return `配置 ${key} 必须是字符串类型`;
    }
    
    if (schema.type === 'number' && typeof value !== 'number') {
      return `配置 ${key} 必须是数字类型`;
    }
    
    if (schema.type === 'boolean' && typeof value !== 'boolean') {
      return `配置 ${key} 必须是布尔类型`;
    }
    
    if (schema.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
      return `配置 ${key} 必须是对象类型`;
    }
    
    if (schema.type === 'array' && !Array.isArray(value)) {
      return `配置 ${key} 必须是数组类型`;
    }
    
    // 检查验证规则
    if (schema.validation) {
      const { min, max, pattern, enum: enumValues, custom } = schema.validation;
      
      if (min !== undefined && typeof value === 'number' && value < min) {
        return `配置 ${key} 必须大于等于 ${min}`;
      }
      
      if (max !== undefined && typeof value === 'number' && value > max) {
        return `配置 ${key} 必须小于等于 ${max}`;
      }
      
      if (pattern && typeof value === 'string' && !new RegExp(pattern).test(value)) {
        return `配置 ${key} 不符合模式: ${pattern}`;
      }
      
      if (enumValues && !enumValues.includes(value)) {
        return `配置 ${key} 必须是以下值之一: ${enumValues.join(', ')}`;
      }
      
      if (custom && !custom(value)) {
        return `配置 ${key} 自定义验证失败`;
      }
    }
    
    // 递归验证嵌套对象
    if (schema.type === 'object' && schema.nested && typeof value === 'object' && value !== null) {
      for (const [nestedKey, nestedSchema] of Object.entries(schema.nested)) {
        const nestedValue = (value as any)[nestedKey];
        if (nestedValue !== undefined) {
          const error = this.validateValue(`${key}.${nestedKey}`, nestedValue, nestedSchema);
          if (error) {
            return error;
          }
        }
      }
    }
    
    // 验证数组项
    if (schema.type === 'array' && schema.items && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const error = this.validateValue(`${key}[${i}]`, value[i], schema.items);
        if (error) {
          return error;
        }
      }
    }
    
    return null;
  }

  /**
   * 获取配置值
   */
  get<T = ConfigValue>(key: string): T | null {
    return (this.config.get(key) as T) || null;
  }

  /**
   * 设置配置值
   */
  async set(key: string, value: ConfigValue, source: string = 'user'): Promise<void> {
    await ErrorHandler.safeExecute(async () => {
      const oldValue = this.config.get(key);
      
      // 验证新值
      if (this.options.enableValidation) {
        const schema = this.schema.get(key);
        if (schema) {
          const error = this.validateValue(key, value, schema);
          if (error) {
            throw new Error(error);
          }
        }
      }
      
      // 更新配置
      this.config.set(key, value);
      
      // 发布配置变更事件
      await this.publishConfigChange(key, oldValue || null, value, source);
      
      // 保存到配置源
      await this.saveConfig();
      
    }, IntegrationModule.CONFIGURATION as any, '设置配置', { key, source });
  }

  /**
   * 批量设置配置
   */
  async setMultiple(config: Record<string, ConfigValue>, source: string = 'user'): Promise<void> {
    await ErrorHandler.safeExecute(async () => {
      const changes: ConfigChangeEvent[] = [];
      
      // 验证所有配置
      if (this.options.enableValidation) {
        this.validateConfig(config);
      }
      
      // 应用变更
      for (const [key, value] of Object.entries(config)) {
        const oldValue = this.config.get(key);
        this.config.set(key, value);
        
        changes.push({
          key,
          oldValue: oldValue || null,
          newValue: value,
          timestamp: new Date().toISOString(),
          source
        });
      }
      
      // 发布配置变更事件
      for (const change of changes) {
        await this.publishConfigChange(change.key, change.oldValue, change.newValue, change.source);
      }
      
      // 保存到配置源
      await this.saveConfig();
      
    }, IntegrationModule.CONFIGURATION as any, '批量设置配置', { configCount: Object.keys(config).length, source });
  }

  /**
   * 更新配置（内部使用）
   */
  private async updateConfig(config: Record<string, ConfigValue>, source: string): Promise<void> {
    const changes: ConfigChangeEvent[] = [];
    
    for (const [key, value] of Object.entries(config)) {
      const oldValue = this.config.get(key);
      
      // 只有当值确实改变时才记录变更
      if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        this.config.set(key, value);
        
        changes.push({
          key,
          oldValue: oldValue || null,
          newValue: value,
          timestamp: new Date().toISOString(),
          source
        });
      }
    }
    
    // 发布配置变更事件
    for (const change of changes) {
      await this.publishConfigChange(change.key, change.oldValue, change.newValue, change.source);
    }
  }

  /**
   * 发布配置变更事件
   */
  private async publishConfigChange(
    key: string,
    oldValue: ConfigValue,
    newValue: ConfigValue,
    source: string
  ): Promise<void> {
    await this.eventBus.publish({
      type: 'config.changed',
      timestamp: Date.now(),
      source: 'ConfigManager',
      data: {
        key,
        oldValue,
        newValue,
        timestamp: new Date().toISOString(),
        source
      }
    });
  }

  /**
   * 保存配置到配置源
   */
  private async saveConfig(): Promise<void> {
    const configObject = Object.fromEntries(this.config.entries());
    
    for (const source of this.sources) {
      try {
        if (await source.isAvailable()) {
          await source.save(configObject);
        }
      } catch (error) {
        console.warn(`保存配置到 ${source.name} 失败:`, error);
      }
    }
  }

  /**
   * 重新加载配置
   */
  async reload(): Promise<void> {
    await ErrorHandler.safeExecute(async () => {
      console.log('重新加载配置...');
      await this.loadConfig();
      console.log('配置重新加载完成');
      
    }, IntegrationModule.CONFIGURATION as any, '重新加载配置');
  }

  /**
   * 设置自动重载
   */
  private setupAutoReload(): void {
    this.reloadTimer = setInterval(() => {
      this.reload().catch(error => {
        console.error('自动重载配置失败:', error);
      });
    }, this.options.reloadInterval);
  }

  /**
   * 获取所有配置
   */
  getAll(): Record<string, ConfigValue> {
    return Object.fromEntries(this.config.entries());
  }

  /**
   * 获取配置架构
   */
  getSchema(): Record<string, ConfigSchema> {
    return Object.fromEntries(this.schema.entries());
  }

  /**
   * 添加配置架构
   */
  addSchema(key: string, schema: ConfigSchema): void {
    this.schema.set(key, schema);
  }

  /**
   * 添加配置源
   */
  addSource(source: ConfigSource): void {
    this.sources.push(source);
    this.sources.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取配置统计
   */
  getStats() {
    return {
      totalConfigs: this.config.size,
      totalSchemas: this.schema.size,
      totalSources: this.sources.length,
      sources: this.sources.map(s => s.name)
    };
  }

  /**
   * 销毁配置管理器
   */
  async destroy(): Promise<void> {
    if (this.reloadTimer) {
      clearInterval(this.reloadTimer);
    }
    
    this.config.clear();
    this.schema.clear();
    this.sources = [];
    this.isInitialized = false;
    
    console.log('配置管理器销毁完成');
  }
}

/**
 * 创建配置管理器工厂函数
 */
export function createConfigManager(options?: ConfigManagerOptions): ConfigManager {
  return new ConfigManager(options);
}