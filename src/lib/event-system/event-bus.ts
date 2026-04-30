// NightShift 事件总线系统

/**
 * 事件接口
 */
export interface Event {
  type: string;
  data?: any;
  timestamp: number;
  source?: string;
  correlationId?: string;
}

/**
 * 事件处理器接口
 */
export interface EventHandler {
  (event: Event): void | Promise<void>;
}

/**
 * 事件订阅选项
 */
export interface SubscriptionOptions {
  once?: boolean; // 是否只执行一次
  priority?: number; // 优先级（数字越小优先级越高）
  filter?: (event: Event) => boolean; // 事件过滤器
}

/**
 * 事件订阅
 */
export interface EventSubscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  options: SubscriptionOptions;
}

/**
 * 事件总线类
 */
export class EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventHistory: Event[] = [];
  private maxHistorySize: number = 1000;
  private isDebugMode: boolean = false;

  /**
   * 订阅事件
   */
  subscribe(
    eventType: string,
    handler: EventHandler,
    options: SubscriptionOptions = {}
  ): string {
    const subscriptionId = this.generateId();
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      handler,
      options: {
        priority: 0,
        ...options
      }
    };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    this.subscriptions.get(eventType)!.push(subscription);
    
    // 按优先级排序
    this.subscriptions.get(eventType)!.sort((a, b) => 
      (a.options.priority || 0) - (b.options.priority || 0)
    );

    this.log('debug', `订阅事件: ${eventType} (ID: ${subscriptionId})`);
    return subscriptionId;
  }

  /**
   * 取消订阅
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        this.log('debug', `取消订阅: ${eventType} (ID: ${subscriptionId})`);
        
        if (subscriptions.length === 0) {
          this.subscriptions.delete(eventType);
        }
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * 发布事件
   */
  async publish(event: Event): Promise<void> {
    const fullEvent: Event = {
      ...event,
      timestamp: event.timestamp || Date.now()
    };

    // 记录事件历史
    this.eventHistory.push(fullEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    this.log('debug', `发布事件: ${fullEvent.type}`, { event: fullEvent });

    const subscriptions = this.subscriptions.get(fullEvent.type) || [];
    const onceSubscriptions: string[] = [];

    // 按优先级顺序执行处理器
    for (const subscription of subscriptions) {
      try {
        // 检查过滤器
        if (subscription.options.filter && !subscription.options.filter(fullEvent)) {
          continue;
        }

        // 执行处理器
        await subscription.handler(fullEvent);

        // 标记一次性订阅
        if (subscription.options.once) {
          onceSubscriptions.push(subscription.id);
        }

      } catch (error) {
        this.log('error', `事件处理器执行失败: ${subscription.id}`, { 
          error: error instanceof Error ? error.message : String(error),
          event: fullEvent
        });
      }
    }

    // 清理一次性订阅
    for (const subscriptionId of onceSubscriptions) {
      this.unsubscribe(subscriptionId);
    }
  }

  /**
   * 等待特定事件
   */
  waitFor(eventType: string, timeout: number = 5000): Promise<Event> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.unsubscribe(subscriptionId);
        reject(new Error(`等待事件超时: ${eventType}`));
      }, timeout);

      const subscriptionId = this.subscribe(eventType, (event) => {
        clearTimeout(timeoutId);
        this.unsubscribe(subscriptionId);
        resolve(event);
      }, { once: true });
    });
  }

  /**
   * 获取事件历史
   */
  getEventHistory(limit?: number): Event[] {
    const history = [...this.eventHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * 获取订阅统计
   */
  getSubscriptionStats() {
    const stats: Record<string, number> = {};
    
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      stats[eventType] = subscriptions.length;
    }

    return {
      totalSubscriptions: Array.from(this.subscriptions.values()).flat().length,
      eventTypes: Array.from(this.subscriptions.keys()),
      byEventType: stats
    };
  }

  /**
   * 设置调试模式
   */
  setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
  }

  /**
   * 清空所有订阅
   */
  clearAllSubscriptions(): void {
    this.subscriptions.clear();
    this.log('info', '清空所有事件订阅');
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 日志记录
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.isDebugMode && level === 'debug') {
      return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[EventBus] [${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (level === 'error') {
      console.error(logMessage, data);
    } else if (level === 'warn') {
      console.warn(logMessage, data);
    } else if (this.isDebugMode) {
      console.log(logMessage, data);
    }
  }
}

/**
 * 预定义事件类型
 */
export const EventTypes = {
  // 任务相关事件
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_COMPLETED: 'task.completed',
  TASK_FAILED: 'task.failed',
  
  // 会话相关事件
  SESSION_STARTED: 'session.started',
  SESSION_ENDED: 'session.ended',
  SESSION_UPDATED: 'session.updated',
  
  // 消息相关事件
  MESSAGE_RECEIVED: 'message.received',
  MESSAGE_PROCESSED: 'message.processed',
  MESSAGE_RESPONSE_SENT: 'message.response_sent',
  
  // 规则相关事件
  RULE_EXTRACTED: 'rule.extracted',
  RULE_APPLIED: 'rule.applied',
  RULE_VALIDATED: 'rule.validated',
  
  // 系统事件
  SYSTEM_STARTED: 'system.started',
  SYSTEM_SHUTDOWN: 'system.shutdown',
  SYSTEM_ERROR: 'system.error',
  
  // 性能事件
  PERFORMANCE_METRIC: 'performance.metric',
  RESOURCE_USAGE: 'resource.usage'
} as const;

// 创建全局事件总线实例
let globalEventBus: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus();
  }
  return globalEventBus;
}