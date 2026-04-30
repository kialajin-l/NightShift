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
  from: string;      // 发送方标识
  to: string;        // 接收方标识
  payload: any;      // 消息负载
  timestamp: number; // 时间戳
  signature?: string; // 数字签名（可选）
}

/**
 * 结构化数据负载
 */
export interface StructuredPayload {
  // 文件操作相关
  file?: FileOperation;
  
  // 代码结构相关
  code?: CodeStructure;
  
  // 类型定义相关
  types?: TypeDefinitions;
  
  // 函数签名相关
  functions?: FunctionSignatures;
  
  // 元数据
  metadata?: PayloadMetadata;
}

/**
 * 文件操作
 */
export interface FileOperation {
  path: string;                    // 文件路径
  operation: FileOperationType;    // 操作类型
  content?: string;                // 文件内容（创建/修改时）
  hash?: string;                   // 文件哈希（sha256）
  lock?: FileLockInfo;             // 文件锁信息
}

/**
 * 文件操作类型
 */
export type FileOperationType = 
  | 'create'     // 创建文件
  | 'read'       // 读取文件
  | 'update'     // 更新文件
  | 'delete'     // 删除文件
  | 'lock'       // 锁定文件
  | 'unlock';    // 解锁文件

/**
 * 文件锁信息
 */
export interface FileLockInfo {
  owner: string;           // 锁持有者
  acquiredAt: number;      // 获取时间戳
  timeout: number;         // 超时时间（毫秒）
  expiresAt: number;       // 过期时间戳
}

/**
 * 代码结构
 */
export interface CodeStructure {
  exports: string[];               // 导出项列表
  imports: ImportStatement[];      // 导入语句
  classes: ClassDefinition[];      // 类定义
  interfaces: InterfaceDefinition[]; // 接口定义
  functions: FunctionDefinition[]; // 函数定义
}

/**
 * 导入语句
 */
export interface ImportStatement {
  source: string;          // 导入源
  specifiers: ImportSpecifier[]; // 导入项
  isTypeOnly?: boolean;    // 是否为类型导入
}

export interface ImportSpecifier {
  name: string;            // 导入名称
  alias?: string;          // 别名
  isDefault?: boolean;     // 是否为默认导入
}

/**
 * 类定义
 */
export interface ClassDefinition {
  name: string;                    // 类名
  extends?: string;                // 继承的类
  implements: string[];            // 实现的接口
  properties: PropertyDefinition[]; // 属性定义
  methods: MethodDefinition[];     // 方法定义
  access: AccessModifier;          // 访问修饰符
}

/**
 * 接口定义
 */
export interface InterfaceDefinition {
  name: string;                    // 接口名
  extends: string[];               // 继承的接口
  properties: PropertyDefinition[]; // 属性定义
  methods: MethodDefinition[];     // 方法定义
}

/**
 * 函数定义
 */
export interface FunctionDefinition {
  name: string;                    // 函数名
  parameters: ParameterDefinition[]; // 参数定义
  returnType: string;              // 返回类型
  isAsync: boolean;                // 是否为异步函数
  access: AccessModifier;          // 访问修饰符
}

/**
 * 属性定义
 */
export interface PropertyDefinition {
  name: string;                    // 属性名
  type: string;                    // 类型
  defaultValue?: string;           // 默认值
  access: AccessModifier;          // 访问修饰符
  isOptional?: boolean;            // 是否可选
  isReadonly?: boolean;            // 是否只读
}

/**
 * 方法定义
 */
export interface MethodDefinition {
  name: string;                    // 方法名
  parameters: ParameterDefinition[]; // 参数定义
  returnType: string;              // 返回类型
  access: AccessModifier;          // 访问修饰符
  isAsync: boolean;                // 是否为异步方法
  isStatic?: boolean;              // 是否为静态方法
}

/**
 * 参数定义
 */
export interface ParameterDefinition {
  name: string;                    // 参数名
  type: string;                    // 参数类型
  defaultValue?: string;           // 默认值
  isOptional?: boolean;            // 是否可选
  isRest?: boolean;                // 是否为剩余参数
}

/**
 * 访问修饰符
 */
export type AccessModifier = 'public' | 'private' | 'protected';

/**
 * 类型定义
 */
export interface TypeDefinitions {
  types: TypeDefinition[];         // 类型定义列表
  generics: GenericDefinition[];   // 泛型定义
  unions: UnionType[];             // 联合类型
  intersections: IntersectionType[]; // 交叉类型
}

/**
 * 类型定义
 */
export interface TypeDefinition {
  name: string;                    // 类型名
  definition: string;              // 类型定义
  isExported: boolean;             // 是否导出
}

/**
 * 泛型定义
 */
export interface GenericDefinition {
  name: string;                    // 泛型参数名
  constraint?: string;             // 约束类型
  defaultType?: string;            // 默认类型
}

/**
 * 联合类型
 */
export interface UnionType {
  name: string;                    // 类型名
  types: string[];                 // 联合的类型
}

/**
 * 交叉类型
 */
