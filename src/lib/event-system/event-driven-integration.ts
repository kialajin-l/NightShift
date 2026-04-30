// NightShift 事件驱动集成服务

import { EventBus, Event, EventTypes, getEventBus } from './event-bus';
import { IntegrationService } from '../integration-service';
import { Message, TaskContext } from '../memory/memory-types';
import { ErrorHandler } from '../error-handler';
import { IntegrationModule, Task } from '../../types/integration';

/**
 * 事件驱动集成服务配置
 */
export interface EventDrivenIntegrationConfig {
  enableEventReplay?: boolean;
  maxEventReplayCount?: number;
  enableEventValidation?: boolean;
  eventTimeout?: number;
}

/**
 * 事件驱动集成服务
 */
export class EventDrivenIntegrationService {
  private integrationService: IntegrationService;
  private eventBus: EventBus;
  private config: EventDrivenIntegrationConfig;
  private isInitialized = false;
  private eventSubscriptions: string[] = [];

  constructor(
    integrationService: IntegrationService,
    config: EventDrivenIntegrationConfig = {}
  ) {
    this.integrationService = integrationService;
    this.eventBus = getEventBus();
    this.config = {
      enableEventReplay: true,
      maxEventReplayCount: 100,
      enableEventValidation: true,
      eventTimeout: 30000, // 30秒
      ...config
    };
  }

  /**
   * 初始化事件驱动集成服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await ErrorHandler.safeExecute(async () => {
      // 初始化基础集成服务
      await this.integrationService.initialize();
      
      // 设置事件订阅
      await this.setupEventSubscriptions();
      
      this.isInitialized = true;
      
      // 发布系统启动事件
      await this.eventBus.publish({
        type: EventTypes.SYSTEM_STARTED,
        timestamp: Date.now(),
        source: 'EventDrivenIntegrationService',
        data: { 
          service: 'event_driven_integration',
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('事件驱动集成服务初始化完成');
      
    }, IntegrationModule.INTEGRATION_SERVICE, '事件驱动集成服务初始化');
  }

  /**
   * 设置事件订阅
   */
  private async setupEventSubscriptions(): Promise<void> {
    // 消息处理事件
    this.eventSubscriptions.push(
      this.eventBus.subscribe(
        EventTypes.MESSAGE_RECEIVED,
        this.handleMessageReceived.bind(this)
      )
    );

    // 任务事件
    this.eventSubscriptions.push(
      this.eventBus.subscribe(
        EventTypes.TASK_CREATED,
        this.handleTaskCreated.bind(this)
      )
    );

    this.eventSubscriptions.push(
      this.eventBus.subscribe(
        EventTypes.TASK_COMPLETED,
        this.handleTaskCompleted.bind(this)
      )
    );

    // 规则事件
    this.eventSubscriptions.push(
      this.eventBus.subscribe(
        EventTypes.RULE_EXTRACTED,
        this.handleRuleExtracted.bind(this)
      )
    );

    // 性能事件
    this.eventSubscriptions.push(
      this.eventBus.subscribe(
        EventTypes.PERFORMANCE_METRIC,
        this.handlePerformanceMetric.bind(this)
      )
    );

    // 系统事件
    this.eventSubscriptions.push(
      this.eventBus.subscribe(
        EventTypes.SYSTEM_ERROR,
        this.handleSystemError.bind(this)
      )
    );
  }

  /**
   * 处理接收到的消息事件
   */
  private async handleMessageReceived(event: Event): Promise<void> {
    try {
      const message = event.data as Message;
      
      // 验证消息格式
      if (this.config.enableEventValidation) {
        if (!message.id || !message.content) {
          throw new Error('无效的消息格式');
        }
      }

      // 处理用户消息
      const result = await this.integrationService.processUserMessage(message);
      
      // 发布消息处理完成事件
      await this.eventBus.publish({
        type: EventTypes.MESSAGE_PROCESSED,
        timestamp: Date.now(),
        source: 'EventDrivenIntegrationService',
        data: {
          messageId: message.id,
          result,
          enhancedContext: result.enhancedContext,
          recommendations: result.recommendations
        }
      });

    } catch (error) {
      await this.handleError('处理消息事件失败', error, event);
    }
  }

  /**
   * 处理任务创建事件
   */
  private async handleTaskCreated(event: Event): Promise<void> {
    try {
      const task = event.data as Task;
      
      // 验证任务格式
      if (this.config.enableEventValidation) {
        if (!task.id || !task.title) {
          throw new Error('无效的任务格式');
        }
      }

      // 这里可以添加任务创建后的处理逻辑
      // 例如：记录到记忆系统、触发相关规则等
      
      console.log(`任务创建事件处理完成: ${task.id}`);

    } catch (error) {
      await this.handleError('处理任务创建事件失败', error, event);
    }
  }

