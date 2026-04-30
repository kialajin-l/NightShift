// NightShift 服务注册与发现机制

import { EventBus, Event, getEventBus } from '../event-system/event-bus';
import { ErrorHandler } from '../error-handler';
import { IntegrationModule } from '../../types/integration';

/**
 * 服务实例信息
 */
export interface ServiceInstance {
  id: string;
  name: string;
  version: string;
  address: string;
  port: number;
  protocol: 'http' | 'https' | 'ws' | 'wss';
  metadata?: Record<string, any>;
  
  // 健康状态
  health: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: string;
    responseTime?: number;
  };
  
  // 负载信息
  load?: {
    cpu: number;
    memory: number;
    connections: number;
  };
  
  // 注册时间
  registeredAt: string;
  lastSeen: string;
}

/**
 * 服务注册信息
 */
export interface ServiceRegistration {
  name: string;
  version: string;
  address: string;
  port: number;
  protocol: 'http' | 'https' | 'ws' | 'wss';
  metadata?: Record<string, any>;
  
  // 健康检查配置
  healthCheck?: {
    path: string;
    interval: number;
    timeout: number;
  };
  
  // 服务发现配置
  discovery?: {
    tags?: string[];
    weight?: number;
    priority?: number;
  };
}

/**
 * 服务发现选项
 */
export interface ServiceDiscoveryOptions {
  tags?: string[];
  version?: string;
  healthyOnly?: boolean;
  loadBalancing?: 'round-robin' | 'random' | 'least-connections' | 'weighted';
}

/**
 * 服务注册表配置
 */
export interface ServiceRegistryConfig {
  heartbeatInterval?: number;
  healthCheckInterval?: number;
  instanceTimeout?: number;
  enableAutoDiscovery?: boolean;
  discoveryInterval?: number;
  registryUrl?: string;
}

/**
 * 服务注册表类
 */
export class ServiceRegistry {
  private services: Map<string, ServiceInstance[]> = new Map();
  private eventBus: EventBus;
  private config: ServiceRegistryConfig;
  private isInitialized = false;
  
  // 定时器
  private heartbeatTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private discoveryTimer?: NodeJS.Timeout;
  
  // 本地服务实例（如果当前进程也提供服务）
  private localInstances: Map<string, ServiceInstance> = new Map();

  constructor(config: ServiceRegistryConfig = {}) {
    this.eventBus = getEventBus();
    this.config = {
      heartbeatInterval: 30000, // 30秒
      healthCheckInterval: 60000, // 1分钟
      instanceTimeout: 120000, // 2分钟
      enableAutoDiscovery: true,
      discoveryInterval: 30000, // 30秒
      ...config
    };
  }

  /**
   * 初始化服务注册表
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await ErrorHandler.safeExecute(async () => {
      // 设置定时任务
      this.setupTimers();
      
      // 自动发现服务（如果启用）
      if (this.config.enableAutoDiscovery) {
        await this.discoverServices();
      }
      
      this.isInitialized = true;
      
      console.log('服务注册表初始化完成');
      
    }, IntegrationModule.SERVICE_REGISTRY, '服务注册表初始化');
  }

  /**
   * 设置定时器
   */
  private setupTimers(): void {
    // 心跳检测
    this.heartbeatTimer = setInterval(() => {
      this.cleanupExpiredInstances();
    }, this.config.heartbeatInterval);

    // 健康检查
    this.healthCheckTimer = setInterval(() => {
      this.healthCheckInstances();
    }, this.config.healthCheckInterval);

    // 服务发现
    if (this.config.enableAutoDiscovery) {
      this.discoveryTimer = setInterval(() => {
        this.discoverServices().catch(error => {
          console.error('自动服务发现失败:', error);
        });
      }, this.config.discoveryInterval);
    }
  }

