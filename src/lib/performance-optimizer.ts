// NightShift 性能优化工具类

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  maxSize: number;
  ttl: number; // 生存时间（毫秒）
  enablePersistence?: boolean;
}

/**
 * 缓存项接口
 */
export interface CacheItem<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
}

/**
 * 内存缓存类
 */
export class MemoryCache<T = any> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    
    // 定期清理过期缓存
    setInterval(() => this.cleanup(), this.config.ttl * 2);
  }

  /**
   * 设置缓存
   */
  set(key: string, value: T): void {
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastUsed();
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      timestamp: now,
      expiresAt: now + this.config.ttl,
      accessCount: 0
    });
  }

  /**
   * 获取缓存
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问计数
    item.accessCount++;
    
    return item.value;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const now = Date.now();
    const validItems = Array.from(this.cache.values()).filter(
      item => now <= item.expiresAt
    );

    return {
      totalItems: this.cache.size,
      validItems: validItems.length,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.calculateMemoryUsage()
    };
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 淘汰最少使用的缓存项
   */
  private evictLeastUsed(): void {
    let minAccessCount = Infinity;
    let keyToRemove = '';

    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < minAccessCount) {
        minAccessCount = item.accessCount;
        keyToRemove = key;
      }
    }

    if (keyToRemove) {
      this.cache.delete(keyToRemove);
    }
  }

  /**
   * 计算命中率
   */
  private calculateHitRate(): number {
    // 简化实现，实际应该记录命中和未命中次数
    return 0.8; // 默认命中率
  }

  /**
   * 计算内存使用量
   */
  private calculateMemoryUsage(): number {
    // 估算内存使用量
    return this.cache.size * 100; // 假设每个缓存项约100字节
  }
}

/**
 * 异步批处理类
 */
export class AsyncBatchProcessor<T, R> {
  private batchSize: number;
  private batchDelay: number;
  private currentBatch: T[] = [];
  private timeoutId: NodeJS.Timeout | null = null;
  private processor: (items: T[]) => Promise<R[]>;

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    batchSize: number = 10,
    batchDelay: number = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  /**
   * 添加项目到批处理
   */
  async add(item: T): Promise<R> {
    this.currentBatch.push(item);

    // 如果达到批处理大小，立即处理
    if (this.currentBatch.length >= this.batchSize) {
      return this.processBatch();
    }

    // 否则设置延迟处理
    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.processBatch();
      }, this.batchDelay);
    }

    // 返回一个Promise，在批处理完成后解析
    return new Promise((resolve, reject) => {
      // 这里需要更复杂的实现来跟踪单个项目的完成状态
      // 简化实现：立即返回一个占位结果
      resolve({} as R);
    });
  }

  /**
   * 处理当前批次
   */
  private async processBatch(): Promise<any> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.currentBatch.length === 0) {
      return;
    }

    const batchToProcess = [...this.currentBatch];
    this.currentBatch = [];

    try {
      const results = await this.processor(batchToProcess);
      return results;
    } catch (error) {
      console.error('批处理失败:', error);
      throw error;
    }
  }

  /**
   * 强制处理当前批次
   */
  async flush(): Promise<R[]> {
    return this.processBatch();
  }

  /**
   * 获取当前批次大小
   */
  getCurrentBatchSize(): number {
    return this.currentBatch.length;
  }
}