  /**
   * 处理任务完成事件
   */
  private async handleTaskCompleted(event: Event): Promise<void> {
    try {
      const task = event.data as Task;
      
      // 验证任务格式
      if (this.config.enableEventValidation) {
        if (!task.id) {
          throw new Error('无效的任务格式');
        }
      }

      // 这里可以添加任务完成后的处理逻辑
      // 例如：更新统计信息、触发后续任务等
      
      console.log(`任务完成事件处理完成: ${task.id}`);

    } catch (error) {
      await this.handleError('处理任务完成事件失败', error, event);
    }
  }

  /**
   * 处理规则提取事件
   */
  private async handleRuleExtracted(event: Event): Promise<void> {
    try {
      const ruleData = event.data;
      
      // 验证规则数据格式
      if (this.config.enableEventValidation) {
        if (!ruleData.patterns || !Array.isArray(ruleData.patterns)) {
          throw new Error('无效的规则数据格式');
        }
      }

      // 这里可以添加规则提取后的处理逻辑
      // 例如：验证规则、应用到代码库、更新知识库等
      
      console.log(`规则提取事件处理完成: ${ruleData.patterns.length} 个规则`);

    } catch (error) {
      await this.handleError('处理规则提取事件失败', error, event);
    }
  }

  /**
   * 处理性能指标事件
   */
  private async handlePerformanceMetric(event: Event): Promise<void> {
    try {
      const metric = event.data;
      
      // 记录性能指标到集成服务
      // 这里可以添加性能监控和优化逻辑
      
      console.log(`性能指标事件处理完成: ${metric.metricName} = ${metric.value}`);

    } catch (error) {
      await this.handleError('处理性能指标事件失败', error, event);
    }
  }

  /**
   * 处理系统错误事件
   */
  private async handleSystemError(event: Event): Promise<void> {
    try {
      const errorData = event.data;
      
      // 处理系统错误
      // 这里可以添加错误恢复、日志记录、通知等逻辑
      
      console.error(`系统错误事件处理:`, errorData);

    } catch (error) {
      // 错误处理本身出错时，记录到控制台
      console.error('处理系统错误事件失败:', error);
    }
  }

  /**
   * 统一错误处理
   */
  private async handleError(context: string, error: unknown, event: Event): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 发布错误事件
    await this.eventBus.publish({
      type: EventTypes.SYSTEM_ERROR,
      timestamp: Date.now(),
      source: 'EventDrivenIntegrationService',
      data: {
        context,
        error: errorMessage,
        originalEvent: event,
        timestamp: new Date().toISOString()
      }
    });

    console.error(`${context}:`, error);
  }

  /**
   * 发布自定义事件
   */
  async publishEvent(eventType: string, data?: any, source?: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('事件驱动集成服务未初始化');
    }

    await this.eventBus.publish({
      type: eventType,
      data,
      source: source || 'EventDrivenIntegrationService',
      timestamp: Date.now()
    });
  }

  /**
   * 等待特定事件
   */
  async waitForEvent(eventType: string, timeout?: number): Promise<Event> {
    if (!this.isInitialized) {
      throw new Error('事件驱动集成服务未初始化');
    }

    return await this.eventBus.waitFor(eventType, timeout || this.config.eventTimeout);
  }

  /**
   * 获取事件统计信息
   */
  getEventStats(): any {
    return this.eventBus.getSubscriptionStats();
  }

  /**
   * 获取事件历史
   */
  getEventHistory(limit?: number): Event[] {
    return this.eventBus.getEventHistory(limit);
  }

  /**
   * 销毁服务
   */
  async destroy(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    // 取消所有事件订阅
    for (const subscriptionId of this.eventSubscriptions) {
      this.eventBus.unsubscribe(subscriptionId);
    }
    this.eventSubscriptions = [];

    // 发布系统关闭事件
    await this.eventBus.publish({
      type: EventTypes.SYSTEM_SHUTDOWN,
      timestamp: Date.now(),
      source: 'EventDrivenIntegrationService',
      data: { 
        service: 'event_driven_integration',
        timestamp: new Date().toISOString()
      }
    });

    // 销毁基础集成服务
    await this.integrationService.reset();
    
    this.isInitialized = false;
    
    console.log('事件驱动集成服务销毁完成');
  }

  /**
   * 获取基础集成服务实例
   */
  getIntegrationService(): IntegrationService {
    return this.integrationService;
  }

  /**
   * 获取事件总线实例
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * 检查服务是否已初始化
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

/**
 * 创建事件驱动集成服务工厂函数
 */
export function createEventDrivenIntegrationService(
  integrationService: IntegrationService,
  config?: EventDrivenIntegrationConfig
): EventDrivenIntegrationService {
  return new EventDrivenIntegrationService(integrationService, config);
}