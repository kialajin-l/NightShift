// NightShift 示例插件

import { Plugin, PluginMetadata, PluginLifecycleState } from './plugin-manager';
import { EventBus, Event, EventTypes, getEventBus } from '../event-system/event-bus';

/**
 * 示例插件：性能监控插件
 */
export class PerformanceMonitorPlugin implements Plugin {
  public metadata: PluginMetadata = {
    id: 'performance-monitor',
    name: '性能监控插件',
    version: '1.0.0',
    description: '监控系统性能指标并提供实时统计',
    author: 'NightShift Team',
    capabilities: ['performance_monitoring', 'metrics_collection'],
    dependencies: []
  };

  public state: PluginLifecycleState = PluginLifecycleState.UNLOADED;
  private eventBus: EventBus;
  private config: any;
  private metrics: Map<string, number[]> = new Map();

  constructor() {
    this.eventBus = getEventBus();
  }

  async initialize(config?: any): Promise<void> {
    this.config = config || {};
    this.state = PluginLifecycleState.INITIALIZING;
    
    // 初始化指标收集
    this.metrics.set('response_time', []);
    this.metrics.set('memory_usage', []);
    this.metrics.set('cpu_usage', []);
    
    this.state = PluginLifecycleState.INITIALIZED;
    console.log('性能监控插件初始化完成');
  }

  async start(): Promise<void> {
    this.state = PluginLifecycleState.STARTING;
    
    // 开始监控性能指标
    await this.startPerformanceMonitoring();
    
    this.state = PluginLifecycleState.STARTED;
    console.log('性能监控插件启动完成');
  }

  async stop(): Promise<void> {
    this.state = PluginLifecycleState.STOPPING;
    
    // 停止监控
    await this.stopPerformanceMonitoring();
    
    this.state = PluginLifecycleState.STOPPED;
    console.log('性能监控插件停止完成');
  }

  async destroy(): Promise<void> {
    this.metrics.clear();
    this.state = PluginLifecycleState.UNLOADED;
    console.log('性能监控插件销毁完成');
  }

  getConfig(): any {
    return this.config;
  }

  async updateConfig(config: any): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  async getHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    details?: any;
  }> {
    return {
      status: 'healthy',
      details: {
        metricsCount: this.metrics.size,
        lastUpdate: new Date().toISOString()
      }
    };
  }

  async handleEvent(event: Event): Promise<void> {
    if (event.type === EventTypes.PERFORMANCE_METRIC) {
      await this.handlePerformanceMetric(event);
    }
  }

  private async startPerformanceMonitoring(): Promise<void> {
    // 监听性能指标事件
    this.eventBus.subscribe(
      EventTypes.PERFORMANCE_METRIC,
      this.handlePerformanceMetric.bind(this)
    );

    // 定期发布性能报告
    setInterval(() => {
      this.publishPerformanceReport();
    }, this.config.reportInterval || 60000); // 默认1分钟
  }

  private async stopPerformanceMonitoring(): Promise<void> {
    // 清理定时器等资源
  }

  private async handlePerformanceMetric(event: Event): Promise<void> {
    const { metricName, value } = event.data;
    
    if (this.metrics.has(metricName)) {
      const values = this.metrics.get(metricName)!;
      values.push(value);
      
      // 保持最近100个值
      if (values.length > 100) {
        values.shift();
      }
    }
  }

  private async publishPerformanceReport(): Promise<void> {
    const report = this.generatePerformanceReport();
    
    await this.eventBus.publish({
      type: 'performance.report',
      timestamp: Date.now(),
      source: 'PerformanceMonitorPlugin',
      data: report
    });
  }

  private generatePerformanceReport(): any {
    const report: any = {
      timestamp: new Date().toISOString(),
      metrics: {}
    };

    for (const [metricName, values] of this.metrics.entries()) {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        report.metrics[metricName] = {
          average: avg,
          max,
          min,
          count: values.length,
          latest: values[values.length - 1]
        };
      }
    }

    return report;
  }
}

