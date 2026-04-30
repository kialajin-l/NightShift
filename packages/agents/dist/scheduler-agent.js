"use strict";
/**
 * 调度 Agent - 负责任务调度和协调
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerAgent = void 0;
const base_agent_1 = require("./base-agent");
/**
 * 调度 Agent
 */
class SchedulerAgent extends base_agent_1.BaseAgent {
    schedulerConfig;
    taskQueue = [];
    runningTasks = new Map();
    constructor(config = {}) {
        // 创建模拟的skillManager和modelRouter
        const mockSkillManager = {
            registerSkill: () => { },
            unregisterSkill: () => { },
            findSkills: () => [],
            getSkill: () => null,
            composeSkills: () => ({
                id: 'composite',
                name: 'composite',
                skills: [],
                execute: async () => ({ success: true, result: {}, metadata: { executionTime: 0 } })
            })
        };
        const mockModelRouter = {
            route: () => 'ollama/qwen-coder:7b',
            getModelInfo: () => ({
                name: 'ollama/qwen-coder:7b',
                provider: 'ollama',
                capabilities: [],
                costPerToken: 0,
                maxTokens: 4000,
                supportedLanguages: []
            }),
            trackPerformance: () => { }
        };
        super('scheduler-agent', '调度 Agent', '任务调度和协调专家', 'ollama/qwen-coder:7b', mockSkillManager, mockModelRouter);
        this.schedulerConfig = {
            maxConcurrentTasks: 5,
            defaultTimeout: 300000, // 5分钟
            enableRetry: true,
            maxRetries: 3,
            ...config
        };
    }
    /**
     * 加载默认技能
     */
    async loadDefaultSkills() {
        // 暂时使用空数组，避免复杂的Skill类型定义
        this.skills = [];
    }
    /**
     * 验证任务是否适合此 Agent
     */
    validateTask(task) {
        const errors = [];
        const warnings = [];
        if (!task.id) {
            errors.push('任务必须包含ID');
        }
        if (!task.name) {
            errors.push('任务必须包含名称');
        }
        if (!task.description) {
            errors.push('任务必须包含描述');
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * 选择适合任务的技能
     */
    selectSkills(task) {
        // 暂时返回空数组，避免复杂的Skill类型定义
        return [];
    }
    /**
     * 执行任务的核心逻辑
     */
    async executeWithContext(context) {
        const { task } = context;
        // 模拟调度逻辑
        const result = {
            success: true,
            output: {
                success: true,
                generatedCode: '',
                documentation: '',
                testCases: [],
                executionTime: 100,
                model: this.model
            },
            context: context,
            metrics: {
                totalTime: 100,
                skillExecutionCount: 0,
                tokensUsed: 0,
                qualityScore: 85,
                errorCount: 0
            }
        };
        return result;
    }
    /**
     * 添加任务到队列
     */
    async addTask(task) {
        const validation = this.validateTask(task);
        if (!validation.isValid) {
            throw new Error(`任务验证失败: ${validation.errors.join(', ')}`);
        }
        this.taskQueue.push(task);
        this.log('info', `任务已添加到队列: ${task.name}`);
        return task.id;
    }
    /**
     * 获取待处理任务
     */
    getPendingTasks() {
        return [...this.taskQueue];
    }
    /**
     * 获取运行中任务
     */
    getRunningTasks() {
        return Array.from(this.runningTasks.values());
    }
    /**
     * 开始调度
     */
    async startScheduling() {
        this.log('info', '开始任务调度');
        // 模拟调度循环
        setInterval(() => {
            this.processQueue();
        }, 5000); // 每5秒处理一次队列
    }
    /**
     * 处理任务队列
     */
    async processQueue() {
        if (this.runningTasks.size >= this.schedulerConfig.maxConcurrentTasks) {
            return; // 达到最大并发数
        }
        const availableSlots = this.schedulerConfig.maxConcurrentTasks - this.runningTasks.size;
        const tasksToProcess = this.taskQueue.splice(0, availableSlots);
        for (const task of tasksToProcess) {
            this.runningTasks.set(task.id, task);
            try {
                await this.execute(task);
                this.runningTasks.delete(task.id);
            }
            catch (error) {
                this.log('error', `任务执行失败: ${task.name}`, error);
                this.runningTasks.delete(task.id);
                // 重试逻辑
                if (this.schedulerConfig.enableRetry) {
                    await this.handleRetry(task, error);
                }
            }
        }
    }
    /**
     * 处理任务重试
     */
    async handleRetry(task, error) {
        const retryCount = task.retryCount || 0;
        if (retryCount < this.schedulerConfig.maxRetries) {
            task.retryCount = retryCount + 1;
            this.taskQueue.push(task);
            this.log('info', `任务将重试: ${task.name}, 重试次数: ${retryCount + 1}`);
        }
        else {
            this.log('error', `任务重试次数已达上限: ${task.name}`);
        }
    }
}
exports.SchedulerAgent = SchedulerAgent;
//# sourceMappingURL=scheduler-agent.js.map