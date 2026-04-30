/**
 * Socket.IO 服务端 - Agent间通信和实时状态同步
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer } from 'http';
import { Task, AgentStatus } from '../../packages/agents/src/types/agent';

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface SocketServerConfig {
  port?: number;
  corsOrigin?: string;
  enableLogging?: boolean;
}

interface AgentConnection {
  socket: Socket;
  agentId: string;
  agentType: string;
  status: AgentStatus;
  lastHeartbeat: Date;
}

interface Message {
  id: string;
  type: string;
  from: string;
  to: string;
  payload: any;
  timestamp: Date;
  priority?: 'low' | 'normal' | 'high';
}

export class SocketServer {
  private io!: SocketIOServer;
  private config: Required<SocketServerConfig>;
  private agentConnections: Map<string, AgentConnection>;
  private messageQueue: Map<string, Message[]>;
  private logger: Console;
  private isRunning: boolean = false;

  constructor(config: SocketServerConfig = {}) {
    this.config = {
      port: config.port || 3001,
      corsOrigin: config.corsOrigin || '*',
      enableLogging: config.enableLogging ?? true
    };

    this.agentConnections = new Map();
    this.messageQueue = new Map();
    this.logger = console;

    this.initializeServer();
  }

  /**
   * 初始化Socket.IO服务器
   */
  private initializeServer(): void {
    const httpServer = createServer();
    
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: this.config.corsOrigin,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();

    httpServer.listen(this.config.port, () => {
      this.logger.log(`[SocketServer] 服务启动在端口 ${this.config.port}`);
      this.isRunning = true;
    });
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.logger.log(`[SocketServer] 客户端连接: ${socket.id}`);

      // Agent注册
      socket.on('agent:register', (data: {
        agentId: string;
        agentType: string;
        capabilities: string[];
      }) => {
        this.handleAgentRegister(socket, data);
      });

      // 心跳检测
      socket.on('agent:heartbeat', (data: {
        agentId: string;
        status: AgentStatus;
      }) => {
        this.handleHeartbeat(socket, data);
      });

      // 发送消息
      socket.on('message:send', (message: Message) => {
        this.handleMessageSend(socket, message);
      });

      // 任务状态更新
      socket.on('task:status-update', (data: {
        taskId: string;
        status: TaskStatus;
        agentId: string;
        progress?: number;
      }) => {
        this.handleTaskStatusUpdate(socket, data);
      });

      // 断开连接
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // 错误处理
      socket.on('error', (error) => {
        this.logger.error(`[SocketServer] 客户端错误: ${socket.id}`, error);
      });
    });
  }

  /**
   * 处理Agent注册
   */
  private handleAgentRegister(socket: Socket, data: {
    agentId: string;
    agentType: string;
    capabilities: string[];
  }): void {
    const connection: AgentConnection = {
      socket,
      agentId: data.agentId,
      agentType: data.agentType,
      status: {
        isReady: true,
        isBusy: false,
        completedTasks: 0,
        successRate: 0,
        averageExecutionTime: 0
      },
      lastHeartbeat: new Date()
    };

    this.agentConnections.set(data.agentId, connection);
    
    // 初始化消息队列
    this.messageQueue.set(data.agentId, []);

    this.logger.log(`[SocketServer] Agent注册: ${data.agentId} (${data.agentType})`);
    
    // 发送确认消息
    socket.emit('agent:registered', {
      success: true,
      message: '注册成功',
      serverTime: new Date()
    });

    // 广播Agent上线通知
    this.broadcastToAgents('agent:online', {
      agentId: data.agentId,
      agentType: data.agentType,
      timestamp: new Date()
    });
  }

  /**
   * 处理心跳检测
   */
  private handleHeartbeat(socket: Socket, data: {
    agentId: string;
    status: AgentStatus;
  }): void {
    const connection = this.agentConnections.get(data.agentId);
    if (connection) {
      connection.status = data.status;
      connection.lastHeartbeat = new Date();
      
      // 发送心跳确认
      socket.emit('agent:heartbeat-ack', {
        timestamp: new Date(),
        serverTime: new Date()
      });
    }
  }

  /**
   * 处理消息发送
   */
  private handleMessageSend(socket: Socket, message: Message): void {
    message.timestamp = new Date();
    message.id = message.id || this.generateMessageId();

    const targetConnection = this.agentConnections.get(message.to);
    
    if (targetConnection) {
      // 直接发送给目标Agent
      targetConnection.socket.emit('message:receive', message);
      
      this.logger.log(`[SocketServer] 消息发送: ${message.from} -> ${message.to} (${message.type})`);
    } else {
      // 目标Agent不在线，加入消息队列
      this.queueMessage(message);
      this.logger.log(`[SocketServer] 目标Agent不在线，消息已加入队列: ${message.to}`);
    }

    // 发送发送确认
    socket.emit('message:sent', {
      messageId: message.id,
      timestamp: new Date()
    });
  }

  /**
   * 处理任务状态更新
   */
  private handleTaskStatusUpdate(socket: Socket, data: {
    taskId: string;
    status: TaskStatus;
    agentId: string;
    progress?: number;
  }): void {
    // 广播任务状态更新
    this.broadcastToAgents('task:status-changed', {
      taskId: data.taskId,
      status: data.status,
      agentId: data.agentId,
      progress: data.progress,
      timestamp: new Date()
    });

    this.logger.log(`[SocketServer] 任务状态更新: ${data.taskId} -> ${data.status}`);
  }

  /**
   * 处理断开连接
   */
  private handleDisconnect(socket: Socket): void {
    // 查找对应的Agent连接
    let disconnectedAgentId: string | null = null;
    
    for (const [agentId, connection] of this.agentConnections.entries()) {
      if (connection.socket.id === socket.id) {
        disconnectedAgentId = agentId;
        break;
      }
    }

    if (disconnectedAgentId) {
      this.agentConnections.delete(disconnectedAgentId);
      
      this.logger.log(`[SocketServer] Agent断开连接: ${disconnectedAgentId}`);
      
      // 广播Agent离线通知
      this.broadcastToAgents('agent:offline', {
        agentId: disconnectedAgentId,
        timestamp: new Date()
      });
    }
  }

  /**
   * 广播消息给所有Agent
   */
  private broadcastToAgents(event: string, data: any): void {
    this.io.emit(event, data);
  }

  /**
   * 发送消息给特定Agent
   */
  sendToAgent(agentId: string, event: string, data: any): boolean {
    const connection = this.agentConnections.get(agentId);
    if (connection) {
      connection.socket.emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * 发送消息给特定类型的Agent
   */
  sendToAgentType(agentType: string, event: string, data: any): number {
    let count = 0;
    
    for (const connection of this.agentConnections.values()) {
      if (connection.agentType === agentType) {
        connection.socket.emit(event, data);
        count++;
      }
    }
    
    return count;
  }

  /**
   * 队列消息
   */
  private queueMessage(message: Message): void {
    const queue = this.messageQueue.get(message.to) || [];
    queue.push(message);
    this.messageQueue.set(message.to, queue);
  }

  /**
   * 获取队列中的消息
   */
  getQueuedMessages(agentId: string): Message[] {
    return this.messageQueue.get(agentId) || [];
  }

  /**
   * 清空Agent的消息队列
   */
  clearMessageQueue(agentId: string): void {
    this.messageQueue.set(agentId, []);
  }

  /**
   * 获取所有在线Agent
   */
  getOnlineAgents(): Array<{
    agentId: string;
    agentType: string;
    status: AgentStatus;
    lastHeartbeat: Date;
  }> {
    const agents = [];
    
    for (const connection of this.agentConnections.values()) {
      agents.push({
        agentId: connection.agentId,
        agentType: connection.agentType,
        status: connection.status,
        lastHeartbeat: connection.lastHeartbeat
      });
    }
    
    return agents;
  }

  /**
   * 检查Agent是否在线
   */
  isAgentOnline(agentId: string): boolean {
    return this.agentConnections.has(agentId);
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 启动健康检查
   */
  startHealthCheck(interval: number = 30000): void {
    setInterval(() => {
      this.performHealthCheck();
    }, interval);
  }

  /**
   * 执行健康检查
   */
  private performHealthCheck(): void {
    const now = new Date();
    const timeout = 60000; // 60秒超时

    for (const [agentId, connection] of this.agentConnections.entries()) {
      const timeSinceLastHeartbeat = now.getTime() - connection.lastHeartbeat.getTime();
      
      if (timeSinceLastHeartbeat > timeout) {
        this.logger.warn(`[SocketServer] Agent心跳超时: ${agentId}`);
        
        // 标记为离线
        connection.socket.disconnect();
        this.agentConnections.delete(agentId);
        
        this.broadcastToAgents('agent:timeout', {
          agentId,
          timestamp: now
        });
      }
    }
  }

  /**
   * 获取服务器状态
   */
  getServerStatus(): {
    isRunning: boolean;
    port: number;
    connectedAgents: number;
    totalMessagesQueued: number;
    uptime: number;
  } {
    let totalQueued = 0;
    for (const queue of this.messageQueue.values()) {
      totalQueued += queue.length;
    }

    return {
      isRunning: this.isRunning,
      port: this.config.port,
      connectedAgents: this.agentConnections.size,
      totalMessagesQueued: totalQueued,
      uptime: process.uptime()
    };
  }

  /**
   * 关闭服务器
   */
  async shutdown(): Promise<void> {
    this.logger.log('[SocketServer] 正在关闭服务器...');
    
    // 通知所有Agent
    this.broadcastToAgents('server:shutdown', {
      message: '服务器即将关闭',
      timestamp: new Date()
    });

    // 关闭所有连接
    this.io.close();
    this.isRunning = false;
    
    this.logger.log('[SocketServer] 服务器已关闭');
  }
}

// 导出单例实例
export const socketServer = new SocketServer();

export default SocketServer;