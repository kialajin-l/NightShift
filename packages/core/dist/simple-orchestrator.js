import { SchedulerAgent } from './scheduler-agent';
import { TaskManager } from './task-manager';
import { FrontendAgent } from '../agents/src/frontend-agent';
import { BackendAgent } from '../agents/src/backend-agent';
import { PatternRecognizer } from './pattern-recognizer';
/**
 * 简化的 NightShift 协调器 - 用于端到端工作流测试
 */
export class SimpleNightShiftOrchestrator {
    scheduler;
    taskManager;
    frontendAgent;
    backendAgent;
    patternRecognizer;
    constructor() {
        this.scheduler = new SchedulerAgent();
        this.taskManager = new TaskManager();
        this.frontendAgent = new FrontendAgent();
        this.backendAgent = new BackendAgent();
        this.patternRecognizer = new PatternRecognizer();
    }
    /**
     * 执行完整的工作流
     */
    async executeWorkflow(userInput) {
        const startTime = Date.now();
        const errors = [];
        const generatedFiles = [];
        const extractedRules = [];
        console.log('🚀 开始执行 NightShift 工作流');
        console.log(`用户输入: ${userInput}`);
        try {
            // 1. 任务拆解
            console.log('📋 步骤 1: 任务拆解');
            const { tasks, dependencies, estimatedTime } = await this.scheduler.parseRequirements(userInput);
            // 2. 任务管理
            console.log('📊 步骤 2: 任务管理');
            this.taskManager.addTasks(tasks);
            // 3. Agent 执行
            console.log('🤖 步骤 3: Agent 执行');
            const executionResults = await this.executeTasks(tasks, dependencies);
            // 收集生成的文件
            executionResults.forEach(result => {
                generatedFiles.push(...result.generatedFiles);
                errors.push(...result.errors);
            });
            // 4. 规则提取
            console.log('🔍 步骤 4: 规则提取');
            const sessionLog = {
                id: `session_${Date.now()}`,
                userInput,
                aiResponse: '工作流执行完成',
                timestamp: new Date(),
                generatedFiles,
                errors: errors.length > 0 ? errors : undefined
            };
            this.patternRecognizer.addSessionLog(sessionLog);
            const patterns = this.patternRecognizer.recognizePatterns();
            extractedRules.push(...patterns.candidates);
            const totalTime = Date.now() - startTime;
            console.log('✅ 工作流执行完成');
            console.log(`📊 统计信息:`);
            console.log(`   - 任务数量: ${tasks.length}`);
            console.log(`   - 生成文件: ${generatedFiles.length}`);
            console.log(`   - 提取规则: ${extractedRules.length}`);
            console.log(`   - 总耗时: ${totalTime}ms`);
            return {
                success: errors.length === 0,
                tasks,
                generatedFiles,
                extractedRules,
                totalTime,
                errors
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            console.error('❌ 工作流执行失败:', errorMessage);
            return {
                success: false,
                tasks: [],
                generatedFiles: [],
                extractedRules: [],
                totalTime: Date.now() - startTime,
                errors: [errorMessage]
            };
        }
    }
    /**
     * 执行任务
     */
    async executeTasks(tasks, dependencies) {
        const results = [];
        const completedTasks = new Set();
        // 按依赖关系顺序执行任务
        while (completedTasks.size < tasks.length) {
            const batch = [];
            // 找出当前可执行的任务
            for (const task of tasks) {
                if (completedTasks.has(task.id))
                    continue;
                const taskDeps = dependencies.get(task.id) || [];
                const allDepsCompleted = taskDeps.every(depId => completedTasks.has(depId));
                if (allDepsCompleted) {
                    batch.push(task);
                }
            }
            if (batch.length === 0) {
                // 没有可执行的任务，可能是循环依赖
                throw new Error('检测到循环依赖或任务执行阻塞');
            }
            // 并行执行当前批次的任务
            const batchResults = await Promise.all(batch.map(task => this.executeSingleTask(task)));
            results.push(...batchResults);
            // 标记任务完成
            batch.forEach(task => completedTasks.add(task.id));
            console.log(`✅ 完成批次执行: ${batch.length} 个任务`);
        }
        return results;
    }
    /**
     * 执行单个任务
     */
    async executeSingleTask(task) {
        console.log(`▶️  执行任务: ${task.name} (${task.type})`);
        try {
            let result;
            switch (task.type) {
                case 'frontend':
                    result = await this.frontendAgent.executeTask(task);
                    break;
                case 'backend':
                    result = await this.backendAgent.executeTask(task);
                    break;
                default:
                    // 默认使用前端 Agent
                    result = await this.frontendAgent.executeTask(task);
            }
            console.log(`✅ 任务完成: ${task.name}`);
            return result;
        }
        catch (error) {
            console.error(`❌ 任务失败: ${task.name}`, error);
            return {
                success: false,
                generatedFiles: [],
                errors: [error instanceof Error ? error.message : '未知错误']
            };
        }
    }
    /**
     * 获取工作流统计信息
     */
    getWorkflowStats() {
        return {
            scheduler: this.scheduler.getAgentInfo(),
            taskManager: this.taskManager.getStatistics(),
            frontendAgent: this.frontendAgent.getAgentInfo(),
            backendAgent: this.backendAgent.getAgentInfo(),
            patternRecognizer: {
                sessionCount: this.patternRecognizer.getSessionCount()
            }
        };
    }
    /**
     * 重置工作流状态
     */
    reset() {
        this.taskManager.clear();
        this.patternRecognizer.clearSessionLogs();
    }
}
//# sourceMappingURL=simple-orchestrator.js.map