export interface IntersectionType {
  name: string;                    // 类型名
  types: string[];                 // 交叉的类型
}

/**
 * 函数签名
 */
export interface FunctionSignatures {
  functions: FunctionSignature[];  // 函数签名列表
}

/**
 * 函数签名
 */
export interface FunctionSignature {
  name: string;                    // 函数名
  parameters: ParameterSignature[]; // 参数签名
  returnType: string;              // 返回类型
  isAsync: boolean;                // 是否为异步函数
  isExported: boolean;             // 是否导出
}

/**
 * 参数签名
 */
export interface ParameterSignature {
  name: string;                    // 参数名
  type: string;                    // 参数类型
  isOptional: boolean;             // 是否可选
}

/**
 * 负载元数据
 */
export interface PayloadMetadata {
  version: string;                 // 协议版本
  agent: string;                   // 发送方 Agent 类型
  project: string;                 // 项目标识
  timestamp: number;               // 创建时间戳
  checksum: string;                // 数据校验和
}

/**
 * 协议方法枚举
 */
export enum ProtocolMethods {
  // 文件操作
  FILE_CREATE = 'file_create',
  FILE_READ = 'file_read',
  FILE_UPDATE = 'file_update',
  FILE_DELETE = 'file_delete',
  FILE_LOCK = 'file_lock',
  FILE_UNLOCK = 'file_unlock',
  
  // 代码同步
  SCHEMA_UPDATE = 'schema_update',
  TYPE_DEFINITION = 'type_definition',
  FUNCTION_SIGNATURE = 'function_signature',
  
  // 状态同步
  AGENT_STATUS = 'agent_status',
  TASK_PROGRESS = 'task_progress',
  ERROR_REPORT = 'error_report',
  
  // 协调通信
  COORDINATION_REQUEST = 'coordination_request',
  COORDINATION_RESPONSE = 'coordination_response',
  CONFLICT_RESOLUTION = 'conflict_resolution'
}

/**
 * 协议错误码
 */
export enum ProtocolErrorCodes {
  // JSON-RPC 标准错误码
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  
  // 自定义错误码
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
  // WebSocket 配置
  websocket: {
    url: string;                   // WebSocket 服务器地址
    reconnectAttempts: number;     // 重连尝试次数
    reconnectDelay: number;        // 重连延迟（毫秒）
    heartbeatInterval: number;     // 心跳间隔（毫秒）
    timeout: number;               // 超时时间（毫秒）
  };
  
  // 文件锁配置
  fileLock: {
    defaultTimeout: number;        // 默认锁超时时间（毫秒）
    maxLockTime: number;           // 最大锁定时间（毫秒）
    cleanupInterval: number;       // 清理间隔（毫秒）
  };
  
  // 重试配置
  retry: {
    maxAttempts: number;           // 最大重试次数
    baseDelay: number;             // 基础延迟（毫秒）
    maxDelay: number;              // 最大延迟（毫秒）
    backoffMultiplier: number;     // 退避乘数
  };
  
  // 序列化配置
  serialization: {
    maxMessageSize: number;        // 最大消息大小（字节）
    compressThreshold: number;     // 压缩阈值（字节）
    enableCompression: boolean;    // 是否启用压缩
  };
}

/**
 * 通信状态
 */
export interface CommunicationState {
  isConnected: boolean;            // 连接状态
  lastMessageTime: number;         // 最后消息时间
  pendingRequests: Map<string, PendingRequest>; // 待处理请求
  activeLocks: Map<string, FileLockInfo>; // 活跃文件锁
  messageQueue: MessageQueueItem[]; // 消息队列
}

/**
 * 待处理请求
 */
export interface PendingRequest {
  request: JsonRpcRequest;         // 原始请求
  resolve: (value: any) => void;   // 成功回调
  reject: (error: any) => void;    // 失败回调
  timeoutId?: NodeJS.Timeout;      // 超时计时器
  retryCount: number;              // 重试次数
}

/**
 * 消息队列项
 */
export interface MessageQueueItem {
  message: JsonRpcRequest;         // 消息内容
  priority: MessagePriority;       // 消息优先级
  timestamp: number;               // 入队时间
  attempts: number;                // 发送尝试次数
}

/**
 * 消息优先级
 */
export enum MessagePriority {
  HIGH = 3,    // 高优先级（文件锁、错误报告）
  MEDIUM = 2,  // 中优先级（状态同步）
  LOW = 1      // 低优先级（普通数据交换）
}

/**
 * 通信统计
 */
export interface CommunicationStats {
  messagesSent: number;            // 发送消息数
  messagesReceived: number;        // 接收消息数
  bytesSent: number;               // 发送字节数
  bytesReceived: number;           // 接收字节数
  errors: number;                  // 错误数
  retries: number;                 // 重试次数
  averageLatency: number;          // 平均延迟（毫秒）
}

/**
 * 事件类型
 */
export enum CommunicationEvents {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
  ERROR = 'error',
  FILE_LOCK_ACQUIRED = 'file_lock_acquired',
  FILE_LOCK_RELEASED = 'file_lock_released'
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