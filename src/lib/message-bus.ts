/**
 * Agent间消息总线 - 基于Socket.IO的分布式消息系统
 */

import { SocketServer } from './socket-server.js';
import { Task, AgentStatus } from '../../packages/agents/src/types/agent.js';

interface MessageBusConfig {
  socketServer?: SocketServer;
  enablePersistent?: boolean;
  maxRetryAttempts?: number;
  messageTimeout?: number;
}

interface Message {
  id: string;
  type: string;
  from: string;
  to: string;
  payload: any;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high';
  retryCount?: number;
  deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'failed';
}

interface Subscription {
  agentId: string;
  messageTypes: string[];
  callback: (message: Message) => void;
}

interface MessageRoutingRule {
  id: string;
  condition: (message: Message) => boolean;
  action: (message: Message) => void;
  priority: number;
}

export class MessageBus {
  private socketServer: SocketServer;
  private config: Required<MessageBusConfig>;
  private subscriptions: Map<string, Subscription[]>;
  private routingRules: MessageRoutingRule[];
  private pendingMessages: Map<string, Message>;
  private logger: Console;

  constructor(config: MessageBusConfig = {}) {
    this.config = {
      socketServer: config.socketServer || new SocketServer(),
      enablePersistent: config.enablePersistent ?? true,
      maxRetryAttempts: config.maxRetryAttempts ?? 3,
      messageTimeout: config.messageTimeout ?? 30000 // 30秒
    };

    this.socketServer = this.config.socketServer;
    this.subscriptions = new Map();
    this.routingRules = [];
    this.pendingMessages = new Map();
    this.logger = console;

    this.initializeMessageHandlers();
    this.startMessageRetryMechanism();
  }

  /**
   * 初始化消息处理器
   */
  private initializeMessageHandlers(): void {
    // 监听消息接收事件
    this.socketServer.sendToAgentType('*', 'message:receive', (message: Message) => {
      this.handleIncomingMessage(message);
    });

    // 监听Agent上线事件
    this.socketServer.sendToAgentType('*', 'agent:online', (data: any) => {
      this.handleAgentOnline(data.agentId);
    });

    // 监听Agent离线事件
    this.socketServer.sendToAgentType('*', 'agent:offline', (data: any) => {
      this.handleAgentOffline(data.agentId);
    });
  }

