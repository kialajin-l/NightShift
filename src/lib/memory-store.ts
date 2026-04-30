/**
 * MemoryStore持久化 - 智能记忆存储和知识链管理
 */

interface MemoryStoreConfig {
  storagePath?: string;
  maxMemorySize?: number;
  enableCompression?: boolean;
  retentionDays?: number;
  enableKnowledgeGraph?: boolean;
}

interface Memory {
  id: string;
  type: 'task' | 'rule' | 'pattern' | 'insight' | 'failure';
  content: any;
  metadata: {
    created: Date;
    updated: Date;
    source: string;
    confidence: number;
    tags: string[];
    relationships: string[];
  };
  embedding?: number[];
}

interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

interface KnowledgeNode {
  id: string;
  type: string;
  content: string;
  weight: number;
  metadata: any;
}

interface KnowledgeEdge {
  source: string;
  target: string;
  type: string;
  strength: number;
}

interface SearchResult {
  memory: Memory;
  similarity: number;
  relevance: number;
}

export class MemoryStore {
  private config: Required<MemoryStoreConfig>;
  private memories: Map<string, Memory>;
  private knowledgeGraph: KnowledgeGraph;
  private logger: Console;

  constructor(config: MemoryStoreConfig = {}) {
    this.config = {
      storagePath: config.storagePath || './data/memories',
      maxMemorySize: config.maxMemorySize || 10000,
      enableCompression: config.enableCompression ?? true,
      retentionDays: config.retentionDays ?? 90,
      enableKnowledgeGraph: config.enableKnowledgeGraph ?? true
    };

    this.memories = new Map();
    this.knowledgeGraph = {
      nodes: [],
      edges: []
    };
    this.logger = console;

    this.initializeStorage();
  }

  /**
   * 存储记忆
   */
  async storeMemory(memory: Omit<Memory, 'id' | 'metadata'> & { 
    metadata?: Partial<Memory['metadata']> 
  }): Promise<string> {
    const memoryId = this.generateMemoryId();
    
    const fullMemory: Memory = {
      ...memory,
      id: memoryId,
      metadata: {
        created: new Date(),
        updated: new Date(),
        source: memory.metadata?.source || 'unknown',
        confidence: memory.metadata?.confidence || 0.8,
        tags: memory.metadata?.tags || [],
        relationships: memory.metadata?.relationships || [],
        ...memory.metadata
      }
    };

    // 存储到内存
    this.memories.set(memoryId, fullMemory);
    
    // 更新知识图谱
    if (this.config.enableKnowledgeGraph) {
      await this.updateKnowledgeGraph(fullMemory);
    }

    // 持久化到存储
    await this.persistMemory(fullMemory);

    this.logger.log(`[MemoryStore] 记忆存储成功: ${memoryId} (${memory.type})`);

    return memoryId;
  }

  /**
   * 检索记忆
   */
  async retrieveMemory(query: string, options?: {
    type?: string;
    limit?: number;
    minConfidence?: number;
    tags?: string[];
  }): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    for (const memory of this.memories.values()) {
      // 过滤条件
      if (options?.type && memory.type !== options.type) continue;
      if (options?.minConfidence && memory.metadata.confidence < options.minConfidence) continue;
      if (options?.tags && !this.hasMatchingTags(memory, options.tags)) continue;
      
      // 计算相似度
      const similarity = this.calculateSimilarity(query, memory);
      const relevance = this.calculateRelevance(memory, similarity);
      
      if (relevance > 0.1) { // 最低相关性阈值
        results.push({
          memory,
          similarity,
          relevance
        });
      }
    }

    // 按相关性排序
    results.sort((a, b) => b.relevance - a.relevance);
    