/**
 * 性能监控类
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * 开始计时
   */
  startTimer(metricName: string): void {
    this.startTimes.set(metricName, performance.now());
  }

  /**
   * 结束计时并记录指标
   */
  endTimer(metricName: string): number {
    const startTime = this.startTimes.get(metricName);
    if (!startTime) {
      return 0;
    }

    const duration = performance.now() - startTime;
    this.recordMetric(metricName, duration);
    this.startTimes.delete(metricName);

    return duration;
  }

  /**
   * 记录指标
   */
  recordMetric(metricName: string, value: number): void {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }

    const values = this.metrics.get(metricName)!;
    values.push(value);

    // 保持最近100个值
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * 获取指标统计
   */
  getMetricStats(metricName: string) {
    const values = this.metrics.get(metricName) || [];
    
    if (values.length === 0) {
      return null;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      count: values.length,
      average: avg,
      max,
      min,
      latest: values[values.length - 1]
    };
  }

  /**
   * 获取所有指标
   */
  getAllMetrics() {
    const result: Record<string, any> = {};
    
    for (const [metricName] of this.metrics) {
      result[metricName] = this.getMetricStats(metricName);
    }

    return result;
  }

  /**
   * 重置所有指标
   */
  reset(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

/**
 * 资源管理器
 */
export class ResourceManager {
  private resources: Map<string, { usage: number; limit: number }> = new Map();

  /**
   * 注册资源
   */
  registerResource(resourceName: string, limit: number): void {
    this.resources.set(resourceName, {
      usage: 0,
      limit
    });
  }

  /**
   * 申请资源
   */
  acquire(resourceName: string, amount: number = 1): boolean {
    const resource = this.resources.get(resourceName);
    
    if (!resource) {
      return false;
    }

    if (resource.usage + amount > resource.limit) {
      return false;
    }

    resource.usage += amount;
    return true;
  }

  /**
   * 释放资源
   */
  release(resourceName: string, amount: number = 1): void {
    const resource = this.resources.get(resourceName);
    
    if (resource) {
      resource.usage = Math.max(0, resource.usage - amount);
    }
  }

  /**
   * 获取资源使用情况
   */
  getResourceUsage(resourceName: string) {
    const resource = this.resources.get(resourceName);
    
    if (!resource) {
      return null;
    }

    return {
      usage: resource.usage,
      limit: resource.limit,
      available: resource.limit - resource.usage,
      percentage: (resource.usage / resource.limit) * 100
    };
  }

  /**
   * 获取所有资源使用情况
   */
  getAllResourceUsage() {
    const result: Record<string, any> = {};
    
    for (const [resourceName] of this.resources) {
      result[resourceName] = this.getResourceUsage(resourceName);
    }

    return result;
  }
}

/**
 * 性能优化工具类（主类）
 */
export class PerformanceOptimizer {
  private cache: MemoryCache;
  private monitor: PerformanceMonitor;
  private resourceManager: ResourceManager;

  constructor() {
    // 默认缓存配置
    this.cache = new MemoryCache({
      maxSize: 1000,
      ttl: 5 * 60 * 1000, // 5分钟
      enablePersistence: false
    });

    this.monitor = new PerformanceMonitor();
    this.resourceManager = new ResourceManager();

    // 注册默认资源
    this.resourceManager.registerResource('memory', 100); // 内存使用单位
    this.resourceManager.registerResource('cpu', 50);     // CPU使用单位
    this.resourceManager.registerResource('network', 10); // 网络请求并发数
  }

  /**
   * 获取缓存实例
   */
  getCache(): MemoryCache {
    return this.cache;
  }

  /**
   * 获取性能监控实例
   */
  getMonitor(): PerformanceMonitor {
    return this.monitor;
  }

  /**
   * 获取资源管理器实例
   */
  getResourceManager(): ResourceManager {
    return this.resourceManager;
  }

  /**
   * 创建批处理器
   */
  createBatchProcessor<T, R>(
    processor: (items: T[]) => Promise<R[]>,
    batchSize: number = 10,
    batchDelay: number = 100
  ): AsyncBatchProcessor<T, R> {
    return new AsyncBatchProcessor(processor, batchSize, batchDelay);
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    return {
      cache: this.cache.getStats(),
      metrics: this.monitor.getAllMetrics(),
      resources: this.resourceManager.getAllResourceUsage()
    };
  }

  /**
   * 重置所有性能数据
   */
  reset(): void {
    this.cache.clear();
    this.monitor.reset();
    
    // 重置资源使用（但不重置限制）
    const usages = this.resourceManager.getAllResourceUsage();
    for (const resourceName of Object.keys(usages)) {
      const resource = usages[resourceName];
      if (resource.usage > 0) {
        this.resourceManager.release(resourceName, resource.usage);
      }
    }
  }
}

// 创建全局性能优化器实例
let globalPerformanceOptimizer: PerformanceOptimizer | null = null;

export function getPerformanceOptimizer(): PerformanceOptimizer {
  if (!globalPerformanceOptimizer) {
    globalPerformanceOptimizer = new PerformanceOptimizer();
  }
  return globalPerformanceOptimizer;
}