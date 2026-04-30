// NightShift 对话记录器

import { Message, CodeChange, ToolCall, LogEntry, LogFilters } from './memory-types';

// 使用全局 Error 类型
type ErrorType = Error;

/**
 * 对话记录器配置
 */
export interface ConversationLoggerConfig {
  maxLogEntries: number;
  retentionDays: number;
  enableCompression: boolean;
  databasePath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 对话记录器
 */
export class ConversationLogger {
  private config: ConversationLoggerConfig;
  private logEntries: Map<string, LogEntry> = new Map();
  private sessionLogs: Map<string, LogEntry[]> = new Map();
  
  constructor(config?: Partial<ConversationLoggerConfig>) {
    this.config = {
      maxLogEntries: 10000,
      retentionDays: 30,
      enableCompression: true,
      databasePath: './data/logs.db',
      logLevel: 'info',
      ...config
    };
    
    this.initializeDatabase();
  }

  /**
   * 初始化数据库
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // 在实际项目中，这里应该初始化 SQLite 数据库
      // 这里使用内存存储作为示例
      this.log('info', '对话记录器数据库已初始化');
    } catch (error) {
      this.log('error', `数据库初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 记录消息
   */
  async logMessage(message: Message): Promise<void> {
    try {
      const logEntry: LogEntry = {
        id: this.generateId(),
        type: 'message',
        timestamp: new Date(),
        data: message,
        sessionId: message.metadata?.sessionId || 'default',
        userId: message.metadata?.userId || 'anonymous',
        projectId: message.metadata?.projectId || 'default',
        tags: this.extractTagsFromMessage(message)
      };
      
      await this.saveLogEntry(logEntry);
      this.log('debug', `消息已记录: ${message.id}`);
    } catch (error) {
      this.log('error', `记录消息失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 记录代码变更
   */
  async logCodeChange(change: CodeChange): Promise<void> {
    try {
      const logEntry: LogEntry = {
        id: this.generateId(),
        type: 'code-change',
        timestamp: new Date(),
        data: change,
        sessionId: 'default',
        userId: 'anonymous',
        projectId: 'default',
        tags: ['code-change', change.type]
      };
      
      await this.saveLogEntry(logEntry);
      this.log('debug', `代码变更已记录: ${change.type}`);
    } catch (error) {
      this.log('error', `记录代码变更失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 记录错误
   */
  async logError(error: ErrorType): Promise<void> {
    try {
      const errorData = error as any;
      const logEntry: LogEntry = {
        id: this.generateId(),
        type: 'error',
        timestamp: new Date(),
        data: error,
        sessionId: 'default',
        userId: 'anonymous',
        projectId: 'default',
        tags: ['error', errorData.severity || 'error']
      };
      
      await this.saveLogEntry(logEntry);
      this.log('warn', `错误已记录: ${errorData.type || 'unknown'}`);
    } catch (error) {
      this.log('error', `记录错误失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 记录工具调用
   */
  async logToolCall(toolCall: ToolCall): Promise<void> {
    try {
      const logEntry: LogEntry = {
        id: this.generateId(),
        type: 'tool-call',
        timestamp: new Date(),
        data: toolCall,
        sessionId: 'default',
        userId: 'anonymous',
        projectId: 'default',
        tags: ['tool-call', toolCall.name, toolCall.success ? 'success' : 'failure']
      };
      
      await this.saveLogEntry(logEntry);
      this.log('debug', `工具调用已记录: ${toolCall.name}`);
    } catch (error) {
      this.log('error', `记录工具调用失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取对话历史
   */
  async getConversationHistory(filters?: LogFilters): Promise<LogEntry[]> {
    try {
      let entries = Array.from(this.logEntries.values());
      
      // 应用过滤器
      if (filters) {
        if (filters.sessionId) {
          entries = entries.filter(entry => entry.sessionId === filters.sessionId);
        }
        
        if (filters.userId) {
          entries = entries.filter(entry => entry.userId === filters.userId);
        }
        
        if (filters.projectId) {
          entries = entries.filter(entry => entry.projectId === filters.projectId);
        }
        
        if (filters.type) {
          entries = entries.filter(entry => entry.type === filters.type);
        }
        
        if (filters.tags && filters.tags.length > 0) {
          entries = entries.filter(entry => 
            filters.tags!.some(tag => entry.tags.includes(tag))
          );
        }
        
        if (filters.fromDate) {
          entries = entries.filter(entry => entry.timestamp >= filters.fromDate!);
        }
        
        if (filters.toDate) {
          entries = entries.filter(entry => entry.timestamp <= filters.toDate!);
        }
        
        // 排序（最新的在前）
        entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        // 分页
        if (filters.limit) {
          const offset = filters.offset || 0;
          entries = entries.slice(offset, offset + filters.limit);
        }
      }
      
      this.log('debug', `获取对话历史: ${entries.length} 条记录`);
      return entries;
    } catch (error) {
      this.log('error', `获取对话历史失败: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * 获取会话日志
   */
  async getSessionLogs(sessionId: string): Promise<LogEntry[]> {
    try {
      const sessionEntries = this.sessionLogs.get(sessionId) || [];
      this.log('debug', `获取会话日志: ${sessionId} - ${sessionEntries.length} 条记录`);
      return [...sessionEntries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      this.log('error', `获取会话日志失败: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * 获取用户日志
   */
  async getUserLogs(userId: string, limit?: number): Promise<LogEntry[]> {
    try {
      const userEntries = Array.from(this.logEntries.values())
        .filter(entry => entry.userId === userId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      const result = limit ? userEntries.slice(0, limit) : userEntries;
      this.log('debug', `获取用户日志: ${userId} - ${result.length} 条记录`);
      return result;
    } catch (error) {
      this.log('error', `获取用户日志失败: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * 获取项目日志
   */
  async getProjectLogs(projectId: string, limit?: number): Promise<LogEntry[]> {
    try {
      const projectEntries = Array.from(this.logEntries.values())
        .filter(entry => entry.projectId === projectId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      const result = limit ? projectEntries.slice(0, limit) : projectEntries;
      this.log('debug', `获取项目日志: ${projectId} - ${result.length} 条记录`);
      return result;
    } catch (error) {
      this.log('error', `获取项目日志失败: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * 获取统计信息（兼容接口）
   */
  async getStats(): Promise<{
    total: number;
    failed: number;
    succeeded: number;
    byType: Record<string, number>;
  }> {
    const entries = Array.from(this.logEntries.values());
    const byType: Record<string, number> = {};
    entries.forEach(entry => {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
    });
    return {
      total: entries.length,
      failed: entries.filter(e => e.type === 'error').length,
      succeeded: entries.filter(e => e.type !== 'error').length,
      byType
    };
  }

  /**
   * 统计日志信息
   */
  async getLogStatistics(): Promise<{
    totalEntries: number;
    entriesByType: Record<string, number>;
    entriesBySession: Record<string, number>;
    entriesByUser: Record<string, number>;
    entriesByProject: Record<string, number>;
    recentActivity: { date: string; count: number }[];
  }> {
    try {
      const entries = Array.from(this.logEntries.values());
      
      // 按类型统计
      const entriesByType: Record<string, number> = {};
      entries.forEach(entry => {
        entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
      });
      
      // 按会话统计
      const entriesBySession: Record<string, number> = {};
      entries.forEach(entry => {
        entriesBySession[entry.sessionId] = (entriesBySession[entry.sessionId] || 0) + 1;
      });
      
      // 按用户统计
      const entriesByUser: Record<string, number> = {};
      entries.forEach(entry => {
        entriesByUser[entry.userId] = (entriesByUser[entry.userId] || 0) + 1;
      });
      
      // 按项目统计
      const entriesByProject: Record<string, number> = {};
      entries.forEach(entry => {
        entriesByProject[entry.projectId] = (entriesByProject[entry.projectId] || 0) + 1;
      });
      
      // 近期活动统计（最近7天）
      const recentActivity: { date: string; count: number }[] = [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = entries.filter(entry => {
          const entryDate = entry.timestamp.toISOString().split('T')[0];
          return entryDate === dateStr;
        }).length;
        
        recentActivity.push({ date: dateStr, count });
      }
      
      const statistics = {
        totalEntries: entries.length,
        entriesByType,
        entriesBySession,
        entriesByUser,
        entriesByProject,
        recentActivity: recentActivity.reverse()
      };
      
      this.log('info', '日志统计信息已生成');
      return statistics;
    } catch (error) {
      this.log('error', `生成日志统计信息失败: ${error instanceof Error ? error.message : String(error)}`);
      return {
        totalEntries: 0,
        entriesByType: {},
        entriesBySession: {},
        entriesByUser: {},
        entriesByProject: {},
        recentActivity: []
      };
    }
  }

  /**
   * 清理过期日志
   */
  async cleanupExpiredLogs(): Promise<number> {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.config.retentionDays);
      
      const expiredEntries = Array.from(this.logEntries.values())
        .filter(entry => entry.timestamp < retentionDate);
      
      expiredEntries.forEach(entry => {
        this.logEntries.delete(entry.id);
        
        // 从会话日志中移除
        const sessionEntries = this.sessionLogs.get(entry.sessionId);
        if (sessionEntries) {
          const index = sessionEntries.findIndex(e => e.id === entry.id);
          if (index !== -1) {
            sessionEntries.splice(index, 1);
          }
          if (sessionEntries.length === 0) {
            this.sessionLogs.delete(entry.sessionId);
          }
        }
      });
      
      this.log('info', `已清理 ${expiredEntries.length} 条过期日志`);
      return expiredEntries.length;
    } catch (error) {
      this.log('error', `清理过期日志失败: ${error instanceof Error ? error.message : String(error)}`);
      return 0;
    }
  }

  /**
   * 导出日志数据
   */
  async exportLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const entries = Array.from(this.logEntries.values());
      
      if (format === 'json') {
        return JSON.stringify(entries, null, 2);
      } else if (format === 'csv') {
        // 简化的 CSV 导出
        const headers = ['id', 'type', 'timestamp', 'sessionId', 'userId', 'projectId', 'tags'];
        const csvLines = [headers.join(',')];
        
        entries.forEach(entry => {
          const row = [
            entry.id,
            entry.type,
            entry.timestamp.toISOString(),
            entry.sessionId,
            entry.userId,
            entry.projectId,
            entry.tags.join(';')
          ];
          csvLines.push(row.join(','));
        });
        
        return csvLines.join('\n');
      }
      
      return '';
    } catch (error) {
      this.log('error', `导出日志失败: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    }
  }

  /**
   * 保存日志条目
   */
  private async saveLogEntry(entry: LogEntry): Promise<void> {
    // 检查是否超过最大条目数
    if (this.logEntries.size >= this.config.maxLogEntries) {
      await this.cleanupOldestEntries();
    }
    
    this.logEntries.set(entry.id, entry);
    
    // 更新会话日志
    if (!this.sessionLogs.has(entry.sessionId)) {
      this.sessionLogs.set(entry.sessionId, []);
    }
    this.sessionLogs.get(entry.sessionId)!.push(entry);
    
    // 定期清理过期日志
    if (this.logEntries.size % 100 === 0) {
      setTimeout(() => this.cleanupExpiredLogs(), 0);
    }
  }

  /**
   * 清理最旧的条目
   */
  private async cleanupOldestEntries(): Promise<void> {
    const entries = Array.from(this.logEntries.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const entriesToRemove = entries.slice(0, Math.max(1, Math.floor(entries.length * 0.1)));
    
    entriesToRemove.forEach(entry => {
      this.logEntries.delete(entry.id);
      
      const sessionEntries = this.sessionLogs.get(entry.sessionId);
      if (sessionEntries) {
        const index = sessionEntries.findIndex(e => e.id === entry.id);
        if (index !== -1) {
          sessionEntries.splice(index, 1);
        }
      }
    });
    
    this.log('info', `已清理 ${entriesToRemove.length} 条最旧日志`);
  }

  /**
   * 从消息中提取标签
   */
  private extractTagsFromMessage(message: Message): string[] {
    const tags: string[] = [];
    
    tags.push(`role:${message.role}`);
    
    if (message.metadata) {
      if (message.metadata.sentiment) {
        tags.push(`sentiment:${message.metadata.sentiment}`);
      }
      
      if (message.metadata.complexity) {
        tags.push(`complexity:${message.metadata.complexity}`);
      }
      
      if (message.metadata.codeBlocks && message.metadata.codeBlocks.length > 0) {
        tags.push('has-code');
        message.metadata.codeBlocks.forEach(block => {
          tags.push(`language:${block.language}`);
        });
      }
      
      if (message.metadata.errors && message.metadata.errors.length > 0) {
        tags.push('has-errors');
      }
      
      if (message.metadata.toolCalls && message.metadata.toolCalls.length > 0) {
        tags.push('has-tool-calls');
      }
    }
    
    return tags;
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 日志记录
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel] || 1;
    
    if (levels[level] >= configLevel) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ConversationLogger] [${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * 获取配置
   */
  getConfig(): ConversationLoggerConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ConversationLoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', '配置已更新');
  }

  /**
   * 重置日志记录器
   */
  reset(): void {
    this.logEntries.clear();
    this.sessionLogs.clear();
    this.log('info', '日志记录器已重置');
  }
}