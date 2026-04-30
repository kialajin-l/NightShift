/**
 * Level1 通信协议类型定义
 * JSON-RPC 2.0 over WebSocket
 */
/**
 * JSON-RPC 2.0 基础消息接口
 */
export interface JsonRpcMessage {
    jsonrpc: '2.0';
    id: string;
}
/**
 * JSON-RPC 请求消息
 */
export interface JsonRpcRequest extends JsonRpcMessage {
    method: string;
    params?: JsonRpcParams;
}
/**
 * JSON-RPC 响应消息
 */
export interface JsonRpcResponse extends JsonRpcMessage {
    result?: any;
    error?: JsonRpcError;
}
/**
 * JSON-RPC 错误对象
 */
export interface JsonRpcError {
    code: number;
    message: string;
    data?: any;
}
/**
 * JSON-RPC 参数
 */
export interface JsonRpcParams {
    from: string;
    to: string;
    payload: any;
    timestamp: number;
    signature?: string;
}
/**
 * 结构化数据负载
 */
export interface StructuredPayload {
    file?: FileOperation;
    code?: CodeStructure;
    types?: TypeDefinitions;
    functions?: FunctionSignatures;
    metadata?: PayloadMetadata;
}
/**
 * 文件操作
 */
export interface FileOperation {
    path: string;
    operation: FileOperationType;
    content?: string;
    hash?: string;
    lock?: FileLockInfo;
}
/**
 * 文件操作类型
 */
export type FileOperationType = 'create' | 'read' | 'update' | 'delete' | 'lock' | 'unlock';
/**
 * 文件锁信息
 */
export interface FileLockInfo {
    owner: string;
    acquiredAt: number;
    timeout: number;
    expiresAt: number;
}
/**
 * 代码结构
 */
export interface CodeStructure {
    exports: string[];
    imports: ImportStatement[];
    classes: ClassDefinition[];
    interfaces: InterfaceDefinition[];
    functions: FunctionDefinition[];
}
/**
 * 导入语句
 */
export interface ImportStatement {
    source: string;
    specifiers: ImportSpecifier[];
    isTypeOnly?: boolean;
}
export interface ImportSpecifier {
    name: string;
    alias?: string;
    isDefault?: boolean;
}
/**
 * 类定义
 */
export interface ClassDefinition {
    name: string;
    extends?: string;
    implements: string[];
    properties: PropertyDefinition[];
    methods: MethodDefinition[];
    access: AccessModifier;
}
/**
 * 接口定义
 */
export interface InterfaceDefinition {
    name: string;
    extends: string[];
    properties: PropertyDefinition[];
    methods: MethodDefinition[];
}
/**
 * 函数定义
 */
export interface FunctionDefinition {
    name: string;
    parameters: ParameterDefinition[];
    returnType: string;
    isAsync: boolean;
    access: AccessModifier;
}
/**
 * 属性定义
 */
export interface PropertyDefinition {
    name: string;
    type: string;
    defaultValue?: string;
    access: AccessModifier;
    isOptional?: boolean;
    isReadonly?: boolean;
}
/**
 * 方法定义
 */
export interface MethodDefinition {
    name: string;
    parameters: ParameterDefinition[];
    returnType: string;
    access: AccessModifier;
    isAsync: boolean;
    isStatic?: boolean;
}
/**
 * 参数定义
 */
export interface ParameterDefinition {
    name: string;
    type: string;
    defaultValue?: string;
    isOptional?: boolean;
    isRest?: boolean;
}
/**
 * 访问修饰符
 */
export type AccessModifier = 'public' | 'private' | 'protected';
/**
 * 类型定义
 */
export interface TypeDefinitions {
    types: TypeDefinition[];
    generics: GenericDefinition[];
    unions: UnionType[];
    intersections: IntersectionType[];
}
/**
 * 类型定义
 */
export interface TypeDefinition {
    name: string;
    definition: string;
    isExported: boolean;
}
/**
 * 泛型定义
 */
export interface GenericDefinition {
    name: string;
    constraint?: string;
    defaultType?: string;
}
/**
 * 联合类型
 */
export interface UnionType {
    name: string;
    types: string[];
}
/**
 * 交叉类型
 */
export interface IntersectionType {
    name: string;
    types: string[];
}
/**
 * 函数签名
 */
export interface FunctionSignatures {
    functions: FunctionSignature[];
}
/**
 * 函数签名
 */
export interface FunctionSignature {
    name: string;
    parameters: ParameterSignature[];
    returnType: string;
    isAsync: boolean;
    isExported: boolean;
}
/**
 * 参数签名
 */
export interface ParameterSignature {
    name: string;
    type: string;
    isOptional: boolean;
}
/**
 * 负载元数据
 */
export interface PayloadMetadata {
    version: string;
    agent: string;
    project: string;
    timestamp: number;
    checksum: string;
}
/**
 * 协议方法枚举
 */
export declare enum ProtocolMethods {
    FILE_CREATE = "file_create",
    FILE_READ = "file_read",
    FILE_UPDATE = "file_update",
    FILE_DELETE = "file_delete",
    FILE_LOCK = "file_lock",
    FILE_UNLOCK = "file_unlock",
    SCHEMA_UPDATE = "schema_update",
    TYPE_DEFINITION = "type_definition",
    FUNCTION_SIGNATURE = "function_signature",
    AGENT_STATUS = "agent_status",
    TASK_PROGRESS = "task_progress",
    ERROR_REPORT = "error_report",
    COORDINATION_REQUEST = "coordination_request",
    COORDINATION_RESPONSE = "coordination_response",
    CONFLICT_RESOLUTION = "conflict_resolution"
}
/**
 * 协议错误码
 */
