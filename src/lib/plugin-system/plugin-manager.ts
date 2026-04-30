// NightShift 插件系统管理器

import { EventBus, Event, EventTypes, getEventBus } from '../event-system/event-bus';
import { ErrorHandler } from '../error-handler';
import { IntegrationModule } from '../../types/integration';

/**
 * 插件生命周期状态
 */
export enum PluginLifecycleState {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  STARTING = 'starting',
  STARTED = 'started',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  UNLOADING = 'unloading',
  ERROR = 'error'
}

/**
 * 插件元数据
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[]; // 依赖的插件ID
  optionalDependencies?: string[]; // 可选依赖的插件ID
  compatibility?: string; // 兼容的NightShift版本
  
  // 插件能力声明
  capabilities?: string[];
  
  // 配置架构
  configSchema?: any;
}

/**
 * 插件接口
 */
export interface Plugin {
  /**
   * 插件元数据
   */
  metadata: PluginMetadata;

  /**
   * 插件生命周期状态
   */
  state: PluginLifecycleState;

  /**
   * 初始化插件
   */
  initialize?(config?: any): Promise<void>;

  /**
   * 启动插件
   */
  start?(): Promise<void>;

  /**
   * 停止插件
   */
  stop?(): Promise<void>;

  /**
   * 销毁插件
   */
  destroy?(): Promise<void>;

  /**
   * 获取插件配置
   */
  getConfig?(): any;

  /**
   * 更新插件配置
   */
  updateConfig?(config: any): Promise<void>;

  /**
   * 获取插件健康状态
   */
  getHealth?(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    details?: any;
  }>;

  /**
   * 处理插件事件
   */
  handleEvent?(event: Event): Promise<void>;
}

/**
 * 插件管理器配置
 */
export interface PluginManagerConfig {
  pluginsDirectory?: string;
  autoLoadPlugins?: boolean;
  enableHotReload?: boolean;
  maxPluginLoadTime?: number;
  dependencyResolution?: 'strict' | 'lax';
}

/**
 * 插件注册信息
 */
export interface PluginRegistration {
  plugin: Plugin;
  metadata: PluginMetadata;
  state: PluginLifecycleState;
  config: any;
  dependencies: string[];
  dependents: string[];
  loadTime?: number;
  error?: string;
}

/**
 * 插件管理器类
 */
export class PluginManager {
  private plugins: Map<string, PluginRegistration> = new Map();
  private eventBus: EventBus;
  private config: PluginManagerConfig;
  private isInitialized = false;

  constructor(config: PluginManagerConfig = {}) {
    this.eventBus = getEventBus();
    this.config = {
      pluginsDirectory: './plugins',
      autoLoadPlugins: true,
      enableHotReload: false,
      maxPluginLoadTime: 30000, // 30秒
      dependencyResolution: 'strict',
      ...config
    };
  }

  /**
   * 初始化插件管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await ErrorHandler.safeExecute(async () => {
      this.isInitialized = true;
      
      // 设置事件监听
      await this.setupEventListeners();
      
      // 自动加载插件
      if (this.config.autoLoadPlugins) {
        await this.loadPlugins();
      }
      
      console.log('插件管理器初始化完成');
      
    }, IntegrationModule.PLUGIN_SYSTEM, '插件管理器初始化');
  }

  /**
   * 设置事件监听器
   */
  private async setupEventListeners(): Promise<void> {
    // 监听系统事件
    this.eventBus.subscribe(
      EventTypes.SYSTEM_STARTED,
      this.handleSystemStarted.bind(this)
    );

    this.eventBus.subscribe(
      EventTypes.SYSTEM_SHUTDOWN,
      this.handleSystemShutdown.bind(this)
    );

    // 监听插件相关事件
    this.eventBus.subscribe(
      'plugin.*',
      this.handlePluginEvent.bind(this)
    );
  }

  /**
   * 加载所有插件
   */
  async loadPlugins(): Promise<void> {
    await ErrorHandler.safeExecute(async () => {
      console.log('开始加载插件...');
      
      // 这里应该扫描插件目录并加载插件
      // 简化实现：手动注册示例插件
      
      const pluginStats = this.getPluginStats();
      console.log(`插件加载完成: ${pluginStats.total} 个插件`);
      
    }, IntegrationModule.PLUGIN_SYSTEM, '加载插件');
  }

