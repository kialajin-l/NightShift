/**
 * 消息序列化器
 * 负责 JSON-RPC 消息的序列化、反序列化和验证
 */

import {
  JsonRpcMessage,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  MessageSerializer,
  ValidationResult,
  ProtocolErrorCodes
} from './types/level1-protocol.js';

/**
 * 消息序列化器实现
 */
export class JsonRpcSerializer implements MessageSerializer {
  
  /**
   * 序列化 JSON-RPC 消息
   */
  serialize(message: JsonRpcRequest): string {
    try {
      // 验证消息格式
      const validation = this.validate(message);
      if (!validation.isValid) {
        throw new Error(`消息验证失败: ${validation.errors.join(', ')}`);
      }
      
      // 序列化为 JSON 字符串
      return JSON.stringify(message, this.createReplacer(), 2);
      
    } catch (error) {
      throw new Error(`消息序列化失败: ${error.message}`);
    }
  }

  /**
   * 反序列化 JSON-RPC 消息
   */
  deserialize(data: string): JsonRpcMessage {
    try {
      // 解析 JSON 字符串
      const message = JSON.parse(data, this.createReviver()) as JsonRpcMessage;
      
      // 验证消息格式
      const validation = this.validate(message);
      if (!validation.isValid) {
        throw new Error(`消息验证失败: ${validation.errors.join(', ')}`);
      }
      
      return message;
      
    } catch (error) {
      // 返回解析错误响应
      const errorResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: this.generateMessageId(),
        error: {
          code: ProtocolErrorCodes.PARSE_ERROR,
          message: '解析错误',
          data: error.message
        }
      };
      
      return errorResponse;
    }
  }

  /**
   * 验证 JSON-RPC 消息
   */
  validate(message: JsonRpcMessage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查 JSON-RPC 版本
    if (message.jsonrpc !== '2.0') {
      errors.push('jsonrpc 版本必须为 "2.0"');
    }

    // 检查消息 ID
    if (!message.id || typeof message.id !== 'string') {
      errors.push('消息 ID 必须为非空字符串');
    }

    // 检查请求消息
    if (this.isRequest(message)) {
      const request = message as JsonRpcRequest;
      
      if (!request.method || typeof request.method !== 'string') {
        errors.push('method 必须为非空字符串');
      }
      
      if (request.params && typeof request.params !== 'object') {
        errors.push('params 必须为对象');
      }
      
      // 验证参数结构
      if (request.params) {
        const paramErrors = this.validateParams(request.params);
        errors.push(...paramErrors);
      }
    }

    // 检查响应消息
    if (this.isResponse(message)) {
      const response = message as JsonRpcResponse;
      
      if (response.result === undefined && response.error === undefined) {
        errors.push('响应必须包含 result 或 error');
      }
      
      if (response.result !== undefined && response.error !== undefined) {
        errors.push('响应不能同时包含 result 和 error');
      }
      
      // 验证错误对象
      if (response.error) {
        const errorErrors = this.validateError(response.error);
        errors.push(...errorErrors);
      }
    }

    // 检查未知字段
    const allowedFields = ['jsonrpc', 'id', 'method', 'params', 'result', 'error'];
    const messageFields = Object.keys(message);
    const unknownFields = messageFields.filter(field => !allowedFields.includes(field));
    
    if (unknownFields.length > 0) {
      warnings.push(`发现未知字段: ${unknownFields.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证参数结构
   */
  private validateParams(params: any): string[] {
    const errors: string[] = [];
    
    if (typeof params !== 'object' || params === null) {
      return ['params 必须为对象'];
    }
    
    // 检查必需字段
    const requiredFields = ['from', 'to', 'payload', 'timestamp'];
    for (const field of requiredFields) {
      if (params[field] === undefined) {
        errors.push(`params.${field} 为必需字段`);
      }
    }
    
    // 检查字段类型
    if (params.from && typeof params.from !== 'string') {
      errors.push('params.from 必须为字符串');
    }
    
    if (params.to && typeof params.to !== 'string') {
      errors.push('params.to 必须为字符串');
    }
    
    if (params.timestamp && typeof params.timestamp !== 'number') {
      errors.push('params.timestamp 必须为数字');
    }
    
    // 检查时间戳合理性
    if (params.timestamp) {
      const now = Date.now();
      const timestamp = params.timestamp;
      
      // 时间戳不能是未来时间（允许 5 秒的时钟偏差）
      if (timestamp > now + 5000) {
        warnings.push('时间戳似乎来自未来');
      }
      
      // 时间戳不能太旧（超过 1 小时）
      if (timestamp < now - 3600000) {
        warnings.push('时间戳似乎太旧');
      }
    }
    
    return errors;
  }

  /**
   * 验证错误对象
   */
  private validateError(error: JsonRpcError): string[] {
    const errors: string[] = [];
    
    if (typeof error.code !== 'number') {
      errors.push('error.code 必须为数字');
    }
    
    if (!error.message || typeof error.message !== 'string') {
      errors.push('error.message 必须为非空字符串');
    }
    
    // 检查错误码范围
    if (error.code >= -32099 && error.code <= -32000) {
      // 服务器错误码，允许
    } else if (error.code >= -32768 && error.code <= -32000) {
      // 保留错误码范围
      errors.push('错误码在保留范围内');
    }
    
    return errors;
  }

  /**
   * 检查是否为请求消息
   */
  private isRequest(message: JsonRpcMessage): message is JsonRpcRequest {
    return 'method' in message;
  }

  /**
   * 检查是否为响应消息
   */
  private isResponse(message: JsonRpcMessage): message is JsonRpcResponse {
    return 'result' in message || 'error' in message;
  }

  /**
   * 创建 JSON 序列化替换器
   */
  private createReplacer(): (key: string, value: any) => any {
    return (key: string, value: any) => {
      // 处理特殊类型
      if (value instanceof Date) {
        return value.toISOString();
      }
      
      if (value instanceof Map) {
        return Object.fromEntries(value);
      }
      
      if (value instanceof Set) {
        return Array.from(value);
      }
      
      // 处理 undefined
      if (value === undefined) {
        return null;
      }
      
      return value;
    };
  }

  /**
   * 创建 JSON 反序列化恢复器
   */
  private createReviver(): (key: string, value: any) => any {
    return (key: string, value: any) => {
      // 恢复特殊格式
      if (key === 'timestamp' && typeof value === 'number') {
        // 确保时间戳是合理的
        const now = Date.now();
        if (value > now + 5000 || value < now - 3600000) {
          // 使用当前时间替换不合理的时间戳
          return now;
        }
      }
      
      // 恢复 ISO 日期字符串
      if (typeof value === 'string' && this.isIsoDateString(value)) {
        return new Date(value);
      }
      
      return value;
    };
  }

  /**
   * 检查是否为 ISO 日期字符串
   */
  private isIsoDateString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value);
  }

  /**
   * 生成消息 ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建标准错误响应
   */
  createErrorResponse(id: string, code: number, message: string, data?: any): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
  }

  /**
   * 创建成功响应
   */
  createSuccessResponse(id: string, result: any): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      result
    };
  }

  /**
   * 创建请求消息
   */
  createRequest(method: string, params: any): JsonRpcRequest {
    return {
      jsonrpc: '2.0',
      id: this.generateMessageId(),
      method,
      params: {
        ...params,
        timestamp: Date.now()
      }
    };
  }

  /**
   * 压缩消息（如果启用）
   */
  compress(message: string): string {
    // 简单的压缩实现，实际项目中可以使用更复杂的算法
    // 这里使用简单的 Base64 编码作为示例
    return btoa(unescape(encodeURIComponent(message)));
  }

  /**
   * 解压缩消息
   */
  decompress(compressed: string): string {
    try {
      return decodeURIComponent(escape(atob(compressed)));
    } catch (error) {
      throw new Error(`消息解压缩失败: ${error.message}`);
    }
  }

  /**
   * 计算消息大小
   */
  getMessageSize(message: string): number {
    return new Blob([message]).size;
  }

  /**
   * 检查消息是否过大
   */
  isMessageTooLarge(message: string, maxSize: number): boolean {
    return this.getMessageSize(message) > maxSize;
  }

  /**
   * 分割大消息
   */
  splitLargeMessage(message: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    const messageSize = this.getMessageSize(message);
    
    if (messageSize <= maxChunkSize) {
      return [message];
    }
    
    // 简单的按字符分割，实际应该按语义分割
    const chunkCount = Math.ceil(message.length / (maxChunkSize / 2)); // 保守估计
    const chunkSize = Math.ceil(message.length / chunkCount);
    
    for (let i = 0; i < message.length; i += chunkSize) {
      chunks.push(message.substring(i, i + chunkSize));
    }
    
    return chunks;
  }

  /**
   * 合并分割的消息
   */
  mergeMessageChunks(chunks: string[]): string {
    return chunks.join('');
  }
}