export declare enum ProtocolErrorCodes {
    PARSE_ERROR = -32700,
    INVALID_REQUEST = -32600,
    METHOD_NOT_FOUND = -32601,
    INVALID_PARAMS = -32602,
    INTERNAL_ERROR = -32603,
    FILE_LOCKED = -32000,
    FILE_NOT_FOUND = -32001,
    PERMISSION_DENIED = -32002,
    TIMEOUT = -32003,
    NETWORK_ERROR = -32004,
    VERSION_MISMATCH = -32005
}
/**
 * 通信配置
 */
export interface CommunicationConfig {
    websocket: {
        url: string;
        reconnectAttempts: number;
        reconnectDelay: number;
        heartbeatInterval: number;
        timeout: number;
    };
    fileLock: {
        defaultTimeout: number;
        maxLockTime: number;
        cleanupInterval: number;
    };
    retry: {
        maxAttempts: number;
        baseDelay: number;
        maxDelay: number;
        backoffMultiplier: number;
    };
    serialization: {
        maxMessageSize: number;
        compressThreshold: number;
        enableCompression: boolean;
    };
}
/**
 * 通信状态
 */
export interface CommunicationState {
    isConnected: boolean;
    lastMessageTime: number;
    pendingRequests: Map<string, PendingRequest>;
    activeLocks: Map<string, FileLockInfo>;
    messageQueue: MessageQueueItem[];
}
/**
 * 待处理请求
 */
export interface PendingRequest {
    request: JsonRpcRequest;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeoutId?: NodeJS.Timeout;
    retryCount: number;
}
/**
 * 消息队列项
 */
export interface MessageQueueItem {
    message: JsonRpcRequest;
    priority: MessagePriority;
    timestamp: number;
    attempts: number;
}
/**
 * 消息优先级
 */
export declare enum MessagePriority {
    HIGH = 3,// 高优先级（文件锁、错误报告）
    MEDIUM = 2,// 中优先级（状态同步）
    LOW = 1
}
/**
 * 通信统计
 */
export interface CommunicationStats {
    messagesSent: number;
    messagesReceived: number;
    bytesSent: number;
    bytesReceived: number;
    errors: number;
    retries: number;
    averageLatency: number;
}
/**
 * 事件类型
 */
export declare enum CommunicationEvents {
    CONNECTED = "connected",
    DISCONNECTED = "disconnected",
    MESSAGE_SENT = "message_sent",
    MESSAGE_RECEIVED = "message_received",
    ERROR = "error",
    FILE_LOCK_ACQUIRED = "file_lock_acquired",
    FILE_LOCK_RELEASED = "file_lock_released"
}
/**
 * 通信事件
 */
export interface CommunicationEvent {
    type: CommunicationEvents;
    timestamp: number;
    data?: any;
}
/**
 * 文件锁管理器接口
 */
export interface FileLockManager {
    acquireLock(filePath: string, owner: string, timeout?: number): Promise<FileLockInfo>;
    releaseLock(filePath: string, owner: string): Promise<boolean>;
    isLocked(filePath: string): boolean;
    getLockInfo(filePath: string): FileLockInfo | null;
    cleanupExpiredLocks(): void;
}
/**
 * 消息序列化器接口
 */
export interface MessageSerializer {
    serialize(message: JsonRpcRequest): string;
    deserialize(data: string): JsonRpcMessage;
    validate(message: JsonRpcMessage): ValidationResult;
}
/**
 * 验证结果
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * WebSocket 传输层接口
 */
export interface WebSocketTransport {
    connect(url: string): Promise<void>;
    disconnect(): void;
    send(message: string): void;
    isConnected(): boolean;
    onMessage(callback: (data: string) => void): void;
    onError(callback: (error: Error) => void): void;
    onClose(callback: () => void): void;
}
/**
 * 重试管理器接口
 */
export interface RetryManager {
    execute<T>(operation: () => Promise<T>, context?: RetryContext): Promise<T>;
    shouldRetry(error: Error, attempt: number): boolean;
    getDelay(attempt: number): number;
}
/**
 * 重试上下文
 */
export interface RetryContext {
    operation: string;
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
}
/**
 * 结构化数据交换器接口
 */
export interface StructuredDataExchanger {
    extractCodeStructure(code: string): CodeStructure;
    extractTypeDefinitions(code: string): TypeDefinitions;
    extractFunctionSignatures(code: string): FunctionSignatures;
    generateSchemaUpdate(fromFile: string, toFile: string): StructuredPayload;
    validateSchemaCompatibility(schema1: CodeStructure, schema2: CodeStructure): CompatibilityResult;
}
/**
 * 兼容性检查结果
 */
export interface CompatibilityResult {
    isCompatible: boolean;
    breakingChanges: BreakingChange[];
    warnings: string[];
}
/**
 * 破坏性变更
 */
export interface BreakingChange {
    type: 'function_removed' | 'parameter_changed' | 'return_type_changed';
    description: string;
    severity: 'high' | 'medium' | 'low';
}
//# sourceMappingURL=level1-protocol.d.ts.map