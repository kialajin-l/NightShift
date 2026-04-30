/**
 * RuleForge 核心类型定义
 */
// 错误类型
export class RuleForgeError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'RuleForgeError';
    }
}
//# sourceMappingURL=types.js.map