  /**
   * 注册插件
   */
  async registerPlugin(plugin: Plugin, config?: any): Promise<void> {
    await ErrorHandler.safeExecute(async () => {
      const { id, name, version, dependencies = [] } = plugin.metadata;
      
      // 检查插件是否已注册
      if (this.plugins.has(id)) {
        throw new Error(`插件已注册: ${id}`);
      }
      
      // 验证依赖关系
      await this.validateDependencies(id, dependencies);
      
      // 创建插件注册信息
      const registration: PluginRegistration = {
        plugin,
        metadata: plugin.metadata,
        state: PluginLifecycleState.UNLOADED,
        config: config || {},
        dependencies,
        dependents: []
      };
      
      this.plugins.set(id, registration);
      
      // 更新依赖关系
      this.updateDependencyGraph(id, dependencies);
      
      // 发布插件注册事件
      await this.eventBus.publish({
        type: 'plugin.registered',
        timestamp: Date.now(),
        source: 'PluginManager',
        data: { pluginId: id, pluginName: name, version }
      });
      
      console.log(`插件注册成功: ${name} v${version}`);
      
    }, IntegrationModule.PLUGIN_SYSTEM, '注册插件', { pluginId: plugin.metadata.id });
  }

  /**
   * 初始化插件
   */
  async initializePlugin(pluginId: string): Promise<void> {
    await ErrorHandler.safeExecute(async () => {
      const registration = this.getPluginRegistration(pluginId);
      
      if (registration.state !== PluginLifecycleState.LOADED) {
        throw new Error(`插件未加载: ${pluginId}`);
      }
      
      // 更新状态
      registration.state = PluginLifecycleState.INITIALIZING;
      
      // 初始化插件
      if (registration.plugin.initialize) {
        await registration.plugin.initialize(registration.config);
      }
      
      registration.state = PluginLifecycleState.INITIALIZED;
      
      // 发布插件初始化事件
      await this.eventBus.publish({
        type: 'plugin.initialized',
        timestamp: Date.now(),
        source: 'PluginManager',
        data: { pluginId }
      });
      
      console.log(`插件初始化完成: ${pluginId}`);
      
    }, IntegrationModule.PLUGIN_SYSTEM, '初始化插件', { pluginId });
  }

  /**
   * 启动插件
   */
  async startPlugin(pluginId: string): Promise<void> {
    await ErrorHandler.safeExecute(async () => {
      const registration = this.getPluginRegistration(pluginId);
      
      if (registration.state !== PluginLifecycleState.INITIALIZED) {
        throw new Error(`插件未初始化: ${pluginId}`);
      }
      
      // 更新状态
      registration.state = PluginLifecycleState.STARTING;
      
      // 启动插件
      if (registration.plugin.start) {
        await registration.plugin.start();
      }
      
      registration.state = PluginLifecycleState.STARTED;
      
      // 发布插件启动事件
      await this.eventBus.publish({
        type: 'plugin.started',
        timestamp: Date.now(),
        source: 'PluginManager',
        data: { pluginId }
      });
      
      console.log(`插件启动完成: ${pluginId}`);
      
    }, IntegrationModule.PLUGIN_SYSTEM, '启动插件', { pluginId });
  }

  /**
   * 停止插件
   */
  async stopPlugin(pluginId: string): Promise<void> {
    await ErrorHandler.safeExecute(async () => {
      const registration = this.getPluginRegistration(pluginId);
      
      if (registration.state !== PluginLifecycleState.STARTED) {
        throw new Error(`插件未启动: ${pluginId}`);
      }
      
      // 更新状态
      registration.state = PluginLifecycleState.STOPPING;
      
      // 停止插件
      if (registration.plugin.stop) {
        await registration.plugin.stop();
      }
      
      registration.state = PluginLifecycleState.STOPPED;
      
      // 发布插件停止事件
      await this.eventBus.publish({
        type: 'plugin.stopped',
        timestamp: Date.now(),
        source: 'PluginManager',
        data: { pluginId }
      });
      
      console.log(`插件停止完成: ${pluginId}`);
      
    }, IntegrationModule.PLUGIN_SYSTEM, '停止插件', { pluginId });
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    await ErrorHandler.safeExecute(async () => {
      const registration = this.getPluginRegistration(pluginId);
      
      // 检查是否有依赖此插件的插件
      if (registration.dependents.length > 0) {
        throw new Error(`无法卸载插件 ${pluginId}，有 ${registration.dependents.length} 个插件依赖它`);
      }
      
      // 更新状态
      registration.state = PluginLifecycleState.UNLOADING;
      
      // 销毁插件
      if (registration.plugin.destroy) {
        await registration.plugin.destroy();
      }
      
      // 从注册表中移除
      this.plugins.delete(pluginId);
      
      // 清理依赖关系
      this.cleanupDependencyGraph(pluginId);
      
      // 发布插件卸载事件
      await this.eventBus.publish({
        type: 'plugin.unloaded',
        timestamp: Date.now(),
        source: 'PluginManager',
        data: { pluginId }
      });
      
      console.log(`插件卸载完成: ${pluginId}`);
      
    }, IntegrationModule.PLUGIN_SYSTEM, '卸载插件', { pluginId });
  }

