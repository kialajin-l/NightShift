// NightShift 记忆存储

import { ShortTermMemory, LongTermMemory, WorkingMemory, MemoryQuery, MemoryStats } from './memory-types';

/**
 * 记忆存储配置
 */
export interface MemoryStoreConfig {
  maxShortTermMemory: number;
  shortTermRetentionHours: number;
  longTermRetentionDays: number;
  enableCompression: boolean;
  databasePath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 记忆存储
 */
export class MemoryStore {
  private config: MemoryStoreConfig;
  private shortTermMemory: Map<string, ShortTermMemory> = new Map();
  private longTermMemory: Map<string, LongTermMemory> = new Map();
  private workingMemory: Map<string, WorkingMemory> = new Map();
  
  constructor(config?: Partial<MemoryStoreConfig>) {
    this.config = {
      maxShortTermMemory: 1000,
      shortTermRetentionHours: 24,
      longTermRetentionDays: 365,
      enableCompression: true,
      databasePath: './data/memory.db',
      logLevel: 'info',
      ...config
    };
    
    this.initializeDatabase();
    this.startCleanupLoop();
  }

  /**
   * 初始化数据库
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // 在实际项目中，这里应该初始化 SQLite 数据库
      // 这里使用内存存储作为示例
      this.log('info', '记忆存储数据库已初始化');
    } catch (error) {
      this.log('error', `数据库初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 启动清理循环
   */
  private startCleanupLoop(): void {
    // 每小时清理一次过期记忆
    setInterval(() => {
      this.cleanupExpiredMemory();
    }, 60 * 60 * 1000);
  }

