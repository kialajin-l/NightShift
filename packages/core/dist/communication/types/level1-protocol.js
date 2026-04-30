/**
 * Level1 通信协议类型定义
 * JSON-RPC 2.0 over WebSocket
 */
/**
 * 协议方法枚举
 */
export var ProtocolMethods;
(function (ProtocolMethods) {
    // 文件操作
    ProtocolMethods["FILE_CREATE"] = "file_create";
    ProtocolMethods["FILE_READ"] = "file_read";
    ProtocolMethods["FILE_UPDATE"] = "file_update";
    ProtocolMethods["FILE_DELETE"] = "file_delete";
    ProtocolMethods["FILE_LOCK"] = "file_lock";
    ProtocolMethods["FILE_UNLOCK"] = "file_unlock";
    // 代码同步
    ProtocolMethods["SCHEMA_UPDATE"] = "schema_update";
    ProtocolMethods["TYPE_DEFINITION"] = "type_definition";
    ProtocolMethods["FUNCTION_SIGNATURE"] = "function_signature";
    // 状态同步
    ProtocolMethods["AGENT_STATUS"] = "agent_status";
    ProtocolMethods["TASK_PROGRESS"] = "task_progress";
    ProtocolMethods["ERROR_REPORT"] = "error_report";
    // 协调通信
    ProtocolMethods["COORDINATION_REQUEST"] = "coordination_request";
    ProtocolMethods["COORDINATION_RESPONSE"] = "coordination_response";
    ProtocolMethods["CONFLICT_RESOLUTION"] = "conflict_resolution";
})(ProtocolMethods || (ProtocolMethods = {}));
/**
 * 协议错误码
 */
export var ProtocolErrorCodes;
(function (ProtocolErrorCodes) {
    // JSON-RPC 标准错误码
    ProtocolErrorCodes[ProtocolErrorCodes["PARSE_ERROR"] = -32700] = "PARSE_ERROR";
    ProtocolErrorCodes[ProtocolErrorCodes["INVALID_REQUEST"] = -32600] = "INVALID_REQUEST";
    ProtocolErrorCodes[ProtocolErrorCodes["METHOD_NOT_FOUND"] = -32601] = "METHOD_NOT_FOUND";
    ProtocolErrorCodes[ProtocolErrorCodes["INVALID_PARAMS"] = -32602] = "INVALID_PARAMS";
    ProtocolErrorCodes[ProtocolErrorCodes["INTERNAL_ERROR"] = -32603] = "INTERNAL_ERROR";
    // 自定义错误码
    ProtocolErrorCodes[ProtocolErrorCodes["FILE_LOCKED"] = -32000] = "FILE_LOCKED";
    ProtocolErrorCodes[ProtocolErrorCodes["FILE_NOT_FOUND"] = -32001] = "FILE_NOT_FOUND";
    ProtocolErrorCodes[ProtocolErrorCodes["PERMISSION_DENIED"] = -32002] = "PERMISSION_DENIED";
    ProtocolErrorCodes[ProtocolErrorCodes["TIMEOUT"] = -32003] = "TIMEOUT";
    ProtocolErrorCodes[ProtocolErrorCodes["NETWORK_ERROR"] = -32004] = "NETWORK_ERROR";
    ProtocolErrorCodes[ProtocolErrorCodes["VERSION_MISMATCH"] = -32005] = "VERSION_MISMATCH";
})(ProtocolErrorCodes || (ProtocolErrorCodes = {}));
/**
 * 消息优先级
 */
export var MessagePriority;
(function (MessagePriority) {
    MessagePriority[MessagePriority["HIGH"] = 3] = "HIGH";
    MessagePriority[MessagePriority["MEDIUM"] = 2] = "MEDIUM";
    MessagePriority[MessagePriority["LOW"] = 1] = "LOW"; // 低优先级（普通数据交换）
})(MessagePriority || (MessagePriority = {}));
/**
 * 事件类型
 */
export var CommunicationEvents;
(function (CommunicationEvents) {
    CommunicationEvents["CONNECTED"] = "connected";
    CommunicationEvents["DISCONNECTED"] = "disconnected";
    CommunicationEvents["MESSAGE_SENT"] = "message_sent";
    CommunicationEvents["MESSAGE_RECEIVED"] = "message_received";
    CommunicationEvents["ERROR"] = "error";
    CommunicationEvents["FILE_LOCK_ACQUIRED"] = "file_lock_acquired";
    CommunicationEvents["FILE_LOCK_RELEASED"] = "file_lock_released";
})(CommunicationEvents || (CommunicationEvents = {}));
//# sourceMappingURL=level1-protocol.js.map