  /**
   * 获取插件信息
   */
  getPlugin(pluginId: string): PluginRegistration | null {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): PluginRegistration[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取插件统计信息
   */
  getPluginStats() {
    const plugins = this.getAllPlugins();
    const stats = {
      total: plugins.length,
      byState: {} as Record<PluginLifecycleState, number>,
      byCapability: {} as Record<string, number>
    };
    
    // 按状态统计
    for (const state of Object.values(PluginLifecycleState)) {
      stats.byState[state] = plugins.filter(p => p.state === state).length;
    }
    
    // 按能力统计
    for (const plugin of plugins) {
      for (const capability of plugin.metadata.capabilities || []) {
        stats.byCapability[capability] = (stats.byCapability[capability] || 0) + 1;
      }
    }
    
    return stats;
  }

  /**
   * 验证依赖关系
   */
  private async validateDependencies(pluginId: string, dependencies: string[]): Promise<void> {
    const missingDependencies: string[] = [];
    
    for (const dependencyId of dependencies) {
      if (!this.plugins.has(dependencyId)) {
        missingDependencies.push(dependencyId);
      }
    }
    
    if (missingDependencies.length > 0 && this.config.dependencyResolution === 'strict') {
      throw new Error(
        `插件 ${pluginId} 缺少依赖: ${missingDependencies.join(', ')}`
      );
    }
  }

  /**
   * 更新依赖关系图
   */
  private updateDependencyGraph(pluginId: string, dependencies: string[]): void {
    for (const dependencyId of dependencies) {
      const dependency = this.plugins.get(dependencyId);
      if (dependency && !dependency.dependents.includes(pluginId)) {
        dependency.dependents.push(pluginId);
      }
    }
  }

  /**
   * 清理依赖关系图
   */
  private cleanupDependencyGraph(pluginId: string): void {
    for (const registration of this.plugins.values()) {
      const dependencyIndex = registration.dependencies.indexOf(pluginId);
      if (dependencyIndex !== -1) {
        registration.dependencies.splice(dependencyIndex, 1);
      }
      
      const dependentIndex = registration.dependents.indexOf(pluginId);
      if (dependentIndex !== -1) {
        registration.dependents.splice(dependentIndex, 1);
      }
    }
  }

  /**
   * 获取插件注册信息
   */
  private getPluginRegistration(pluginId: string): PluginRegistration {
    const registration = this.plugins.get(pluginId);
    if (!registration) {
      throw new Error(`插件未找到: ${pluginId}`);
    }
    return registration;
  }

  /**
   * 处理系统启动事件
   */
  private async handleSystemStarted(event: Event): Promise<void> {
    try {
      // 启动所有已注册的插件
      const plugins = this.getAllPlugins();
      
      for (const registration of plugins) {
        if (registration.state === PluginLifecycleState.INITIALIZED) {
          await this.startPlugin(registration.metadata.id);
        }
      }
      
    } catch (error) {
      console.error('处理系统启动事件失败:', error);
    }
  }

  /**
   * 处理系统关闭事件
   */
  private async handleSystemShutdown(event: Event): Promise<void> {
    try {
      // 停止所有插件
      const plugins = this.getAllPlugins();
      
      for (const registration of plugins) {
        if (registration.state === PluginLifecycleState.STARTED) {
          await this.stopPlugin(registration.metadata.id);
        }
      }
      
    } catch (error) {
      console.error('处理系统关闭事件失败:', error);
    }
  }

  /**
   * 处理插件事件
   */
  private async handlePluginEvent(event: Event): Promise<void> {
    try {
      // 将事件分发给所有插件
      const plugins = this.getAllPlugins();
      
      for (const registration of plugins) {
        if (registration.plugin.handleEvent && 
            registration.state === PluginLifecycleState.STARTED) {
          await registration.plugin.handleEvent(event);
        }
      }
      
    } catch (error) {
      console.error('处理插件事件失败:', error);
    }
  }

  /**
   * 销毁插件管理器
   */
  async destroy(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }
    
    // 停止所有插件
    const plugins = this.getAllPlugins();
    
    for (const registration of plugins) {
      if (registration.state === PluginLifecycleState.STARTED) {
        await this.stopPlugin(registration.metadata.id);
      }
    }
    
    this.plugins.clear();
    this.isInitialized = false;
    
    console.log('插件管理器销毁完成');
  }
}

/**
 * 创建插件管理器工厂函数
 */
export function createPluginManager(config?: PluginManagerConfig): PluginManager {
  return new PluginManager(config);
}