  /**
   * 注册服务实例
   */
  async register(registration: ServiceRegistration): Promise<string> {
    await ErrorHandler.safeExecute(async () => {
      const instanceId = this.generateInstanceId();
      const now = new Date().toISOString();
      
      const instance: ServiceInstance = {
        id: instanceId,
        name: registration.name,
        version: registration.version,
        address: registration.address,
        port: registration.port,
        protocol: registration.protocol,
        metadata: registration.metadata,
        health: {
          status: 'unknown',
          lastCheck: now
        },
        registeredAt: now,
        lastSeen: now
      };
      
      // 添加到服务列表
      if (!this.services.has(registration.name)) {
        this.services.set(registration.name, []);
      }
      
      this.services.get(registration.name)!.push(instance);
      
      // 如果是本地实例，单独记录
      if (registration.address === 'localhost' || registration.address === '127.0.0.1') {
        this.localInstances.set(instanceId, instance);
      }
      
      // 发布服务注册事件
      await this.publishServiceEvent('service.registered', instance);
      
      console.log(`服务实例注册成功: ${registration.name} (${instanceId})`);
      
    }, IntegrationModule.SERVICE_REGISTRY, '注册服务实例', { serviceName: registration.name });
    
    return this.generateInstanceId();
  }

  /**
   * 注销服务实例
   */
  async unregister(instanceId: string): Promise<boolean> {
    return await ErrorHandler.safeExecute(async () => {
      let found = false;
      
      for (const [serviceName, instances] of this.services.entries()) {
        const index = instances.findIndex(instance => instance.id === instanceId);
        if (index !== -1) {
          const instance = instances[index];
          instances.splice(index, 1);
          
          // 发布服务注销事件
          await this.publishServiceEvent('service.unregistered', instance);
          
          console.log(`服务实例注销成功: ${serviceName} (${instanceId})`);
          found = true;
          break;
        }
      }
      
      // 清理本地实例记录
      this.localInstances.delete(instanceId);
      
      return found;
      
    }, IntegrationModule.SERVICE_REGISTRY, '注销服务实例', { instanceId });
  }

  /**
   * 发现服务实例
   */
  async discoverServices(): Promise<void> {
    await ErrorHandler.safeExecute(async () => {
      // 这里可以实现各种服务发现机制
      // 例如：Consul、Eureka、Zookeeper、Kubernetes等
      
      // 简化实现：扫描网络或调用注册中心API
      console.log('执行服务发现...');
      
      // 发布服务发现事件
      await this.eventBus.publish({
        type: 'service.discovery.completed',
        timestamp: Date.now(),
        source: 'ServiceRegistry',
        data: {
          discoveredServices: Array.from(this.services.keys()),
          totalInstances: Array.from(this.services.values()).flat().length,
          timestamp: new Date().toISOString()
        }
      });
      
    }, IntegrationModule.SERVICE_REGISTRY, '发现服务');
  }

  /**
   * 查找服务实例
   */
  findService(serviceName: string, options?: ServiceDiscoveryOptions): ServiceInstance | null {
    const instances = this.services.get(serviceName);
    if (!instances || instances.length === 0) {
      return null;
    }

    // 过滤实例
    let filteredInstances = instances;
    
    if (options?.healthyOnly) {
      filteredInstances = filteredInstances.filter(instance => 
        instance.health.status === 'healthy'
      );
    }
    
    if (options?.version) {
      filteredInstances = filteredInstances.filter(instance => 
        instance.version === options.version
      );
    }
    
    if (options?.tags && options.tags.length > 0) {
      filteredInstances = filteredInstances.filter(instance => {
        const instanceTags = instance.metadata?.tags || [];
        return options.tags!.every(tag => instanceTags.includes(tag));
      });
    }
    
    if (filteredInstances.length === 0) {
      return null;
    }
    
    // 负载均衡策略
    return this.selectInstance(filteredInstances, options?.loadBalancing || 'round-robin');
  }

  /**
   * 选择服务实例（负载均衡）
   */
  private selectInstance(instances: ServiceInstance[], strategy: string): ServiceInstance {
    switch (strategy) {
      case 'random':
        return instances[Math.floor(Math.random() * instances.length)];
        
      case 'least-connections':
        return instances.reduce((min, instance) => {
          const minConnections = min.load?.connections || 0;
          const instanceConnections = instance.load?.connections || 0;
          return instanceConnections < minConnections ? instance : min;
        });
        
      case 'weighted':
        // 加权随机选择
        const totalWeight = instances.reduce((sum, instance) => 
          sum + (instance.metadata?.weight || 1), 0
        );
        
        let random = Math.random() * totalWeight;
        for (const instance of instances) {
          random -= instance.metadata?.weight || 1;
          if (random <= 0) {
            return instance;
          }
        }
        return instances[0];
        
      case 'round-robin':
      default:
        // 简单的轮询（基于最后使用时间）
        return instances.reduce((latest, instance) => {
          return new Date(instance.lastSeen) < new Date(latest.lastSeen) ? instance : latest;
        });
    }
  }