/**
 * 示例插件：规则验证插件
 */
export class RuleValidatorPlugin implements Plugin {
  public metadata: PluginMetadata = {
    id: 'rule-validator',
    name: '规则验证插件',
    version: '1.0.0',
    description: '验证提取的规则是否符合规范',
    author: 'NightShift Team',
    capabilities: ['rule_validation', 'quality_assurance'],
    dependencies: []
  };

  public state: PluginLifecycleState = PluginLifecycleState.UNLOADED;
  private eventBus: EventBus;
  private config: any;

  constructor() {
    this.eventBus = getEventBus();
  }

  async initialize(config?: any): Promise<void> {
    this.config = config || {};
    this.state = PluginLifecycleState.INITIALIZING;
    
    // 初始化验证规则
    this.state = PluginLifecycleState.INITIALIZED;
    console.log('规则验证插件初始化完成');
  }

  async start(): Promise<void> {
    this.state = PluginLifecycleState.STARTING;
    
    // 开始监听规则事件
    await this.startRuleValidation();
    
    this.state = PluginLifecycleState.STARTED;
    console.log('规则验证插件启动完成');
  }

  async stop(): Promise<void> {
    this.state = PluginLifecycleState.STOPPING;
    
    // 停止验证
    await this.stopRuleValidation();
    
    this.state = PluginLifecycleState.STOPPED;
    console.log('规则验证插件停止完成');
  }

  async destroy(): Promise<void> {
    this.state = PluginLifecycleState.UNLOADED;
    console.log('规则验证插件销毁完成');
  }

  getConfig(): any {
    return this.config;
  }