  /**
   * 存储短期记忆
   */
  async storeShortTermMemory(memory: Omit<ShortTermMemory, 'id' | 'expiresAt'>): Promise<string> {
    try {
      const id = this.generateId();
      const expiresAt = new Date(Date.now() + this.config.shortTermRetentionHours * 60 * 60 * 1000);
      
      const shortTermMemory: ShortTermMemory = {
        ...memory,
        id,
        expiresAt
      };
      
      this.shortTermMemory.set(id, shortTermMemory);
      
      // 检查是否超过最大容量
      if (this.shortTermMemory.size > this.config.maxShortTermMemory) {
        await this.evictLeastImportantShortTermMemory();
      }
      
      this.log('debug', `短期记忆已存储: ${id}`);
      return id;
    } catch (error) {
      this.log('error', `存储短期记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 存储长期记忆
   */
  async storeLongTermMemory(memory: Omit<LongTermMemory, 'id' | 'lastAccessed' | 'accessCount'>): Promise<string> {
    try {
      const id = this.generateId();
      
      const longTermMemory: LongTermMemory = {
        ...memory,
        id,
        lastAccessed: new Date(),
        accessCount: 0
      };
      
      this.longTermMemory.set(id, longTermMemory);
      
      this.log('debug', `长期记忆已存储: ${id}`);
      return id;
    } catch (error) {
      this.log('error', `存储长期记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 存储工作记忆
   */
  async storeWorkingMemory(memory: Omit<WorkingMemory, 'id'>): Promise<string> {
    try {
      const id = this.generateId();
      
      const workingMemory: WorkingMemory = {
        ...memory,
        id
      };
      
      this.workingMemory.set(id, workingMemory);
      
      this.log('debug', `工作记忆已存储: ${id}`);
      return id;
    } catch (error) {
      this.log('error', `存储工作记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 获取短期记忆
   */
  async getShortTermMemory(id: string): Promise<ShortTermMemory | null> {
    try {
      const memory = this.shortTermMemory.get(id);
      
      if (memory && memory.expiresAt > new Date()) {
        this.log('debug', `获取短期记忆: ${id}`);
        return memory;
      }
      
      // 如果记忆已过期，删除它
      if (memory) {
        this.shortTermMemory.delete(id);
      }
      
      return null;
    } catch (error) {
      this.log('error', `获取短期记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * 获取长期记忆
   */
  async getLongTermMemory(id: string): Promise<LongTermMemory | null> {
    try {
      const memory = this.longTermMemory.get(id);
      
      if (memory) {
        // 更新访问时间和计数
        memory.lastAccessed = new Date();
        memory.accessCount++;
        
        this.log('debug', `获取长期记忆: ${id}`);
        return memory;
      }
      
      return null;
    } catch (error) {
      this.log('error', `获取长期记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * 获取工作记忆
   */
  async getWorkingMemory(id: string): Promise<WorkingMemory | null> {
    try {
      const memory = this.workingMemory.get(id);
      
      if (memory) {
        this.log('debug', `获取工作记忆: ${id}`);
        return memory;
      }
      
      return null;
    } catch (error) {
      this.log('error', `获取工作记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * 查询记忆
   */
  async queryMemory(query: MemoryQuery): Promise<{
    shortTerm: ShortTermMemory[];
    longTerm: LongTermMemory[];
    working: WorkingMemory[];
  }> {
    try {
      const results = {
        shortTerm: [] as ShortTermMemory[],
        longTerm: [] as LongTermMemory[],
        working: [] as WorkingMemory[]
      };
      
      // 查询短期记忆
      if (query.includeShortTerm) {
        results.shortTerm = Array.from(this.shortTermMemory.values())
          .filter(memory => this.matchesQuery(memory, query))
          .filter(memory => memory.expiresAt > new Date())
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, query.limit || 10);
      }
      
      // 查询长期记忆
      if (query.includeLongTerm) {
        results.longTerm = Array.from(this.longTermMemory.values())
          .filter(memory => this.matchesQuery(memory, query))
          .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
          .slice(0, query.limit || 10);
      }
      
      // 查询工作记忆
      if (query.includeWorking) {
        results.working = Array.from(this.workingMemory.values())
          .filter(memory => this.matchesQuery(memory, query))
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, query.limit || 10);
      }
      
      this.log('debug', `记忆查询完成: 短期 ${results.shortTerm.length} 条，长期 ${results.longTerm.length} 条，工作 ${results.working.length} 条`);
      
      return results;
    } catch (error) {
      this.log('error', `查询记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      return { shortTerm: [], longTerm: [], working: [] };
    }
  }

  /**
   * 检查记忆是否匹配查询条件
   */
  private matchesQuery(memory: ShortTermMemory | LongTermMemory | WorkingMemory, query: MemoryQuery): boolean {
    // 检查会话ID
    if (query.sessionId && 'sessionId' in memory && memory.sessionId !== query.sessionId) {
      return false;
    }
    
    // 检查用户ID
    if (query.userId && 'userId' in memory && memory.userId !== query.userId) {
      return false;
    }
    
    // 检查项目ID
    if (query.projectId && 'projectId' in memory && memory.projectId !== query.projectId) {
      return false;
    }
    
    // 检查重要性
    if (query.importance && (memory as any).importance !== query.importance) {
      return false;
    }
    
    // 检查时间范围
    if (query.fromDate && memory.timestamp < query.fromDate) {
      return false;
    }
    
    if (query.toDate && memory.timestamp > query.toDate) {
      return false;
    }
    
    // 检查关键词
    if (query.keywords && query.keywords.length > 0) {
      const contentStr = JSON.stringify((memory as any).content || (memory as any).context || '').toLowerCase();
      const hasKeyword = query.keywords.some(keyword => 
        contentStr.includes(keyword.toLowerCase())
      );
      
      if (!hasKeyword) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 更新短期记忆
   */
  async updateShortTermMemory(id: string, updates: Partial<Omit<ShortTermMemory, 'id'>>): Promise<boolean> {
    try {
      const memory = this.shortTermMemory.get(id);
      
      if (!memory || memory.expiresAt <= new Date()) {
        return false;
      }
      
      Object.assign(memory, updates);
      memory.timestamp = new Date();
      
      this.log('debug', `短期记忆已更新: ${id}`);
      return true;
    } catch (error) {
      this.log('error', `更新短期记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * 更新长期记忆
   */
  async updateLongTermMemory(id: string, updates: Partial<Omit<LongTermMemory, 'id' | 'accessCount'>>): Promise<boolean> {
    try {
      const memory = this.longTermMemory.get(id);
      
      if (!memory) {
        return false;
      }
      
      Object.assign(memory, updates);
      memory.lastAccessed = new Date();
      
      this.log('debug', `长期记忆已更新: ${id}`);
      return true;
    } catch (error) {
      this.log('error', `更新长期记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * 更新工作记忆
   */
  async updateWorkingMemory(id: string, updates: Partial<Omit<WorkingMemory, 'id'>>): Promise<boolean> {
    try {
      const memory = this.workingMemory.get(id);
      
      if (!memory) {
        return false;
      }
      
      Object.assign(memory, updates);
      memory.timestamp = new Date();
      
      this.log('debug', `工作记忆已更新: ${id}`);
      return true;
    } catch (error) {
      this.log('error', `更新工作记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * 删除短期记忆
   */
  async deleteShortTermMemory(id: string): Promise<boolean> {
    try {
      const existed = this.shortTermMemory.has(id);
      
      if (existed) {
        this.shortTermMemory.delete(id);
        this.log('debug', `短期记忆已删除: ${id}`);
      }
      
      return existed;
    } catch (error) {
      this.log('error', `删除短期记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * 删除长期记忆
   */
  async deleteLongTermMemory(id: string): Promise<boolean> {
    try {
      const existed = this.longTermMemory.has(id);
      
      if (existed) {
        this.longTermMemory.delete(id);
        this.log('debug', `长期记忆已删除: ${id}`);
      }
      
      return existed;
    } catch (error) {
      this.log('error', `删除长期记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * 删除工作记忆
   */
  async deleteWorkingMemory(id: string): Promise<boolean> {
    try {
      const existed = this.workingMemory.has(id);
      
      if (existed) {
        this.workingMemory.delete(id);
        this.log('debug', `工作记忆已删除: ${id}`);
      }
      
      return existed;
    } catch (error) {
      this.log('error', `删除工作记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * 清理过期记忆
   */
  async cleanupExpiredMemory(): Promise<{
    shortTermDeleted: number;
    longTermDeleted: number;
    workingDeleted: number;
  }> {
    try {
      const now = new Date();
      let shortTermDeleted = 0;
      let longTermDeleted = 0;
      let workingDeleted = 0;
      
      // 清理过期短期记忆
      for (const [id, memory] of this.shortTermMemory.entries()) {
        if (memory.expiresAt <= now) {
          this.shortTermMemory.delete(id);
          shortTermDeleted++;
        }
      }
      
      // 清理过期长期记忆（基于保留天数）
      const longTermExpiry = new Date(Date.now() - this.config.longTermRetentionDays * 24 * 60 * 60 * 1000);
      for (const [id, memory] of this.longTermMemory.entries()) {
        if (memory.lastAccessed <= longTermExpiry) {
          this.longTermMemory.delete(id);
          longTermDeleted++;
        }
      }
      
      // 清理过期工作记忆（24小时）
      const workingExpiry = new Date(Date.now() - 24 * 60 * 60 * 1000);
      for (const [id, memory] of this.workingMemory.entries()) {
        if (memory.timestamp <= workingExpiry) {
          this.workingMemory.delete(id);
          workingDeleted++;
        }
      }
      
      this.log('info', `记忆清理完成: 短期 ${shortTermDeleted} 条，长期 ${longTermDeleted} 条，工作 ${workingDeleted} 条`);
      
      return { shortTermDeleted, longTermDeleted, workingDeleted };
    } catch (error) {
      this.log('error', `清理过期记忆失败: ${error instanceof Error ? error.message : String(error)}`);
      return { shortTermDeleted: 0, longTermDeleted: 0, workingDeleted: 0 };
    }
  }

  /**
   * 驱逐最不重要的短期记忆
   */
  private async evictLeastImportantShortTermMemory(): Promise<void> {
    try {
      // 按重要性排序，删除最不重要的记忆
      const memories = Array.from(this.shortTermMemory.values())
        .sort((a, b) => {
          const importanceOrder = { low: 0, medium: 1, high: 2 };
          return importanceOrder[a.importance] - importanceOrder[b.importance];
        });
      
      if (memories.length > 0) {
        const memoryToEvict = memories[0];
        this.shortTermMemory.delete(memoryToEvict.id);
        this.log('debug', `驱逐短期记忆: ${memoryToEvict.id} (重要性: ${memoryToEvict.importance})`);
      }
    } catch (error) {
      this.log('error', `驱逐短期记忆失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取记忆统计信息
   */
  async getMemoryStats(): Promise<MemoryStats> {
    try {
      const now = new Date();
      
      // 计算短期记忆统计
      const shortTermMemories = Array.from(this.shortTermMemory.values());
      const activeShortTerm = shortTermMemories.filter(m => m.expiresAt > now);
      
      // 计算长期记忆统计
      const longTermMemories = Array.from(this.longTermMemory.values());
      
      // 计算工作记忆统计
      const workingMemories = Array.from(this.workingMemory.values());
      
      const stats: MemoryStats = {
        totalShortTerm: activeShortTerm.length,
        totalLongTerm: longTermMemories.length,
        totalWorking: workingMemories.length,
        
        shortTermByImportance: {
          low: activeShortTerm.filter(m => m.importance === 'low').length,
          medium: activeShortTerm.filter(m => m.importance === 'medium').length,
          high: activeShortTerm.filter(m => m.importance === 'high').length
        },
        
        longTermByType: {
          habit: longTermMemories.filter(m => m.type === 'habit').length,
          knowledge: longTermMemories.filter(m => m.type === 'knowledge').length,
          preference: longTermMemories.filter(m => m.type === 'preference').length
        },
        
        averageAccessCount: longTermMemories.length > 0 ? 
          longTermMemories.reduce((sum, m) => sum + m.accessCount, 0) / longTermMemories.length : 0,
        
        memoryUsage: {
          shortTerm: (activeShortTerm.length / this.config.maxShortTermMemory) * 100,
          total: (activeShortTerm.length + longTermMemories.length + workingMemories.length) / 5000 * 100 // 假设总容量为5000
        },
        
        lastCleanup: new Date()
      };
      
      this.log('debug', '记忆统计信息已生成');
      return stats;
    } catch (error) {
      this.log('error', `获取记忆统计信息失败: ${error instanceof Error ? error.message : String(error)}`);
      return {
        totalShortTerm: 0,
        totalLongTerm: 0,
        totalWorking: 0,
        shortTermByImportance: { low: 0, medium: 0, high: 0 },
        longTermByType: { habit: 0, knowledge: 0, preference: 0 },
        averageAccessCount: 0,
        memoryUsage: { shortTerm: 0, total: 0 },
        lastCleanup: new Date()
      };
    }
  }

  /**
   * 导出记忆数据
   */
  async exportMemoryData(): Promise<{
    shortTerm: ShortTermMemory[];
    longTerm: LongTermMemory[];
    working: WorkingMemory[];
  }> {
    try {
      const now = new Date();
      
      const data = {
        shortTerm: Array.from(this.shortTermMemory.values()).filter(m => m.expiresAt > now),
        longTerm: Array.from(this.longTermMemory.values()),
        working: Array.from(this.workingMemory.values())
      };
      
      this.log('info', `记忆数据导出完成: 短期 ${data.shortTerm.length} 条，长期 ${data.longTerm.length} 条，工作 ${data.working.length} 条`);
      
      return data;
    } catch (error) {
      this.log('error', `导出记忆数据失败: ${error instanceof Error ? error.message : String(error)}`);
      return { shortTerm: [], longTerm: [], working: [] };
    }
  }

  /**
   * 导入记忆数据
   */
  async importMemoryData(data: {
    shortTerm: ShortTermMemory[];
    longTerm: LongTermMemory[];
    working: WorkingMemory[];
  }): Promise<{
    shortTermImported: number;
    longTermImported: number;
    workingImported: number;
  }> {
    try {
      let shortTermImported = 0;
      let longTermImported = 0;
      let workingImported = 0;
      
      // 导入短期记忆
      for (const memory of data.shortTerm) {
        if (memory.expiresAt > new Date()) {
          this.shortTermMemory.set(memory.id, memory);
          shortTermImported++;
        }
      }
      
      // 导入长期记忆
      for (const memory of data.longTerm) {
        this.longTermMemory.set(memory.id, memory);
        longTermImported++;
      }
      
      // 导入工作记忆
      for (const memory of data.working) {
        this.workingMemory.set(memory.id, memory);
        workingImported++;
      }
      
      this.log('info', `记忆数据导入完成: 短期 ${shortTermImported} 条，长期 ${longTermImported} 条，工作 ${workingImported} 条`);
      
      return { shortTermImported, longTermImported, workingImported };
    } catch (error) {
      this.log('error', `导入记忆数据失败: ${error instanceof Error ? error.message : String(error)}`);
      return { shortTermImported: 0, longTermImported: 0, workingImported: 0 };
    }
  }

  /**
   * 备份记忆数据
   */
  async backupMemoryData(): Promise<string> {
    try {
      const data = await this.exportMemoryData();
      const backupData = JSON.stringify(data, null, 2);
      
      this.log('info', '记忆数据备份完成');
      return backupData;
    } catch (error) {
      this.log('error', `备份记忆数据失败: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    }
  }

  /**
   * 从备份恢复记忆数据
   */
  async restoreMemoryData(backupData: string): Promise<boolean> {
    try {
      const data = JSON.parse(backupData);
      
      // 清空现有数据
      this.shortTermMemory.clear();
      this.longTermMemory.clear();
      this.workingMemory.clear();
      
      // 导入备份数据
      await this.importMemoryData(data);
      
      this.log('info', '记忆数据恢复完成');
      return true;
    } catch (error) {
      this.log('error', `恢复记忆数据失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 日志记录
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel] || 1;
    
    if (levels[level] >= configLevel) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [MemoryStore] [${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * 获取配置
   */
  getConfig(): MemoryStoreConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<MemoryStoreConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', '配置已更新');
  }

  /**
   * 重置记忆存储
   */
  reset(): void {
    this.shortTermMemory.clear();
    this.longTermMemory.clear();
    this.workingMemory.clear();
    this.log('info', '记忆存储已重置');
  }
}