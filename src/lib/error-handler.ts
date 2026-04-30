// NightShift 统一错误处理机制

import { ErrorCode, IntegrationModule } from '../types/integration';

/**
 * 集成系统错误类
 */
export class IntegrationError extends Error {
  public readonly code: ErrorCode;
  public readonly module: IntegrationModule;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode,
    module: IntegrationModule,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'IntegrationError';
    this.code = code;
    this.module = module;
    this.timestamp = new Date();
    this.context = context;

    // 保持正确的原型链
    Object.setPrototypeOf(this, IntegrationError.prototype);
  }

  /**
   * 转换为可序列化的格式
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      module: this.module,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    };
  }

  /**
   * 获取错误摘要
   */
  getSummary(): string {
    return `[${this.module}] ${this.code}: ${this.message}`;
  }
}

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  /**
   * 创建模块未初始化错误
   */
  static notInitialized(module: IntegrationModule): IntegrationError {
    return new IntegrationError(
      `${module} 模块未初始化`,
      ErrorCode.NOT_INITIALIZED,
      module
    );
  }

  /**
   * 创建无效消息格式错误
   */
  static invalidMessage(message: string, module: IntegrationModule): IntegrationError {
    return new IntegrationError(
      `无效消息格式: ${message}`,
      ErrorCode.INVALID_MESSAGE,
      module,
      { messagePreview: message.substring(0, 100) }
    );
  }

  /**
   * 创建模块不可用错误
   */
  static moduleUnavailable(module: IntegrationModule, reason?: string): IntegrationError {
    return new IntegrationError(
      `${module} 模块不可用${reason ? `: ${reason}` : ''}`,
      ErrorCode.MODULE_UNAVAILABLE,
      module,
      { reason }
    );
  }

  /**
   * 创建网络错误
   */
  static networkError(module: IntegrationModule, url?: string): IntegrationError {
    return new IntegrationError(
      `网络连接错误${url ? ` (${url})` : ''}`,
      ErrorCode.NETWORK_ERROR,
      module,
      { url }
    );
  }

  /**
   * 创建超时错误
   */
  static timeoutError(module: IntegrationModule, timeoutMs?: number): IntegrationError {
    return new IntegrationError(
      `操作超时${timeoutMs ? ` (${timeoutMs}ms)` : ''}`,
      ErrorCode.TIMEOUT,
      module,
      { timeoutMs }
    );
  }

  /**
   * 创建自定义错误
   */
  static customError(
    message: string,
    code: ErrorCode,
    module: IntegrationModule,
    context?: Record<string, any>
  ): IntegrationError {
    return new IntegrationError(message, code, module, context);
  }

  /**
   * 安全执行异步操作，捕获并包装错误
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    module: IntegrationModule,
    operationName: string,
    context?: Record<string, any>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }

      // 包装原生错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new IntegrationError(
        `${operationName} 操作失败: ${errorMessage}`,
        ErrorCode.MODULE_UNAVAILABLE,
        module,
        { ...context, originalError: errorMessage }
      );
    }
  }

  /**
   * 检查错误是否可重试
   */
  static isRetryable(error: Error): boolean {
    if (error instanceof IntegrationError) {
      return [ErrorCode.NETWORK_ERROR, ErrorCode.TIMEOUT].includes(error.code);
    }
    
    // 网络错误、超时错误通常可重试
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('connection');
  }

  /**
   * 获取错误严重级别
   */
  static getSeverity(error: Error): 'low' | 'medium' | 'high' {
    if (error instanceof IntegrationError) {
      switch (error.code) {
        case ErrorCode.NOT_INITIALIZED:
        case ErrorCode.MODULE_UNAVAILABLE:
          return 'high';
        case ErrorCode.INVALID_MESSAGE:
          return 'medium';
        case ErrorCode.NETWORK_ERROR:
        case ErrorCode.TIMEOUT:
          return 'low';
        default:
          return 'medium';
      }
    }
    return 'medium';
  }

  /**
   * 记录错误到控制台
   */
  static logError(error: Error, logger?: (level: string, message: string) => void): void {
    const severity = this.getSeverity(error);
    const timestamp = new Date().toISOString();
    
    const logMessage = `[${timestamp}] [${severity.toUpperCase()}] ${error.message}`;
    
    if (logger) {
      logger(severity === 'high' ? 'error' : 'warn', logMessage);
    } else {
      console[severity === 'high' ? 'error' : 'warn'](logMessage);
    }
    
    if (error.stack && severity === 'high') {
      console.error('Stack trace:', error.stack);
    }
  }
}

/**
 * 错误重试机制
 */
export class RetryManager {
  /**
   * 带重试的执行
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    module: IntegrationModule,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // 检查是否可重试
        if (!ErrorHandler.isRetryable(error as Error) || attempt === maxRetries) {
          break;
        }
        
        // 计算延迟时间（指数退避）
        const delay = baseDelay * Math.pow(2, attempt - 1);
        
        console.warn(`[${module}] ${operationName} 第 ${attempt} 次尝试失败，${delay}ms 后重试...`);
        
        // 等待延迟
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // 所有重试都失败，抛出最后一个错误
    if (lastError instanceof IntegrationError) {
      throw lastError;
    }
    
    throw ErrorHandler.customError(
      `${operationName} 操作在 ${maxRetries} 次重试后仍然失败`,
      ErrorCode.MODULE_UNAVAILABLE,
      module,
      { originalError: lastError?.message }
    );
  }
}