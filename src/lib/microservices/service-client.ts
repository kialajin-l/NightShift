// NightShift 微服务客户端

import { EventBus, Event, getEventBus } from '../event-system/event-bus';
import { ErrorHandler } from '../error-handler';
import { IntegrationModule } from '../../types/integration';

/**
 * 服务端点配置
 */
export interface ServiceEndpoint {
  name: string;
  url: string;
  protocol: 'http' | 'https' | 'ws' | 'wss';
  timeout?: number;
  retryCount?: number;
  healthCheckPath?: string;
}

/**
 * 服务调用选项
 */
export interface ServiceCallOptions {
  timeout?: number;
  retryCount?: number;
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * 服务响应
 */
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  metadata?: {
    responseTime: number;
    serviceName: string;
    timestamp: string;
  };
}

/**
 * 服务健康状态
 */
export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  lastCheck: string;
  responseTime?: number;
  details?: any;
  error?: string;
}

/**
 * 服务客户端配置
 */
export interface ServiceClientConfig {
  endpoints: ServiceEndpoint[];
  defaultTimeout?: number;
  defaultRetryCount?: number;
  enableCircuitBreaker?: boolean;
  circuitBreakerThreshold?: number;
  enableLoadBalancing?: boolean;
  loadBalancingStrategy?: 'round-robin' | 'random' | 'least-connections';
}

/**
 * 服务客户端类
 */
export class ServiceClient {
  private endpoints: Map<string, ServiceEndpoint> = new Map();
  private eventBus: EventBus;
  private config: ServiceClientConfig;
  private isInitialized = false;
  
  // 负载均衡状态
  private currentIndex: Map<string, number> = new Map();
  private serviceStats: Map<string, any> = new Map();

  constructor(config: ServiceClientConfig) {
    this.eventBus = getEventBus();
    this.config = {
      defaultTimeout: 30000,
      defaultRetryCount: 3,
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 5,
      enableLoadBalancing: true,
      loadBalancingStrategy: 'round-robin',
      ...config
    };

    // 初始化端点
    this.initializeEndpoints();
  }

  /**
   * 初始化服务客户端
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await ErrorHandler.safeExecute(async () => {
      // 健康检查所有端点
      await this.healthCheckAllEndpoints();
      
      this.isInitialized = true;
      
      console.log('微服务客户端初始化完成');
      
    }, IntegrationModule.MICROSERVICES, '微服务客户端初始化');
  }

  /**
   * 初始化端点
   */
  private initializeEndpoints(): void {
    for (const endpoint of this.config.endpoints) {
      this.endpoints.set(endpoint.name, {
        timeout: this.config.defaultTimeout,
        retryCount: this.config.defaultRetryCount,
        ...endpoint
      });
      
      // 初始化负载均衡状态
      this.currentIndex.set(endpoint.name, 0);
      this.serviceStats.set(endpoint.name, {
        requestCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        lastHealthCheck: null
      });
    }
  }

