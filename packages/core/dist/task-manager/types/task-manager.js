/**
 * 任务管理器类型定义
 */
/**
 * 内存存储实现
 */
export class MemoryStorage {
    tasks = new Map();
    async save(task) {
        this.tasks.set(task.id, task);
    }
    async get(taskId) {
        return this.tasks.get(taskId) || null;
    }
    async getAll() {
        return Array.from(this.tasks.values());
    }
    async delete(taskId) {
        this.tasks.delete(taskId);
    }
    async clear() {
        this.tasks.clear();
    }
}
/**
 * 控制台日志记录器
 */
export class ConsoleLogger {
    name;
    constructor(name = 'TaskManager') {
        this.name = name;
    }
    debug(message, data) {
        console.debug(`[${this.name}] ${message}`, data || '');
    }
    info(message, data) {
        console.info(`[${this.name}] ${message}`, data || '');
    }
    warn(message, data) {
        console.warn(`[${this.name}] ${message}`, data || '');
    }
    error(message, data) {
        console.error(`[${this.name}] ${message}`, data || '');
    }
}
/**
 * 基于优先级的任务队列
 */
export class PriorityQueue {
    tasks = [];
    priorityWeights = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
    };
    async enqueue(task) {
        this.tasks.push(task);
        this.tasks.sort((a, b) => {
            const weightA = this.priorityWeights[a.priority];
            const weightB = this.priorityWeights[b.priority];
            return weightB - weightA; // 高优先级在前
        });
    }
    async dequeue() {
        return this.tasks.shift() || null;
    }
    async peek() {
        return this.tasks[0] || null;
    }
    async size() {
        return this.tasks.length;
    }
    async isEmpty() {
        return this.tasks.length === 0;
    }
    async clear() {
        this.tasks = [];
    }
}
/**
 * 基于信号量的并发控制器
 */
export class SemaphoreConcurrencyController {
    max;
    current = 0;
    waiting = [];
    constructor(max) {
        this.max = max;
    }
    async acquire() {
        if (this.current < this.max) {
            this.current++;
            return true;
        }
        return new Promise((resolve) => {
            this.waiting.push(() => {
                this.current++;
                resolve(true);
            });
        });
    }
    release() {
        this.current--;
        if (this.waiting.length > 0) {
            const next = this.waiting.shift();
            next?.();
        }
    }
    getCurrentConcurrency() {
        return this.current;
    }
    getMaxConcurrency() {
        return this.max;
    }
}
//# sourceMappingURL=task-manager.js.map