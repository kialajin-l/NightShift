/**
 * 模型路由系统类型定义
 */
/**
 * 路由错误类
 */
export class RouterError extends Error {
    type;
    details;
    constructor(type, message, details) {
        super(message);
        this.type = type;
        this.details = details;
        this.name = 'RouterError';
    }
}
//# sourceMappingURL=model-router.js.map