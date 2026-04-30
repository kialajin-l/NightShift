/**
 * NightShift 端到端协调器
 * 整合所有模块，实现完整工作流
 */
import { TaskDecomposer } from '../scheduler/task-decomposer.js';
import { TaskManager } from '../task-manager/task-manager.js';
import { SmartModelRouter } from '../model-router/model-router.js';
import { FrontendAgent, BackendAgent } from '../../agents/src/index.js';
import { PatternRecognizer } from '../../ruleforge/src/index.js';
import { TaskPlanPanel } from '../../editor/src/index.js';
/**
 * 端到端工作流协调器
 */
export class NightShiftOrchestrator {
    decomposer;
    taskManager;
    modelRouter;
    frontendAgent;
    backendAgent;
    schedulerAgent;
    patternRecognizer;
    taskPanel;
    constructor() {
        this.decomposer = new TaskDecomposer();
        this.taskManager = new TaskManager();
        this.modelRouter = new SmartModelRouter();
        this.frontendAgent = new FrontendAgent();
        this.backendAgent = new BackendAgent();
        this.schedulerAgent = new SchedulerAgent();
        this.patternRecognizer = new PatternRecognizer();
        this.taskPanel = new TaskPlanPanel();
        console.log('NightShift 协调器初始化完成');
    }
    /**
     * 执行完整工作流
     */
    async executeWorkflow(userInput) {
        console.log('🚀 开始执行 NightShift 完整工作流');
        console.log(`用户输入: "${userInput}"`);
        console.log('');
        const startTime = Date.now();
        const workflowResult = {
            success: true,
            tasks: [],
            generatedFiles: [],
            extractedRules: [],
            totalTime: 0,
            errors: []
        };
        try {
            // 1. 任务分解
            console.log('1️⃣ 任务分解阶段');
            const decomposition = await this.decomposeTask(userInput);
            workflowResult.tasks = decomposition.tasks;
            // 更新进度面板
            this.taskPanel.updateTasks(decomposition.tasks);
            console.log(`   分解出 ${decomposition.tasks.length} 个任务`);
            // 2. 加载 RuleForge 规则
            console.log('2️⃣ RuleForge 规则注入');
            const rules = await this.loadRules();
            workflowResult.extractedRules = rules;
            console.log(`   加载了 ${rules.length} 个规则`);
            // 3. Agent 并发执行
            console.log('3️⃣ Agent 并发执行');
            const executionResults = await this.executeAgentsConcurrently(decomposition.tasks);
            workflowResult.generatedFiles = executionResults.generatedFiles;
            // 4. 实时进度更新
            console.log('4️⃣ 进度面板更新');
            await this.updateProgressPanel(decomposition.tasks);
            // 5. 会话记录和规则提取
            console.log('5️⃣ 会话记录和规则提取');
            const newRules = await this.extractNewRules(userInput, workflowResult);
            workflowResult.extractedRules.push(...newRules);
            workflowResult.totalTime = Date.now() - startTime;
            console.log(`✅ 工作流执行完成，总耗时: ${(workflowResult.totalTime / 1000).toFixed(1)}s`);
        }
        catch (error) {
            workflowResult.success = false;
            workflowResult.errors.push(error instanceof Error ? error.message : String(error));
            console.error('❌ 工作流执行失败:', error);
        }
        return workflowResult;
    }
    /**
     * 任务分解
     */
    async decomposeTask(userInput) {
        const input = {
            text: userInput,
            context: {
                projectType: 'web_application',
                technologyStack: ['vue', 'fastapi', 'postgresql'],
                teamSize: 1,
                constraints: ['responsive', 'secure', 'user_friendly']
            }
        };
        return await this.decomposer.decompose(input);
    }
    /**
     * 加载 RuleForge 规则
     */
    async loadRules() {
        const rules = [];
        // 加载 Vue 组件验证规则
        try {
            const vueRules = await this.patternRecognizer.loadPatterns('vue-props-validation');
            rules.push(...vueRules);
        }
        catch (error) {
            console.warn('Vue 规则加载失败:', error);
        }
        // 加载 FastAPI 认证规则
        try {
            const fastapiRules = await this.patternRecognizer.loadPatterns('fastapi-auth-pattern');
            rules.push(...fastapiRules);
        }
        catch (error) {
            console.warn('FastAPI 规则加载失败:', error);
        }
        return rules;
    }
    /**
     * Agent 并发执行
     */
    async executeAgentsConcurrently(tasks) {
        const results = {
            generatedFiles: [],
            errors: []
        };
        // 按类型分组任务
        const frontendTasks = tasks.filter(task => task.agent === 'frontend');
        const backendTasks = tasks.filter(task => task.agent === 'backend');
        // 并发执行
        const promises = [];
        if (frontendTasks.length > 0) {
            promises.push(this.executeFrontendAgent(frontendTasks, results));
        }
        if (backendTasks.length > 0) {
            promises.push(this.executeBackendAgent(backendTasks, results));
        }
        // 等待所有任务完成
        await Promise.allSettled(promises);
        return results;
    }
    /**
     * 执行前端 Agent
     */
    async executeFrontendAgent(tasks, results) {
        console.log(`   🎨 前端 Agent 处理 ${tasks.length} 个任务`);
        for (const task of tasks) {
            try {
                // 路由到合适的模型
                const model = await this.modelRouter.route({
                    id: task.id,
                    name: task.name,
                    description: task.description,
                    type: 'component_generation',
                    complexity: 'medium',
                    estimatedTokens: 1000,
                    priority: 'normal',
                    constraints: []
                });
                // 执行前端任务
                const frontendTask = {
                    id: task.id,
                    name: task.name,
                    description: task.description,
                    type: 'component_generation',
                    input: {
                        requirements: task.description,
                        technology: {
                            frontend: {
                                framework: 'vue',
                                language: 'typescript'
                            }
                        }
                    },
                    technology: {
                        frontend: {
                            framework: 'vue',
                            language: 'typescript'
                        }
                    },
                    constraints: [],
                    priority: 'normal',
                    estimatedTime: 10,
                    dependencies: [],
                    context: {}
                };
                const result = await this.frontendAgent.execute(frontendTask);
                if (result.success) {
                    results.generatedFiles.push({
                        type: 'frontend',
                        name: `${task.name}.vue`,
                        content: result.output,
                        path: `src/components/${task.name}.vue`
                    });
                    // 更新任务状态
                    this.taskManager.updateTaskStatus(task.id, 'completed');
                    this.taskPanel.markTaskComplete(task.id);
                    console.log(`     ✅ 完成: ${task.name}`);
                }
                else {
                    throw new Error(result.error || '前端任务执行失败');
                }
            }
            catch (error) {
                results.errors.push(`前端任务 ${task.name} 失败: ${error}`);
                this.taskManager.updateTaskStatus(task.id, 'failed');
                console.error(`     ❌ 失败: ${task.name} - ${error}`);
            }
        }
    }
    /**
     * 执行后端 Agent
     */
    async executeBackendAgent(tasks, results) {
        console.log(`   🔧 后端 Agent 处理 ${tasks.length} 个任务`);
        for (const task of tasks) {
            try {
                // 路由到合适的模型
                const model = await this.modelRouter.route({
                    id: task.id,
                    name: task.name,
                    description: task.description,
                    type: 'api_implementation',
                    complexity: 'medium',
                    estimatedTokens: 1500,
                    priority: 'normal',
                    constraints: []
                });
                // 执行后端任务
                const backendTask = {
                    id: task.id,
                    name: task.name,
                    description: task.description,
                    type: 'api_implementation',
                    input: {
                        requirements: task.description,
                        technology: {
                            backend: {
                                framework: 'fastapi',
                                language: 'python'
                            }
                        }
                    },
                    technology: {
                        backend: {
                            framework: 'fastapi',
                            language: 'python'
                        }
                    },
                    constraints: [],
                    priority: 'normal',
                    estimatedTime: 15,
                    dependencies: [],
                    context: {}
                };
                const result = await this.backendAgent.execute(backendTask);
                if (result.success) {
                    results.generatedFiles.push({
                        type: 'backend',
                        name: `${task.name}.py`,
                        content: result.output,
                        path: `src/api/${task.name}.py`
                    });
                    // 更新任务状态
                    this.taskManager.updateTaskStatus(task.id, 'completed');
                    this.taskPanel.markTaskComplete(task.id);
                    console.log(`     ✅ 完成: ${task.name}`);
                }
                else {
                    throw new Error(result.error || '后端任务执行失败');
                }
            }
            catch (error) {
                results.errors.push(`后端任务 ${task.name} 失败: ${error}`);
                this.taskManager.updateTaskStatus(task.id, 'failed');
                console.error(`     ❌ 失败: ${task.name} - ${error}`);
            }
        }
    }
    /**
     * 更新进度面板
     */
    async updateProgressPanel(tasks) {
        // 模拟实时进度更新
        for (let i = 0; i < tasks.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const progress = ((i + 1) / tasks.length) * 100;
            this.taskPanel.updateProgress(progress);
            if (i === tasks.length - 1) {
                this.taskPanel.showCompletionMessage('所有任务已完成！');
            }
        }
    }
    /**
     * 提取新规则
     */
    async extractNewRules(userInput, workflowResult) {
        const sessionData = {
            userInput,
            generatedFiles: workflowResult.generatedFiles,
            executionTime: workflowResult.totalTime
        };
        return await this.patternRecognizer.extractPatterns(sessionData);
    }
    /**
     * 获取工作流状态
     */
    getWorkflowStatus() {
        return {
            isRunning: this.taskManager.hasActiveTasks(),
            completedTasks: this.taskManager.getCompletedTasks().length,
            totalTasks: this.taskManager.getAllTasks().length,
            progress: this.taskPanel.getCurrentProgress()
        };
    }
    /**
     * 停止工作流
     */
    async stopWorkflow() {
        await this.taskManager.cancelAllTasks();
        this.taskPanel.showCancellationMessage('工作流已停止');
        console.log('🛑 工作流已停止');
    }
}
export default NightShiftOrchestrator;
//# sourceMappingURL=nightshift-orchestrator.js.map