  async updateConfig(config: any): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  async getHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    details?: any;
  }> {
    return {
      status: 'healthy',
      details: {
        validationRules: this.config.validationRules?.length || 0
      }
    };
  }

  async handleEvent(event: Event): Promise<void> {
    if (event.type === EventTypes.RULE_EXTRACTED) {
      await this.handleRuleExtracted(event);
    }
  }

  private async startRuleValidation(): Promise<void> {
    // 监听规则提取事件
    this.eventBus.subscribe(
      EventTypes.RULE_EXTRACTED,
      this.handleRuleExtracted.bind(this)
    );
  }

  private async stopRuleValidation(): Promise<void> {
    // 清理事件监听等资源
  }

  private async handleRuleExtracted(event: Event): Promise<void> {
    const { patterns } = event.data;
    
    if (!patterns || !Array.isArray(patterns)) {
      return;
    }

    const validationResults = [];
    
    for (const pattern of patterns) {
      const result = await this.validateRule(pattern);
      validationResults.push({
        pattern,
        ...result
      });
    }

    // 发布验证结果
    await this.eventBus.publish({
      type: 'rule.validated',
      timestamp: Date.now(),
      source: 'RuleValidatorPlugin',
      data: {
        validationResults,
        totalPatterns: patterns.length,
        validPatterns: validationResults.filter(r => r.isValid).length
      }
    });
  }

  private async validateRule(pattern: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基本验证规则
    if (!pattern.id) {
      errors.push('规则缺少ID');
    }

    if (!pattern.name) {
      warnings.push('规则缺少名称');
    }

    if (!pattern.trigger || typeof pattern.trigger !== 'object') {
      errors.push('规则触发器格式不正确');
    }

    if (!pattern.suggestion || typeof pattern.suggestion !== 'object') {
      errors.push('规则建议格式不正确');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * 示例插件：通知插件
 */
export class NotificationPlugin implements Plugin {
  public metadata: PluginMetadata = {
    id: 'notification',
    name: '通知插件',
    version: '1.0.0',
    description: '发送系统通知和提醒',
    author: 'NightShift Team',
    capabilities: ['notifications', 'alerts'],
    dependencies: []
  };

  public state: PluginLifecycleState = PluginLifecycleState.UNLOADED;
  private eventBus: EventBus;
  private config: any;

  constructor() {
    this.eventBus = getEventBus();
  }

  async initialize(config?: any): Promise<void> {
    this.config = config || {};
    this.state = PluginLifecycleState.INITIALIZING;
    
    // 初始化通知渠道
    this.state = PluginLifecycleState.INITIALIZED;
    console.log('通知插件初始化完成');
  }

  async start(): Promise<void> {
    this.state = PluginLifecycleState.STARTING;
    
    // 开始监听通知事件
    await this.startNotificationService();
    
    this.state = PluginLifecycleState.STARTED;
    console.log('通知插件启动完成');
  }

  async stop(): Promise<void> {
    this.state = PluginLifecycleState.STOPPING;
    
    // 停止通知服务
    await this.stopNotificationService();
    
    this.state = PluginLifecycleState.STOPPED;
    console.log('通知插件停止完成');
  }

  async destroy(): Promise<void> {
    this.state = PluginLifecycleState.UNLOADED;
    console.log('通知插件销毁完成');
  }

  getConfig(): any {
    return this.config;
  }

  async updateConfig(config: any): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  async getHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    details?: any;
  }> {
    return {
      status: 'healthy',
      details: {
        notificationChannels: this.config.channels?.length || 0
      }
    };
  }

  async handleEvent(event: Event): Promise<void> {
    if (event.type === 'notification.send') {
      await this.handleSendNotification(event);
    }
  }

  private async startNotificationService(): Promise<void> {
    // 监听通知事件
    this.eventBus.subscribe(
      'notification.send',
      this.handleSendNotification.bind(this)
    );

    // 监听系统事件并发送通知
    this.eventBus.subscribe(
      EventTypes.SYSTEM_ERROR,
      this.handleSystemError.bind(this)
    );

    this.eventBus.subscribe(
      EventTypes.TASK_COMPLETED,
      this.handleTaskCompleted.bind(this)
    );
  }

  private async stopNotificationService(): Promise<void> {
    // 清理事件监听等资源
  }

  private async handleSendNotification(event: Event): Promise<void> {
    const { title, message, level = 'info', channels = [] } = event.data;
    
    // 发送通知到配置的渠道
    await this.sendToChannels(title, message, level, channels);
    
    console.log(`通知已发送: ${title}`);
  }

  private async handleSystemError(event: Event): Promise<void> {
    const { context, error } = event.data;
    
    await this.eventBus.publish({
      type: 'notification.send',
      timestamp: Date.now(),
      source: 'NotificationPlugin',
      data: {
        title: '系统错误',
        message: `${context}: ${error}`,
        level: 'error',
        channels: this.config.errorChannels || ['console']
      }
    });
  }

  private async handleTaskCompleted(event: Event): Promise<void> {
    const task = event.data;
    
    await this.eventBus.publish({
      type: 'notification.send',
      timestamp: Date.now(),
      source: 'NotificationPlugin',
      data: {
        title: '任务完成',
        message: `任务 "${task.title}" 已完成`,
        level: 'info',
        channels: this.config.taskChannels || ['console']
      }
    });
  }

  private async sendToChannels(
    title: string, 
    message: string, 
    level: string, 
    channels: string[]
  ): Promise<void> {
    for (const channel of channels) {
      switch (channel) {
        case 'console':
          console.log(`[${level.toUpperCase()}] ${title}: ${message}`);
          break;
        case 'file':
          // 文件日志实现
          break;
        case 'webhook':
          // Webhook通知实现
          break;
        default:
          console.warn(`未知的通知渠道: ${channel}`);
      }
    }
  }
}

/**
 * 创建示例插件工厂函数
 */
export function createExamplePlugins(): Plugin[] {
  return [
    new PerformanceMonitorPlugin(),
    new RuleValidatorPlugin(),
    new NotificationPlugin()
  ];
}