    return results.slice(0, options?.limit || 10);
  }

  /**
   * 更新记忆
   */
  async updateMemory(memoryId: string, updates: Partial<Memory>): Promise<boolean> {
    const existingMemory = this.memories.get(memoryId);
    if (!existingMemory) {
      return false;
    }

    const updatedMemory: Memory = {
      ...existingMemory,
      ...updates,
      metadata: {
        ...existingMemory.metadata,
        ...updates.metadata,
        updated: new Date()
      }
    };

    this.memories.set(memoryId, updatedMemory);
    await this.persistMemory(updatedMemory);

    this.logger.log(`[MemoryStore] 记忆更新成功: ${memoryId}`);
    return true;
  }

  /**
   * 删除记忆
   */
  async deleteMemory(memoryId: string): Promise<boolean> {
    const success = this.memories.delete(memoryId);
    if (success) {
      await this.removePersistedMemory(memoryId);
      this.logger.log(`[MemoryStore] 记忆删除成功: ${memoryId}`);
    }
    return success;
  }

  /**
   * 构建知识链
   */
  async buildKnowledgeChain(context: string, depth: number = 3): Promise<Memory[]> {
    const chain: Memory[] = [];
    const visited = new Set<string>();
    
    // 从上下文开始搜索
    const initialResults = await this.retrieveMemory(context, { limit: 5 });
    
    for (const result of initialResults) {
      if (chain.length >= depth) break;
      
      if (!visited.has(result.memory.id)) {
        chain.push(result.memory);
        visited.add(result.memory.id);
        
        // 递归查找相关记忆
        await this.traverseRelationships(result.memory, chain, visited, depth);
      }
    }

    return chain;
  }

  /**
   * 获取统计信息
   */
  getStatistics(): {
    totalMemories: number;
    memoryTypes: Record<string, number>;
    averageConfidence: number;
    knowledgeGraphSize: number;
  } {
    const typeCounts: Record<string, number> = {};
    let totalConfidence = 0;
    
    for (const memory of this.memories.values()) {
      typeCounts[memory.type] = (typeCounts[memory.type] || 0) + 1;
      totalConfidence += memory.metadata.confidence;
    }

    return {
      totalMemories: this.memories.size,
      memoryTypes: typeCounts,
      averageConfidence: this.memories.size > 0 ? totalConfidence / this.memories.size : 0,
      knowledgeGraphSize: this.knowledgeGraph.nodes.length
    };
  }

  /**
   * 导出知识
   */
  async exportKnowledge(format: 'json' | 'yaml' = 'json'): Promise<string> {
    const exportData = {
      memories: Array.from(this.memories.values()),
      knowledgeGraph: this.knowledgeGraph,
      exportTime: new Date(),
      version: '1.0.0'
    };

    if (format === 'yaml') {
      return this.convertToYAML(exportData);
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入知识
   */
  async importKnowledge(data: string, format: 'json' | 'yaml' = 'json'): Promise<boolean> {
    try {
      let importData: any;
      
      if (format === 'yaml') {
        importData = this.parseYAML(data);
      } else {
        importData = JSON.parse(data);
      }

      if (importData.memories && Array.isArray(importData.memories)) {
        for (const memory of importData.memories) {
          await this.storeMemory(memory);
        }
      }

      if (importData.knowledgeGraph) {
        this.knowledgeGraph = importData.knowledgeGraph;
      }

      this.logger.log('[MemoryStore] 知识导入成功');
      return true;

    } catch (error) {
      this.logger.error('[MemoryStore] 知识导入失败:', error);
      return false;
    }
  }

  /**
   * 初始化存储
   */
  private async initializeStorage(): Promise<void> {
    try {
      // 加载持久化的记忆
      await this.loadPersistedMemories();
      
      // 清理过期记忆
      await this.cleanupExpiredMemories();
      
      this.logger.log('[MemoryStore] 存储初始化完成');
    } catch (error) {
      this.logger.error('[MemoryStore] 存储初始化失败:', error);
    }
  }

  /**
   * 持久化记忆
   */
  private async persistMemory(memory: Memory): Promise<void> {
    // 这里应该实现实际的持久化逻辑
    // 暂时使用内存存储
    
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * 移除持久化记忆
   */
  private async removePersistedMemory(memoryId: string): Promise<void> {
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * 加载持久化记忆
   */
  private async loadPersistedMemories(): Promise<void> {
    // 这里应该从存储加载记忆
    // 暂时为空实现
  }

  /**
   * 清理过期记忆
   */
  private async cleanupExpiredMemories(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    
    for (const [memoryId, memory] of this.memories.entries()) {
      if (memory.metadata.created < cutoffDate) {
        this.memories.delete(memoryId);
      }
    }
  }

  /**
   * 更新知识图谱
   */
  private async updateKnowledgeGraph(memory: Memory): Promise<void> {
    // 创建或更新节点
    const nodeId = `memory_${memory.id}`;
    const existingNodeIndex = this.knowledgeGraph.nodes.findIndex(n => n.id === nodeId);
    
    if (existingNodeIndex === -1) {
      this.knowledgeGraph.nodes.push({
        id: nodeId,
        type: memory.type,
        content: JSON.stringify(memory.content).substring(0, 200),
        weight: memory.metadata.confidence,
        metadata: {
          source: memory.metadata.source,
          created: memory.metadata.created
        }
      });
    } else {
      this.knowledgeGraph.nodes[existingNodeIndex].weight = memory.metadata.confidence;
    }

    // 创建关系边
    for (const relatedId of memory.metadata.relationships) {
      const edgeExists = this.knowledgeGraph.edges.some(e => 
        e.source === nodeId && e.target === relatedId
      );
      
      if (!edgeExists) {
        this.knowledgeGraph.edges.push({
          source: nodeId,
          target: relatedId,
          type: 'related',
          strength: 0.5
        });
      }
    }
  }

  /**
   * 遍历关系链
   */
  private async traverseRelationships(
    memory: Memory, 
    chain: Memory[], 
    visited: Set<string>, 
    maxDepth: number
  ): Promise<void> {
    if (chain.length >= maxDepth) return;
    
    for (const relatedId of memory.metadata.relationships) {
      if (visited.has(relatedId)) continue;
      
      const relatedMemory = this.memories.get(relatedId);
      if (relatedMemory) {
        chain.push(relatedMemory);
        visited.add(relatedId);
        
        await this.traverseRelationships(relatedMemory, chain, visited, maxDepth);
      }
    }
  }

  /**
   * 计算相似度
   */
  private calculateSimilarity(query: string, memory: Memory): number {
    // 简化的文本相似度计算
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const contentStr = JSON.stringify(memory.content).toLowerCase();
    const contentWords = new Set(contentStr.split(/\s+/));
    
    const intersection = new Set([...queryWords].filter(x => contentWords.has(x)));
    const union = new Set([...queryWords, ...contentWords]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 计算相关性
   */
  private calculateRelevance(memory: Memory, similarity: number): number {
    // 综合考虑相似度、置信度和时间因素
    const timeFactor = this.calculateTimeFactor(memory.metadata.created);
    return similarity * memory.metadata.confidence * timeFactor;
  }

  /**
   * 计算时间因子（越新的记忆权重越高）
   */
  private calculateTimeFactor(created: Date): number {
    const ageInDays = (Date.now() - created.getTime()) / (24 * 60 * 60 * 1000);
    return Math.max(0.1, 1 - (ageInDays / 365)); // 一年内线性衰减
  }

  /**
   * 检查标签匹配
   */
  private hasMatchingTags(memory: Memory, requiredTags: string[]): boolean {
    return requiredTags.every(tag => memory.metadata.tags.includes(tag));
  }

  /**
   * 生成记忆ID
   */
  private generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 转换为YAML
   */
  private convertToYAML(data: any): string {
    // 简化的YAML转换
    return JSON.stringify(data, null, 2).replace(/"([^"]+)":/g, '$1:');
  }

  /**
   * 解析YAML
   */
  private parseYAML(yaml: string): any {
    // 简化的YAML解析
    try {
      return JSON.parse(yaml.replace(/(\w+):/g, '"$1":'));
    } catch {
      return {};
    }
  }

  /**
   * 获取存储配置
   */
  getConfig(): MemoryStoreConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<MemoryStoreConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log('[MemoryStore] 配置已更新');
  }

  /**
   * 获取知识图谱
   */
  getKnowledgeGraph(): KnowledgeGraph {
    return { ...this.knowledgeGraph };
  }
}

// 导出单例实例
export const memoryStore = new MemoryStore();

export default MemoryStore;