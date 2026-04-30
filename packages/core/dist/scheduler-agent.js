/**
 * 调度 Agent - 负责任务拆解和依赖关系管理
 */
export class SchedulerAgent {
    name = '调度 Agent';
    role = '任务拆解专家';
    model = 'glm-5';
    skills = ['prd_parser', 'dag_generator', 'dependency_analyzer'];
    /**
     * 解析用户需求并生成任务计划
     */
    async parseRequirements(userInput) {
        console.log(`[${this.name}] 开始解析用户需求: ${userInput.substring(0, 100)}...`);
        // 1. 需求分析
        const requirementAnalysis = this.analyzeRequirements(userInput);
        // 2. 任务拆解
        const taskList = this.decomposeTasks(requirementAnalysis);
        // 3. 依赖关系分析
        const dependencies = this.analyzeDependencies(taskList);
        // 4. 生成 DAG
        const dag = this.generateDAG(taskList, dependencies);
        // 5. 时间估算
        const estimatedTime = this.estimateTime(taskList);
        console.log(`[${this.name}] 任务解析完成，生成 ${taskList.length} 个任务，预计耗时 ${estimatedTime} 分钟`);
        return {
            tasks: taskList,
            dependencies,
            estimatedTime
        };
    }
    /**
     * 需求分析
     */
    analyzeRequirements(userInput) {
        const analysis = {
            mainGoal: '',
            features: [],
            technicalRequirements: [],
            constraints: [],
            priority: 'medium'
        };
        // 提取主要目标
        analysis.mainGoal = this.extractMainGoal(userInput);
        // 提取功能特性
        analysis.features = this.extractFeatures(userInput);
        // 提取技术要求
        analysis.technicalRequirements = this.extractTechnicalRequirements(userInput);
        // 提取约束条件
        analysis.constraints = this.extractConstraints(userInput);
        // 确定优先级
        analysis.priority = this.determinePriority(userInput);
        return analysis;
    }
    /**
     * 提取主要目标
     */
    extractMainGoal(userInput) {
        const goalKeywords = ['做个', '实现', '开发', '创建', '构建'];
        for (const keyword of goalKeywords) {
            if (userInput.includes(keyword)) {
                const startIndex = userInput.indexOf(keyword) + keyword.length;
                const endIndex = userInput.indexOf('，', startIndex) || userInput.length;
                return userInput.substring(startIndex, endIndex).trim();
            }
        }
        // 如果没有明确的关键词，取前50个字符作为目标
        return userInput.substring(0, Math.min(50, userInput.length)).trim();
    }
    /**
     * 提取功能特性
     */
    extractFeatures(userInput) {
        const features = [];
        const featurePatterns = [
            /需要(.+?)(?:，|$)/g,
            /包含(.+?)(?:，|$)/g,
            /要有(.+?)(?:，|$)/g,
            /支持(.+?)(?:，|$)/g
        ];
        for (const pattern of featurePatterns) {
            const matches = userInput.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    features.push(match[1].trim());
                }
            }
        }
        // 如果没有明确的功能描述，从关键词推断
        if (features.length === 0) {
            return this.inferFeaturesFromKeywords(userInput);
        }
        return features;
    }
    /**
     * 从关键词推断功能
     */
    inferFeaturesFromKeywords(userInput) {
        const features = [];
        const keywordMap = {
            '登录': ['用户认证', '登录界面', '密码验证'],
            '注册': ['用户注册', '表单验证', '邮箱确认'],
            '表单': ['数据输入', '表单验证', '提交处理'],
            'API': ['接口设计', '数据交互', '错误处理'],
            '数据库': ['数据存储', 'CRUD操作', '数据模型'],
            '样式': ['界面设计', '响应式布局', '用户体验'],
            '测试': ['单元测试', '集成测试', '功能验证']
        };
        for (const [keyword, relatedFeatures] of Object.entries(keywordMap)) {
            if (userInput.includes(keyword)) {
                features.push(...relatedFeatures);
            }
        }
        return features.length > 0 ? features : ['基础功能实现'];
    }
    /**
     * 提取技术要求
     */
    extractTechnicalRequirements(userInput) {
        const requirements = [];
        const techKeywords = [
            'React', 'Vue', 'TypeScript', 'JavaScript', 'Python', 'FastAPI',
            '数据库', 'API', '组件', '样式', '路由', '状态管理'
        ];
        for (const keyword of techKeywords) {
            if (userInput.includes(keyword)) {
                requirements.push(keyword);
            }
        }
        return requirements;
    }
    /**
     * 提取约束条件
     */
    extractConstraints(userInput) {
        const constraints = [];
        const constraintPatterns = [
            /要(.+?)(?:，|$)/g,
            /必须(.+?)(?:，|$)/g,
            /需要(.+?)(?:，|$)/g,
            /包含(.+?)(?:，|$)/g
        ];
        for (const pattern of constraintPatterns) {
            const matches = userInput.matchAll(pattern);
            for (const match of matches) {
                if (match[1] && !match[1].includes('需要') && !match[1].includes('必须')) {
                    constraints.push(match[1].trim());
                }
            }
        }
        return constraints;
    }
    /**
     * 确定优先级
     */
    determinePriority(userInput) {
        if (userInput.includes('紧急') || userInput.includes('尽快') || userInput.includes('重要')) {
            return 'high';
        }
        if (userInput.includes('简单') || userInput.includes('基础') || userInput.includes('基本')) {
            return 'low';
        }
        return 'medium';
    }
    /**
     * 任务拆解
     */
    decomposeTasks(analysis) {
        const tasks = [];
        const now = new Date();
        // 基础任务模板
        const baseTask = {
            priority: analysis.priority,
            status: 'pending',
            createdAt: now,
            updatedAt: now
        };
        // 根据功能特性生成任务
        for (const feature of analysis.features) {
            const taskType = this.determineTaskType(feature);
            const agent = this.assignAgent(taskType);
            const model = this.assignModel(taskType);
            const task = {
                id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: this.generateTaskName(feature),
                description: this.generateTaskDescription(feature, analysis.mainGoal),
                type: taskType,
                estimatedTime: this.estimateTaskTime(feature, taskType),
                agent,
                model,
                ...baseTask
            };
            tasks.push(task);
        }
        // 如果没有明确功能，生成基础任务
        if (tasks.length === 0) {
            tasks.push({
                id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: '实现基础功能',
                description: analysis.mainGoal,
                type: 'frontend',
                estimatedTime: 60,
                agent: 'frontend-agent',
                model: 'ollama/qwen-coder:7b',
                ...baseTask
            });
        }
        return tasks;
    }
    /**
     * 确定任务类型
     */
    determineTaskType(feature) {
        const frontendKeywords = ['界面', '组件', '样式', '页面', '表单', '按钮'];
        const backendKeywords = ['API', '接口', '数据库', '服务', '逻辑', '认证'];
        const testKeywords = ['测试', '验证', '检查', '调试'];
        if (frontendKeywords.some(keyword => feature.includes(keyword))) {
            return 'frontend';
        }
        if (backendKeywords.some(keyword => feature.includes(keyword))) {
            return 'backend';
        }
        if (testKeywords.some(keyword => feature.includes(keyword))) {
            return 'test';
        }
        // 默认分配前端任务
        return 'frontend';
    }
    /**
     * 分配 Agent
     */
    assignAgent(taskType) {
        const agentMap = {
            'frontend': 'frontend-agent',
            'backend': 'backend-agent',
            'test': 'test-agent',
            'documentation': 'documentation-agent'
        };
        return agentMap[taskType] || 'frontend-agent';
    }
    /**
     * 分配模型
     */
    assignModel(taskType) {
        const modelMap = {
            'frontend': 'ollama/qwen-coder:7b',
            'backend': 'ollama/qwen-coder:7b',
            'test': 'ollama/qwen2.5:7b',
            'documentation': 'ollama/qwen2.5:7b'
        };
        return modelMap[taskType] || 'ollama/qwen-coder:7b';
    }
    /**
     * 生成任务名称
     */
    generateTaskName(feature) {
        return `实现${feature}功能`;
    }
    /**
     * 生成任务描述
     */
    generateTaskDescription(feature, mainGoal) {
        return `为"${mainGoal}"项目实现${feature}功能`;
    }
    /**
     * 估算任务时间
     */
    estimateTaskTime(feature, taskType) {
        const baseTime = 30; // 基础时间 30 分钟
        const complexityMultiplier = this.estimateComplexity(feature);
        const typeMultiplier = taskType === 'backend' ? 1.5 : 1;
        return Math.round(baseTime * complexityMultiplier * typeMultiplier);
    }
    /**
     * 估算复杂度
     */
    estimateComplexity(feature) {
        const complexKeywords = ['认证', '数据库', 'API', '表单验证', '状态管理'];
        const simpleKeywords = ['界面', '样式', '按钮', '文本'];
        if (complexKeywords.some(keyword => feature.includes(keyword))) {
            return 2.0;
        }
        if (simpleKeywords.some(keyword => feature.includes(keyword))) {
            return 0.5;
        }
        return 1.0;
    }
    /**
     * 分析依赖关系
     */
    analyzeDependencies(tasks) {
        const dependencies = new Map();
        for (const task of tasks) {
            const taskDependencies = [];
            // 后端任务通常依赖前端任务完成
            if (task.type === 'backend') {
                const frontendTasks = tasks.filter(t => t.type === 'frontend');
                if (frontendTasks.length > 0) {
                    taskDependencies.push(frontendTasks[0].id);
                }
            }
            // 测试任务依赖对应的功能任务
            if (task.type === 'test') {
                const featureTask = tasks.find(t => t.name.includes(task.name.replace('测试', '').replace('功能', '')));
                if (featureTask) {
                    taskDependencies.push(featureTask.id);
                }
            }
            if (taskDependencies.length > 0) {
                dependencies.set(task.id, taskDependencies);
            }
        }
        return dependencies;
    }
    /**
     * 生成 DAG（有向无环图）
     */
    generateDAG(tasks, dependencies) {
        const dag = {
            nodes: tasks,
            edges: [],
            startNodes: [],
            endNodes: []
        };
        // 构建边
        for (const [taskId, depIds] of dependencies.entries()) {
            for (const depId of depIds) {
                dag.edges.push({ from: depId, to: taskId });
            }
        }
        // 找出起始节点（没有依赖的节点）
        dag.startNodes = tasks.filter(task => !Array.from(dependencies.values()).flat().includes(task.id)).map(task => task.id);
        // 找出结束节点（没有被依赖的节点）
        const allDependencies = Array.from(dependencies.keys());
        dag.endNodes = tasks.filter(task => !allDependencies.includes(task.id)).map(task => task.id);
        return dag;
    }
    /**
     * 估算总时间
     */
    estimateTime(tasks) {
        // 简单估算：所有任务时间之和的 80%（考虑并行执行）
        const totalTime = tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
        return Math.round(totalTime * 0.8);
    }
    /**
     * 获取 Agent 信息
     */
    getAgentInfo() {
        return {
            id: 'scheduler-agent',
            name: this.name,
            role: this.role,
            model: this.model,
            skills: this.skills,
            isActive: true
        };
    }
    /**
     * 验证任务计划
     */
    validateTaskPlan(tasks, dependencies) {
        const errors = [];
        // 检查循环依赖
        const cycleError = this.checkCyclicDependencies(tasks, dependencies);
        if (cycleError) {
            errors.push(cycleError);
        }
        // 检查任务完整性
        if (tasks.length === 0) {
            errors.push('任务列表为空');
        }
        // 检查依赖关系有效性
        for (const [taskId, depIds] of dependencies.entries()) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) {
                errors.push(`依赖关系引用了不存在的任务: ${taskId}`);
                continue;
            }
            for (const depId of depIds) {
                if (!tasks.find(t => t.id === depId)) {
                    errors.push(`任务 ${taskId} 依赖了不存在的任务: ${depId}`);
                }
            }
        }
        return errors;
    }
    /**
     * 检查循环依赖
     */
    checkCyclicDependencies(tasks, dependencies) {
        const visited = new Set();
        const recursionStack = new Set();
        const hasCycle = (taskId) => {
            if (recursionStack.has(taskId)) {
                return true;
            }
            if (visited.has(taskId)) {
                return false;
            }
            visited.add(taskId);
            recursionStack.add(taskId);
            const depIds = dependencies.get(taskId) || [];
            for (const depId of depIds) {
                if (hasCycle(depId)) {
                    return true;
                }
            }
            recursionStack.delete(taskId);
            return false;
        };
        for (const task of tasks) {
            if (hasCycle(task.id)) {
                return `检测到循环依赖，涉及任务: ${Array.from(recursionStack).join(', ')}`;
            }
        }
        return null;
    }
    /**
     * 生成执行计划报告
     */
    generateExecutionReport(tasks, dependencies, estimatedTime) {
        let report = `# 任务执行计划报告\n\n`;
        report += `## 总体信息\n`;
        report += `- 任务总数: ${tasks.length}\n`;
        report += `- 预计总时间: ${estimatedTime} 分钟\n`;
        report += `- 并行度: ${this.calculateParallelism(tasks, dependencies)}\n\n`;
        report += `## 任务列表\n`;
        for (const task of tasks) {
            report += `### ${task.name}\n`;
            report += `- 类型: ${task.type}\n`;
            report += `- 负责人: ${task.agent}\n`;
            report += `- 预计时间: ${task.estimatedTime} 分钟\n`;
            report += `- 优先级: ${task.priority}\n`;
            const deps = dependencies.get(task.id);
            if (deps && deps.length > 0) {
                report += `- 依赖任务: ${deps.join(', ')}\n`;
            }
            report += `\n`;
        }
        report += `## 执行顺序\n`;
        const executionOrder = this.getExecutionOrder(tasks, dependencies);
        for (let i = 0; i < executionOrder.length; i++) {
            const taskIds = executionOrder[i];
            report += `第 ${i + 1} 批: ${taskIds.join(', ')}\n`;
        }
        return report;
    }
    /**
     * 计算并行度
     */
    calculateParallelism(tasks, dependencies) {
        const executionOrder = this.getExecutionOrder(tasks, dependencies);
        const maxParallel = Math.max(...executionOrder.map(batch => batch.length));
        return maxParallel;
    }
    /**
     * 获取执行顺序
     */
    getExecutionOrder(tasks, dependencies) {
        const order = [];
        const completed = new Set();
        const remaining = new Set(tasks.map(t => t.id));
        while (remaining.size > 0) {
            const batch = [];
            for (const taskId of remaining) {
                const deps = dependencies.get(taskId) || [];
                const allDepsCompleted = deps.every(depId => completed.has(depId));
                if (allDepsCompleted) {
                    batch.push(taskId);
                }
            }
            if (batch.length === 0) {
                // 检测到循环依赖或错误
                break;
            }
            order.push([...batch]);
            batch.forEach(taskId => {
                completed.add(taskId);
                remaining.delete(taskId);
            });
        }
        return order;
    }
}
//# sourceMappingURL=scheduler-agent.js.map