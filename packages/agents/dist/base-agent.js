"use strict";
/**
 * 基础 Agent 类
 * 提供所有 Agent 的通用功能和生命周期管理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const agent_js_1 = require("./types/agent.js");
/**
 * 基础 Agent 实现
 */
class BaseAgent {
    id;
    name;
    role;
    model;
    skills = [];
    config;
    status;
    rules = [];
    skillManager;
    modelRouter;
    projectContext;
    isInitialized = false;
    currentTask;
    taskHistory = [];
    constructor(id, name, role, model, skillManager, modelRouter, config) {
        this.id = id;
        this.name = name;
        this.role = role;
        this.model = model;
        this.skillManager = skillManager;
        this.modelRouter = modelRouter;
        // 设置默认配置
        this.config = {
            model: model,
            temperature: 0.7,
            maxTokens: 4000,
            timeout: 300000, // 5分钟
            maxRetries: 3,
            qualityThreshold: 0.8,
            codeStyle: {
                indent: 2,
                quoteStyle: 'single',
                trailingComma: true,
                semicolons: false,
                lineLength: 80
            },
            logging: {
                level: 'info',
                enablePerformance: true
            },
            ...config
        };
        this.status = {
            isReady: false,
            isBusy: false,
            completedTasks: 0,
            successRate: 0,
            averageExecutionTime: 0
        };
    }
    /**
     * 初始化 Agent
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        this.log('info', `初始化 ${this.role} Agent (${this.id})`);
        // 加载默认技能
        await this.loadDefaultSkills();
        // 验证技能配置
        const validation = this.validateSkills();
        if (!validation.isValid) {
            throw new agent_js_1.AgentError('validation_failed', `技能配置验证失败: ${validation.errors.join(', ')}`);
        }
        this.status.isReady = true;
        this.isInitialized = true;
        this.log('info', `${this.role} Agent 初始化完成`);
    }
    /**
     * 关闭 Agent
     */
    async shutdown() {
        this.log('info', `关闭 ${this.role} Agent`);
        this.status.isReady = false;
        this.status.isBusy = false;
        this.isInitialized = false;
        // 清理资源
        this.skills = [];
        this.rules = [];
        this.taskHistory = [];
        this.log('info', `${this.role} Agent 已关闭`);
    }
    /**
     * 执行任务
     */
    async execute(task) {
        this.ensureReady();
        if (this.status.isBusy) {
            throw new agent_js_1.AgentError('execution_error', 'Agent 正在执行其他任务');
        }
        this.setBusy(task.id);
        const startTime = Date.now();
        try {
            this.log('info', `开始执行任务: ${task.name}`);
            // 验证任务
            const taskValidation = this.validateTask(task);
            if (!taskValidation.isValid) {
                throw new agent_js_1.AgentError('invalid_task', `任务验证失败: ${taskValidation.errors.join(', ')}`);
            }
            // 选择模型
            const selectedModel = this.selectModel(task);
            // 选择技能
            const selectedSkills = this.selectSkills(task);
            // 创建执行上下文
            const context = {
                agent: this,
                task,
                skills: selectedSkills,
                model: selectedModel,
                startTime: new Date(),
                intermediateResults: new Map(),
                config: {
                    enableDebug: this.config.logging.level === 'debug',
                    saveIntermediate: true,
                    maxIterations: 3,
                    qualityThreshold: this.config.qualityThreshold
                }
            };
            // 执行任务
            const result = await this.executeWithContext(context);
            // 记录执行结果
            this.recordExecution(task.id, true, Date.now() - startTime);
            this.log('info', `任务执行完成: ${task.name}`);
            return result.output;
        }
        catch (error) {
            this.recordExecution(task.id, false, Date.now() - startTime);
            if (error instanceof agent_js_1.AgentError) {
                throw error;
            }
            throw new agent_js_1.AgentError('execution_error', `任务执行失败: ${error instanceof Error ? error.message : String(error)}`, error);
        }
        finally {
            this.setIdle();
        }
    }
    /**
     * 加载规则
     */
    loadRules(rules) {
        this.rules = [...this.rules, ...rules];
        this.log('info', `加载了 ${rules.length} 条规则`);
    }
    /**
     * 获取 Agent 状态
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * 获取能力列表
     */
    getCapabilities() {
        const capabilities = new Set();
        this.skills.forEach(skill => {
            skill.capabilities.forEach(capability => {
                capabilities.add(capability);
            });
        });
        return Array.from(capabilities);
    }
    /**
     * 更新配置
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        this.log('info', '配置已更新');
    }
    /**
     * 获取配置
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * 设置项目上下文
     */
    setProjectContext(context) {
        this.projectContext = context;
        this.log('info', `项目上下文已设置: ${context.name}`);
    }
    /**
     * 保护方法
     */
    /**
     * 确保 Agent 已准备就绪
     */
    ensureReady() {
        if (!this.isInitialized || !this.status.isReady) {
            throw new agent_js_1.AgentError('execution_error', 'Agent 未初始化或未就绪');
        }
    }
    /**
     * 设置忙碌状态
     */
    setBusy(taskId) {
        this.status.isBusy = true;
        this.currentTask = taskId;
        this.status.currentTask = taskId;
    }
    /**
     * 设置空闲状态
     */
    setIdle() {
        this.status.isBusy = false;
        this.currentTask = undefined;
        this.status.currentTask = undefined;
    }
    /**
     * 选择模型
     */
    selectModel(task) {
        // 应用规则进行模型选择
        const ruleBasedModel = this.applyModelSelectionRules(task);
        if (ruleBasedModel) {
            return ruleBasedModel;
        }
        // 使用模型路由器
        const availableModels = this.getAvailableModels();
        return this.modelRouter.route(task, availableModels);
    }
    /**
     * 应用模型选择规则
     */
    applyModelSelectionRules(task) {
        for (const rule of this.rules) {
            if (this.ruleMatches(rule, task)) {
                const modelAction = rule.actions.find(action => action.type === 'model_routing');
                if (modelAction) {
                    return modelAction.parameters.model;
                }
            }
        }
        return null;
    }
    /**
     * 检查规则是否匹配
     */
    ruleMatches(rule, task) {
        return rule.conditions.every(condition => {
            switch (condition.type) {
                case 'task_type':
                    return this.evaluateCondition(task.type, condition);
                case 'technology':
                    return this.evaluateTechnologyCondition(task.technology, condition);
                case 'complexity':
                    // 这里可以根据任务描述估算复杂度
                    return this.evaluateComplexityCondition(task.description, condition);
                default:
                    return false;
            }
        });
    }
    /**
     * 评估条件
     */
    evaluateCondition(value, condition) {
        switch (condition.operator) {
            case 'equals':
                return value === condition.value;
            case 'contains':
                return String(value).includes(String(condition.value));
            case 'greater_than':
                return Number(value) > Number(condition.value);
            default:
                return false;
        }
    }
    /**
     * 评估技术条件
     */
    evaluateTechnologyCondition(technology, condition) {
        // 简化实现，实际应该更复杂
        const techStack = JSON.stringify(technology);
        return techStack.includes(condition.value);
    }
    /**
     * 评估复杂度条件
     */
    evaluateComplexityCondition(description, condition) {
        const wordCount = description.split(/\s+/).length;
        return this.evaluateCondition(wordCount, condition);
    }
    /**
     * 获取可用模型
     */
    getAvailableModels() {
        // 这里可以集成实际的模型服务
        return [
            'gpt-4',
            'gpt-3.5-turbo',
            'claude-3',
            'codellama'
        ];
    }
    /**
     * 验证技能配置
     */
    validateSkills() {
        const errors = [];
        const warnings = [];
        if (this.skills.length === 0) {
            errors.push('没有配置任何技能');
        }
        // 检查技能冲突
        const skillNames = new Set();
        this.skills.forEach(skill => {
            if (skillNames.has(skill.id)) {
                warnings.push(`发现重复技能: ${skill.id}`);
            }
            skillNames.add(skill.id);
        });
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * 记录执行历史
     */
    recordExecution(taskId, success, executionTime) {
        this.taskHistory.push({ taskId, success, executionTime });
        // 更新统计信息
        this.status.completedTasks = this.taskHistory.length;
        this.status.successRate = this.taskHistory.filter(t => t.success).length / this.taskHistory.length;
        this.status.averageExecutionTime = this.taskHistory.reduce((sum, t) => sum + t.executionTime, 0) / this.taskHistory.length;
        if (this.config.logging.enablePerformance) {
            this.log('debug', `任务执行记录: ${taskId}, 成功: ${success}, 时间: ${executionTime}ms`);
        }
    }
    /**
     * 日志记录
     */
    log(level, message, data) {
        const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = logLevels[this.config.logging.level];
        const messageLevel = logLevels[level];
        if (messageLevel >= currentLevel) {
            const timestamp = new Date().toISOString();
            const prefix = `[${timestamp}] [${this.role}] [${level.toUpperCase()}]`;
            if (data) {
                console[level](prefix, message, data);
            }
            else {
                console[level](prefix, message);
            }
        }
    }
    /**
     * 执行单个技能
     */
    async executeSkill(skill, input, context) {
        const startTime = Date.now();
        try {
            this.log('debug', `执行技能: ${skill.name}`);
            // 验证技能输入
            const validation = skill.validate(input);
            if (!validation.isValid) {
                throw new agent_js_1.AgentError('validation_failed', `技能验证失败: ${validation.errors.join(', ')}`);
            }
            // 执行技能
            const result = await skill.execute(input, context);
            const executionTime = Date.now() - startTime;
            this.log('debug', `技能执行完成: ${skill.name}, 时间: ${executionTime}ms`);
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            this.log('error', `技能执行失败: ${skill.name}, 时间: ${executionTime}ms`, error);
            throw new agent_js_1.AgentError('execution_error', `技能 ${skill.name} 执行失败: ${error instanceof Error ? error.message : String(error)}`, error);
        }
    }
    /**
     * 组合多个技能的执行结果
     */
    combineSkillOutputs(outputs) {
        // 简单的合并策略，子类可以重写
        return outputs.map(output => output.result);
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=base-agent.js.map