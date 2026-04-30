// NightShift WebSocket 实时通信服务

import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: 'task_update' | 'agent_update' | 'progress_update' | 'error' | 'notification' | 'connection' | 'subscribe' | 'request' | 'session_update';
  data: any;
  timestamp: number;
  sessionId?: string;
}

export interface TaskUpdateMessage {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  output?: any;
  error?: string;
}

export interface AgentUpdateMessage {
  agentId: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentTask?: string;
  progress: number;
  performance: {
    responseTime: number;
    successRate: number;
    errorCount: number;
  };
}

export interface ProgressUpdateMessage {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
  overallProgress: number;
  estimatedRemainingTime: number;
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3秒
  private isConnected = false;
  private sessionId: string;

  constructor(sessionId: string = 'default') {
    super();
    this.sessionId = sessionId;
  }

  /**
   * 连接到 WebSocket 服务器
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 检查浏览器环境
        if (typeof window === 'undefined') {
          throw new Error('WebSocket 仅在浏览器环境中可用');
        }

        // 获取 WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/api/ws`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket 连接已建立');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // 发送连接确认消息
          this.send({
            type: 'connection',
            data: { sessionId: this.sessionId }
          });
          
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('解析 WebSocket 消息失败:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket 连接已关闭:', event.code, event.reason);
          this.isConnected = false;
          this.emit('disconnected', event);
          
          // 自动重连
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++;
              console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
              this.connect().catch(console.error);
            }, this.reconnectInterval);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket 错误:', error);
          // 安全地触发error事件，避免undefined错误
          const errorData = error || new Error('WebSocket连接失败');
          try {
            this.emit('error', errorData);
          } catch (emitError) {
            console.error('触发error事件失败:', emitError);
          }
          // 不reject，让自动重连机制处理
        };

      } catch (error) {
        console.error('创建 WebSocket 连接失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 断开 WebSocket 连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, '用户主动断开连接');
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * 发送消息
   */
  send(message: Omit<WebSocketMessage, 'timestamp'>): boolean {
    if (!this.isConnected || !this.ws) {
      console.warn('WebSocket 未连接，无法发送消息');
      return false;
    }

    try {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: Date.now(),
        sessionId: this.sessionId
      };
      
      this.ws.send(JSON.stringify(fullMessage));
      return true;
    } catch (error) {
      console.error('发送 WebSocket 消息失败:', error);
      return false;
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'task_update':
        this.emit('taskUpdate', message.data as TaskUpdateMessage);
        break;
        
      case 'agent_update':
        this.emit('agentUpdate', message.data as AgentUpdateMessage);
        break;
        
      case 'progress_update':
        this.emit('progressUpdate', message.data as ProgressUpdateMessage);
        break;
        
      case 'error':
        this.emit('error', message.data);
        break;
        
      case 'notification':
        this.emit('notification', message.data);
        break;
        
      default:
        console.warn('未知的 WebSocket 消息类型:', message.type);
    }
  }

  /**
   * 订阅任务更新
   */
  subscribeToTasks(taskIds: string[]): boolean {
    return this.send({
      type: 'subscribe',
      data: { 
        subscriptionType: 'tasks',
        taskIds 
      }
    });
  }

  /**
   * 订阅 Agent 更新
   */
  subscribeToAgents(agentIds: string[]): boolean {
    return this.send({
      type: 'subscribe',
      data: { 
        subscriptionType: 'agents',
        agentIds 
      }
    });
  }

  /**
   * 请求任务状态更新
   */
  requestTaskStatus(taskId: string): boolean {
    return this.send({
      type: 'request',
      data: { 
        requestType: 'task_status',
        taskId 
      }
    });
  }

  /**
   * 请求 Agent 状态更新
   */
  requestAgentStatus(agentId: string): boolean {
    return this.send({
      type: 'request',
      data: { 
        requestType: 'agent_status',
        agentId 
      }
    });
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  /**
   * 设置会话 ID
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
    
    // 如果已连接，更新服务器端的会话 ID
    if (this.isConnected) {
      this.send({
        type: 'session_update',
        data: { sessionId }
      });
    }
  }

  // 重载EventEmitter方法以提供类型安全
  override emit(event: string, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  override on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}

// 创建全局 WebSocket 服务实例
let globalWebSocketService: WebSocketService | null = null;

export function getWebSocketService(sessionId?: string): WebSocketService {
  if (!globalWebSocketService) {
    globalWebSocketService = new WebSocketService(sessionId);
  } else if (sessionId) {
    globalWebSocketService.setSessionId(sessionId);
  }
  return globalWebSocketService;
}

export function disconnectWebSocketService(): void {
  if (globalWebSocketService) {
    globalWebSocketService.disconnect();
    globalWebSocketService = null;
  }
}