  /**
   * 获取所有服务实例
   */
  getAllInstances(serviceName?: string): ServiceInstance[] {
    if (serviceName) {
      return this.services.get(serviceName) || [];
    }
    
    return Array.from(this.services.values()).flat();
  }

  /**
   * 获取服务统计信息
   */
  getServiceStats() {
    const stats: Record<string, any> = {};
    
    for (const [serviceName, instances] of this.services.entries()) {
      const healthyInstances = instances.filter(i => i.health.status === 'healthy');
      const unhealthyInstances = instances.filter(i => i.health.status === 'unhealthy');
      
      stats[serviceName] = {
        totalInstances: instances.length,
        healthyInstances: healthyInstances.length,
        unhealthyInstances: unhealthyInstances.length,
        averageResponseTime: instances.reduce((sum, i) => 
          sum + (i.health.responseTime || 0), 0
        ) / instances.length
      };
    }
    
    return {
      totalServices: this.services.size,
      totalInstances: Array.from(this.services.values()).flat().length,
      services: stats
    };
  }

  /**
   * 清理过期实例
   */
  private cleanupExpiredInstances(): void {
    const now = Date.now();
    const timeout = this.config.instanceTimeout || 120000;
    
    for (const [serviceName, instances] of this.services.entries()) {
      const activeInstances = instances.filter(instance => {
        const lastSeen = new Date(instance.lastSeen).getTime();
        return now - lastSeen < timeout;
      });
      
      const expiredCount = instances.length - activeInstances.length;
      if (expiredCount > 0) {
        this.services.set(serviceName, activeInstances);
        console.log(`清理了 ${expiredCount} 个过期的 ${serviceName} 服务实例`);
      }
    }
  }

  /**
   * 健康检查实例
   */
  private async healthCheckInstances(): Promise<void> {
    for (const instances of this.services.values()) {
      for (const instance of instances) {
        await this.checkInstanceHealth(instance);
      }
    }
  }

  /**
   * 检查实例健康状态
   */
  private async checkInstanceHealth(instance: ServiceInstance): Promise<void> {
    try {
      const healthCheckUrl = `${instance.protocol}://${instance.address}:${instance.port}/health`;
      const startTime = Date.now();
      
      const response = await fetch(healthCheckUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const healthData = await response.json();
        
        instance.health = {
          status: healthData.status || 'healthy',
          lastCheck: new Date().toISOString(),
          responseTime
        };
        
        instance.lastSeen = new Date().toISOString();
        
      } else {
        instance.health = {
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          responseTime
        };
      }
      
    } catch (error) {
      instance.health = {
        status: 'unhealthy',
        lastCheck: new Date().toISOString()
      };
      
      console.warn(`健康检查失败: ${instance.name} (${instance.id})`, error);
    }
  }

  /**
   * 发布服务事件
   */
  private async publishServiceEvent(eventType: string, instance: ServiceInstance): Promise<void> {
    await this.eventBus.publish({
      type: eventType,
      timestamp: Date.now(),
      source: 'ServiceRegistry',
      data: {
        instance,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * 生成实例ID
   */
  private generateInstanceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 更新实例最后活跃时间
   */
  async updateInstanceLastSeen(instanceId: string): Promise<boolean> {
    for (const instances of this.services.values()) {
      const instance = instances.find(i => i.id === instanceId);
      if (instance) {
        instance.lastSeen = new Date().toISOString();
        return true;
      }
    }
    return false;
  }

  /**
   * 获取本地服务实例
   */
  getLocalInstances(): ServiceInstance[] {
    return Array.from(this.localInstances.values());
  }

  /**
   * 销毁服务注册表
   */
  async destroy(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
    }
    
    this.services.clear();
    this.localInstances.clear();
    this.isInitialized = false;
    
    console.log('服务注册表销毁完成');
  }
}

/**
 * 创建服务注册表工厂函数
 */
export function createServiceRegistry(config?: ServiceRegistryConfig): ServiceRegistry {
  return new ServiceRegistry(config);
}