  /**
   * 调用服务方法
   */
  async callService<T = any>(
    serviceName: string,
    method: string,
    data?: any,
    options?: ServiceCallOptions
  ): Promise<ServiceResponse<T>> {
    if (!this.isInitialized) {
      throw new Error('微服务客户端未初始化');
    }

    const startTime = Date.now();
    
    try {
      // 选择端点
      const endpoint = this.selectEndpoint(serviceName);
      if (!endpoint) {
        throw new Error(`服务端点未找到: ${serviceName}`);
      }

      // 检查断路器状态
      if (this.isCircuitBreakerOpen(serviceName)) {
        throw new Error(`服务断路器已打开: ${serviceName}`);
      }

      // 构建请求
      const requestOptions = this.buildRequestOptions(endpoint, options);
      
      // 发送请求
      const response = await this.sendRequest(endpoint, method, data, requestOptions);
      
      // 更新服务统计
      this.updateServiceStats(serviceName, Date.now() - startTime, false);
      
      // 发布服务调用事件
      await this.publishServiceCallEvent(serviceName, method, 'success', Date.now() - startTime);
      
      return {
        success: true,
        data: response,
        metadata: {
          responseTime: Date.now() - startTime,
          serviceName,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      // 更新服务统计（错误）
      this.updateServiceStats(serviceName, Date.now() - startTime, true);
      
      // 发布服务调用事件（错误）
      await this.publishServiceCallEvent(serviceName, method, 'error', Date.now() - startTime, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          responseTime: Date.now() - startTime,
          serviceName,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * 选择端点（负载均衡）
   */
  private selectEndpoint(serviceName: string): ServiceEndpoint | null {
    const endpoints = Array.from(this.endpoints.values()).filter(
      endpoint => endpoint.name === serviceName
    );

    if (endpoints.length === 0) {
      return null;
    }

    if (endpoints.length === 1 || !this.config.enableLoadBalancing) {
      return endpoints[0];
    }

    // 负载均衡策略
    switch (this.config.loadBalancingStrategy) {
      case 'round-robin':
        return this.roundRobinSelection(serviceName, endpoints);
      case 'random':
        return this.randomSelection(endpoints);
      case 'least-connections':
        return this.leastConnectionsSelection(endpoints);
      default:
        return endpoints[0];
    }
  }

  /**
   * 轮询选择
   */
  private roundRobinSelection(serviceName: string, endpoints: ServiceEndpoint[]): ServiceEndpoint {
    const currentIndex = this.currentIndex.get(serviceName) || 0;
    const nextIndex = (currentIndex + 1) % endpoints.length;
    this.currentIndex.set(serviceName, nextIndex);
    
    return endpoints[currentIndex];
  }

  /**
   * 随机选择
   */
  private randomSelection(endpoints: ServiceEndpoint[]): ServiceEndpoint {
    const randomIndex = Math.floor(Math.random() * endpoints.length);
    return endpoints[randomIndex];
  }

  /**
   * 最少连接选择
   */
  private leastConnectionsSelection(endpoints: ServiceEndpoint[]): ServiceEndpoint {
    // 简化实现：选择请求数最少的端点
    return endpoints.reduce((min, endpoint) => {
      const stats = this.serviceStats.get(endpoint.name);
      const minStats = this.serviceStats.get(min.name);
      
      return (stats?.requestCount || 0) < (minStats?.requestCount || 0) ? endpoint : min;
    });
  }

  /**
   * 检查断路器状态
   */
  private isCircuitBreakerOpen(serviceName: string): boolean {
    if (!this.config.enableCircuitBreaker) {
      return false;
    }

    const stats = this.serviceStats.get(serviceName);
    if (!stats) {
      return false;
    }

    const errorRate = stats.errorCount / Math.max(stats.requestCount, 1);
    return errorRate > (this.config.circuitBreakerThreshold || 0.5);
  }

  /**
   * 构建请求选项
   */
  private buildRequestOptions(
    endpoint: ServiceEndpoint,
    options?: ServiceCallOptions
  ): RequestInit {
    const timeout = options?.timeout || endpoint.timeout || this.config.defaultTimeout || 30000;
    
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: JSON.stringify({
        method: options?.metadata?.method,
        data: options?.metadata?.data
      }),
      signal: AbortSignal.timeout(timeout)
    };
  }

  /**
   * 发送请求
   */
  private async sendRequest(
    endpoint: ServiceEndpoint,
    method: string,
    data: any,
    options: RequestInit
  ): Promise<any> {
    const retryCount = endpoint.retryCount || this.config.defaultRetryCount || 1;
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const url = `${endpoint.url}/${method}`;
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
        
      } catch (error) {
        if (attempt === retryCount) {
          throw error;
        }
        
        // 等待指数退避时间
        await this.delay(Math.pow(2, attempt) * 100);
      }
    }
    
    throw new Error('所有重试尝试都失败了');
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 更新服务统计
   */
  private updateServiceStats(serviceName: string, responseTime: number, isError: boolean): void {
    const stats = this.serviceStats.get(serviceName) || {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastHealthCheck: null
    };

    stats.requestCount++;
    
    if (isError) {
      stats.errorCount++;
    }

    // 更新平均响应时间（指数移动平均）
    const alpha = 0.1;
    stats.averageResponseTime = alpha * responseTime + (1 - alpha) * stats.averageResponseTime;

    this.serviceStats.set(serviceName, stats);
  }

  /**
   * 发布服务调用事件
   */
  private async publishServiceCallEvent(
    serviceName: string,
    method: string,
    status: 'success' | 'error',
    responseTime: number,
    error?: any
  ): Promise<void> {
    await this.eventBus.publish({
      type: 'service.call',
      timestamp: Date.now(),
      source: 'ServiceClient',
      data: {
        serviceName,
        method,
        status,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * 健康检查所有端点
   */
  private async healthCheckAllEndpoints(): Promise<void> {
    const healthChecks = Array.from(this.endpoints.values()).map(async (endpoint) => {
      try {
        const health = await this.checkEndpointHealth(endpoint);
        this.updateEndpointHealth(endpoint.name, health);
      } catch (error) {
        this.updateEndpointHealth(endpoint.name, {
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    await Promise.all(healthChecks);
  }

  /**
   * 检查端点健康状态
   */
  private async checkEndpointHealth(endpoint: ServiceEndpoint): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const healthCheckPath = endpoint.healthCheckPath || '/health';
      const url = `${endpoint.url}${healthCheckPath}`;
      
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`健康检查失败: HTTP ${response.status}`);
      }
      
      const healthData = await response.json();
      
      return {
        status: healthData.status || 'healthy',
        lastCheck: new Date().toISOString(),
        responseTime,
        details: healthData
      };
      
    } catch (error) {
      throw new Error(`健康检查失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 更新端点健康状态
   */
  private updateEndpointHealth(serviceName: string, health: ServiceHealth): void {
    const stats = this.serviceStats.get(serviceName);
    if (stats) {
      stats.lastHealthCheck = health.lastCheck;
      this.serviceStats.set(serviceName, stats);
    }
    
    // 发布健康检查事件
    this.eventBus.publish({
      type: 'service.health',
      timestamp: Date.now(),
      source: 'ServiceClient',
      data: {
        serviceName,
        ...health
      }
    });
  }

  /**
   * 获取服务健康状态
   */
  getServiceHealth(serviceName: string): ServiceHealth | null {
    const stats = this.serviceStats.get(serviceName);
    if (!stats) {
      return null;
    }

    return {
      status: this.isCircuitBreakerOpen(serviceName) ? 'unhealthy' : 'healthy',
      lastCheck: stats.lastHealthCheck || new Date().toISOString(),
      responseTime: stats.averageResponseTime,
      details: stats
    };
  }

  /**
   * 获取所有服务健康状态
   */
  getAllServiceHealth(): Record<string, ServiceHealth> {
    const result: Record<string, ServiceHealth> = {};
    
    for (const serviceName of this.endpoints.keys()) {
      const health = this.getServiceHealth(serviceName);
      if (health) {
        result[serviceName] = health;
      }
    }
    
    return result;
  }

  /**
   * 添加服务端点
   */
  addEndpoint(endpoint: ServiceEndpoint): void {
    this.endpoints.set(endpoint.name, {
      timeout: this.config.defaultTimeout,
      retryCount: this.config.defaultRetryCount,
      ...endpoint
    });
    
    this.currentIndex.set(endpoint.name, 0);
    this.serviceStats.set(endpoint.name, {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastHealthCheck: null
    });
  }

  /**
   * 移除服务端点
   */
  removeEndpoint(serviceName: string): boolean {
    const existed = this.endpoints.delete(serviceName);
    this.currentIndex.delete(serviceName);
    this.serviceStats.delete(serviceName);
    
    return existed;
  }

  /**
   * 销毁服务客户端
   */
  async destroy(): Promise<void> {
    this.endpoints.clear();
    this.currentIndex.clear();
    this.serviceStats.clear();
    this.isInitialized = false;
    
    console.log('微服务客户端销毁完成');
  }
}

/**
 * 创建服务客户端工厂函数
 */
export function createServiceClient(config: ServiceClientConfig): ServiceClient {
  return new ServiceClient(config);
}