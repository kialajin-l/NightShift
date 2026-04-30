"use strict";
/**
 * Agent 执行器类型定义
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentError = void 0;
/**
 * Agent 错误
 */
class AgentError extends Error {
    type;
    details;
    constructor(type, message, details) {
        super(message);
        this.type = type;
        this.details = details;
        this.name = 'AgentError';
    }
}
exports.AgentError = AgentError;
//# sourceMappingURL=agent.js.map