  /**
   * 发送消息
   */
  async sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'deliveryStatus'>): Promise<string> {
    const fullMessage: Message = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date(),
      deliveryStatus: 'pending',
      retryCount: 0
    };

    // 应用路由规则
    this.applyRoutingRules(fullMessage);

    // 检查目标Agent是否在线
    if (this.socketServer.isAgentOnline(message.to)) {
      const success = this.socketServer.sendToAgent(message.to, 'message:receive', fullMessage);
      
      if (success) {
        fullMessage.deliveryStatus = 'sent';
        this.logger.log(`[MessageBus] 消息发送成功: ${message.from} -> ${message.to} (${message.type})`);
        return fullMessage.id;
      }
    }

    // 如果目标不在线，加入待处理队列
    if (this.config.enablePersistent) {
      this.pendingMessages.set(fullMessage.id, fullMessage);
      this.logger.log(`[MessageBus] 目标Agent不在线，消息已加入队列: ${message.to}`);
    }

    return fullMessage.id;
  }

  /**
   * 发布消息（广播给所有订阅者）
   */
  async publishMessage(messageType: string, payload: any, from: string): Promise<string> {
    const subscribers = this.getSubscribersForType(messageType);
    
    if (subscribers.length === 0) {
      this.logger.warn(`[MessageBus] 没有订阅者接收消息类型: ${messageType}`);
      return '';
    }

    const messageIds: string[] = [];
    
    for (const subscriber of subscribers) {
      const message: Omit<Message, 'id' | 'timestamp' | 'deliveryStatus'> = {
        type: messageType,
        from,
        to: subscriber.agentId,
        payload,
        priority: 'normal'
      };

      const messageId = await this.sendMessage(message);
      if (messageId) {
        messageIds.push(messageId);
      }
    }

    return messageIds.join(',');
  }

  /**
   * 订阅消息
   */
  subscribe(agentId: string, messageTypes: string[], callback: (message: Message) => void): void {
    const subscription: Subscription = {
      agentId,
      messageTypes,
      callback
    };

    for (const messageType of messageTypes) {
      if (!this.subscriptions.has(messageType)) {
        this.subscriptions.set(messageType, []);
      }
      this.subscriptions.get(messageType)!.push(subscription);
    }

    this.logger.log(`[MessageBus] Agent ${agentId} 订阅了消息类型: ${messageTypes.join(', ')}`);
  }

  /**
   * 取消订阅
   */
  unsubscribe(agentId: string, messageTypes?: string[]): void {
    if (messageTypes) {
      for (const messageType of messageTypes) {
        const subscriptions = this.subscriptions.get(messageType) || [];
        const filtered = subscriptions.filter(sub => sub.agentId !== agentId);
        this.subscriptions.set(messageType, filtered);
      }
    } else {
      // 取消所有订阅
      for (const [messageType, subscriptions] of this.subscriptions.entries()) {
        const filtered = subscriptions.filter(sub => sub.agentId !== agentId);
        this.subscriptions.set(messageType, filtered);
      }
    }

    this.logger.log(`[MessageBus] Agent ${agentId} 取消订阅: ${messageTypes ? messageTypes.join(', ') : '所有消息类型'}`);
  }

  /**
   * 添加路由规则
   */
  addRoutingRule(rule: MessageRoutingRule): void {
    this.routingRules.push(rule);
    this.routingRules.sort((a, b) => b.priority - a.priority); // 优先级高的先执行
    
    this.logger.log(`[MessageBus] 添加路由规则: ${rule.id}`);
  }

  /**
   * 移除路由规则
   */
  removeRoutingRule(ruleId: string): boolean {
    const index = this.routingRules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      this.routingRules.splice(index, 1);
      this.logger.log(`[MessageBus] 移除路由规则: ${ruleId}`);
      return true;
    }
    return false;
  }

  /**
   * 处理传入消息
   */
  private handleIncomingMessage(message: Message): void {
    // 更新消息状态
    message.deliveryStatus = 'delivered';

    // 查找订阅者
    const subscribers = this.getSubscribersForType(message.type);
    
    if (subscribers.length === 0) {
      this.logger.warn(`[MessageBus] 没有订阅者处理消息类型: ${message.type}`);
      return;
    }

    // 调用订阅者的回调函数
    for (const subscriber of subscribers) {
      try {
        subscriber.callback(message);
      } catch (error) {
        this.logger.error(`[MessageBus] 消息处理错误 (${subscriber.agentId}):`, error);
      }
    }

    this.logger.log(`[MessageBus] 消息已处理: ${message.type} -> ${subscribers.length} 个订阅者`);
  }

  /**
   * 处理Agent上线
   */
  private handleAgentOnline(agentId: string): void {
    this.logger.log(`[MessageBus] Agent上线: ${agentId}`);
    
    // 发送待处理的消息
    this.deliverPendingMessages(agentId);
  }

  /**
   * 处理Agent离线
   */
  private handleAgentOffline(agentId: string): void {
    this.logger.log(`[MessageBus] Agent离线: ${agentId}`);
    
    // 取消所有订阅
    this.unsubscribe(agentId);
  }

  /**
   * 发送待处理的消息
   */
  private deliverPendingMessages(agentId: string): void {
    const messagesToDeliver: Message[] = [];
    
    for (const message of this.pendingMessages.values()) {
      if (message.to === agentId) {
        messagesToDeliver.push(message);
      }
    }

    for (const message of messagesToDeliver) {
      this.pendingMessages.delete(message.id);
      
      const success = this.socketServer.sendToAgent(agentId, 'message:receive', message);
      if (success) {
        message.deliveryStatus = 'sent';
        this.logger.log(`[MessageBus] 待处理消息已发送: ${message.id} -> ${agentId}`);
      }
    }
  }

  /**
   * 应用路由规则
   */
  private applyRoutingRules(message: Message): void {
    for (const rule of this.routingRules) {
      if (rule.condition(message)) {
        rule.action(message);
        this.logger.log(`[MessageBus] 应用路由规则: ${rule.id} -> 消息 ${message.id}`);
      }
    }
  }

  /**
   * 获取指定消息类型的订阅者
   */
  private getSubscribersForType(messageType: string): Subscription[] {
    return this.subscriptions.get(messageType) || [];
  }

  /**
   * 启动消息重试机制
   */
  private startMessageRetryMechanism(): void {
    setInterval(() => {
      this.retryFailedMessages();
    }, 10000); // 每10秒检查一次
  }

  /**
   * 重试失败的消息
   */
  private retryFailedMessages(): void {
    const now = new Date();
    
    for (const [messageId, message] of this.pendingMessages.entries()) {
      const timeSinceCreation = now.getTime() - message.timestamp.getTime();
      
      if (timeSinceCreation > this.config.messageTimeout) {
        // 消息超时，移除
        this.pendingMessages.delete(messageId);
        message.deliveryStatus = 'failed';
        this.logger.warn(`[MessageBus] 消息超时移除: ${messageId}`);
        continue;
      }

      if (message.retryCount! < this.config.maxRetryAttempts) {
        // 检查目标是否在线
        if (this.socketServer.isAgentOnline(message.to)) {
          const success = this.socketServer.sendToAgent(message.to, 'message:receive', message);
          
          if (success) {
            this.pendingMessages.delete(messageId);
            message.deliveryStatus = 'sent';
            message.retryCount!++;
            this.logger.log(`[MessageBus] 重试消息成功: ${messageId} (尝试 ${message.retryCount})`);
          }
        }
      } else {
        // 超过最大重试次数
        this.pendingMessages.delete(messageId);
        message.deliveryStatus = 'failed';
        this.logger.error(`[MessageBus] 消息重试失败: ${messageId}`);
      }
    }
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取消息总线状态
   */
  getStatus(): {
    totalSubscriptions: number;
    pendingMessages: number;
    activeRoutingRules: number;
    connectedAgents: number;
  } {
    let totalSubs = 0;
    for (const subscriptions of this.subscriptions.values()) {
      totalSubs += subscriptions.length;
    }

    return {
      totalSubscriptions: totalSubs,
      pendingMessages: this.pendingMessages.size,
      activeRoutingRules: this.routingRules.length,
      connectedAgents: this.socketServer.getOnlineAgents().length
    };
  }

  /**
   * 获取待处理消息
   */
  getPendingMessages(): Message[] {
    return Array.from(this.pendingMessages.values());
  }

  /**
   * 清空待处理消息
   */
  clearPendingMessages(): void {
    this.pendingMessages.clear();
    this.logger.log('[MessageBus] 已清空所有待处理消息');
  }
}

// 预定义的消息类型
export const MessageTypes = {
  // 任务相关
  TASK_ASSIGNED: 'task:assigned',
  TASK_COMPLETED: 'task:completed',
  TASK_FAILED: 'task:failed',
  TASK_PROGRESS: 'task:progress',
  
  // Agent协作
  AGENT_COLLABORATION: 'agent:collaboration',
  AGENT_HELP_REQUEST: 'agent:help-request',
  AGENT_RESOURCE_SHARE: 'agent:resource-share',
  
  // 系统事件
  SYSTEM_SHUTDOWN: 'system:shutdown',
  SYSTEM_MAINTENANCE: 'system:maintenance',
  SYSTEM_ERROR: 'system:error',
  
  // 数据同步
  DATA_UPDATED: 'data:updated',
  DATA_SYNC_REQUEST: 'data:sync-request',
  DATA_SYNC_COMPLETE: 'data:sync-complete',
  
  // 性能监控
  PERFORMANCE_METRICS: 'performance:metrics',
  RESOURCE_USAGE: 'resource:usage',
  HEALTH_CHECK: 'health:check'
};

// 导出单例实例
export const messageBus = new MessageBus();

export default MessageBus;