/**
 * 消息序列化器
 * 负责 JSON-RPC 消息的序列化、反序列化和验证
 */
import { JsonRpcMessage, JsonRpcRequest, JsonRpcResponse, MessageSerializer, ValidationResult } from './types/level1-protocol.js';
/**
 * 消息序列化器实现
 */
export declare class JsonRpcSerializer implements MessageSerializer {
    /**
     * 序列化 JSON-RPC 消息
     */
    serialize(message: JsonRpcRequest): string;
    /**
     * 反序列化 JSON-RPC 消息
     */
    deserialize(data: string): JsonRpcMessage;
    /**
     * 验证 JSON-RPC 消息
     */
    validate(message: JsonRpcMessage): ValidationResult;
    /**
     * 验证参数结构
     */
    private validateParams;
    /**
     * 验证错误对象
     */
    private validateError;
    /**
     * 检查是否为请求消息
     */
    private isRequest;
    /**
     * 检查是否为响应消息
     */
    private isResponse;
    /**
     * 创建 JSON 序列化替换器
     */
    private createReplacer;
    /**
     * 创建 JSON 反序列化恢复器
     */
    private createReviver;
    /**
     * 检查是否为 ISO 日期字符串
     */
    private isIsoDateString;
    /**
     * 生成消息 ID
     */
    private generateMessageId;
    /**
     * 创建标准错误响应
     */
    createErrorResponse(id: string, code: number, message: string, data?: any): JsonRpcResponse;
    /**
     * 创建成功响应
     */
    createSuccessResponse(id: string, result: any): JsonRpcResponse;
    /**
     * 创建请求消息
     */
    createRequest(method: string, params: any): JsonRpcRequest;
    /**
     * 压缩消息（如果启用）
     */
    compress(message: string): string;
    /**
     * 解压缩消息
     */
    decompress(compressed: string): string;
    /**
     * 计算消息大小
     */
    getMessageSize(message: string): number;
    /**
     * 检查消息是否过大
     */
    isMessageTooLarge(message: string, maxSize: number): boolean;
    /**
     * 分割大消息
     */
    splitLargeMessage(message: string, maxChunkSize: number): string[];
    /**
     * 合并分割的消息
     */
    mergeMessageChunks(chunks: string[]): string;
}
//# sourceMappingURL=message-serializer.d.ts.map