/**
 * 任务优先级枚举
 */
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["LOW"] = 1] = "LOW";
    TaskPriority[TaskPriority["MEDIUM"] = 5] = "MEDIUM";
    TaskPriority[TaskPriority["HIGH"] = 8] = "HIGH";
    TaskPriority[TaskPriority["CRITICAL"] = 10] = "CRITICAL";
})(TaskPriority || (TaskPriority = {}));
/**
 * 任务工厂类 - 创建和管理任务实例
 */
export class TaskFactory {
    static taskCounter = 0;
    /**
     * 创建新任务
     */
    static createTask(title, description, agent, priority = TaskPriority.MEDIUM) {
        const taskId = `task-${++this.taskCounter}`;
        return {
            id: taskId,
            title,
            description,
            status: 'pending',
            agent,
            dependencies: [],
            priority,
            createdAt: new Date(),
            isValid() {
                return !!this.title && !!this.description && !!this.agent;
            },
            canStart() {
                return this.status === 'pending' && this.dependencies.every(depId => {
                    // 检查依赖是否已完成（实际实现中需要查询任务状态）
                    return true; // 简化实现
                });
            },
            getProgress() {
                switch (this.status) {
                    case 'completed': return 100;
                    case 'running': return 50;
                    case 'failed': return 0;
                    case 'cancelled': return 0;
                    default: return 0;
                }
            }
        };
    }
    /**
     * 从用户需求生成任务计划
     */
    static createTaskPlanFromPrompt(prompt) {
        const planId = `plan-${Date.now()}`;
        const tasks = [];
        // 根据需求类型自动生成任务（简化实现）
        if (prompt.toLowerCase().includes('前端') || prompt.toLowerCase().includes('ui')) {
            tasks.push(this.createTask('创建组件结构', '设计前端组件架构', 'frontend', TaskPriority.HIGH), this.createTask('实现样式系统', '设置CSS框架和主题', 'frontend', TaskPriority.MEDIUM), this.createTask('添加交互逻辑', '实现用户交互功能', 'frontend', TaskPriority.MEDIUM));
        }
        if (prompt.toLowerCase().includes('后端') || prompt.toLowerCase().includes('api')) {
            tasks.push(this.createTask('设计API接口', '定义RESTful API规范', 'backend', TaskPriority.HIGH), this.createTask('实现业务逻辑', '编写核心业务代码', 'backend', TaskPriority.MEDIUM), this.createTask('配置数据库', '设置数据库连接和模型', 'backend', TaskPriority.MEDIUM));
        }
        if (prompt.toLowerCase().includes('测试')) {
            tasks.push(this.createTask('编写单元测试', '为关键功能添加测试', 'test', TaskPriority.MEDIUM), this.createTask('集成测试', '验证模块间协作', 'test', TaskPriority.LOW));
        }
        // 如果没有匹配的任务类型，添加通用任务
        if (tasks.length === 0) {
            tasks.push(this.createTask('分析需求', '理解用户需求并拆解', 'scheduler', TaskPriority.HIGH), this.createTask('技术选型', '选择合适的技术栈', 'scheduler', TaskPriority.MEDIUM));
        }
        return {
            id: planId,
            prompt,
            tasks,
            status: 'planning',
            createdAt: new Date(),
            updatedAt: new Date(),
            totalTasks: tasks.length,
            completedTasks: 0,
            failedTasks: 0,
            totalEstimatedTime: tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0),
            getReadyTasks() {
                return this.tasks.filter(task => task.canStart());
            },
            getCompletedCount() {
                return this.tasks.filter(task => task.status === 'completed').length;
            },
            getTotalProgress() {
                if (this.tasks.length === 0)
                    return 0;
                const completed = this.getCompletedCount();
                return Math.round((completed / this.tasks.length) * 100);
            },
            getExecutionOrder() {
                // 简化实现 - 实际应该使用DAG拓扑排序
                return this.tasks.map(task => task.id);
            },
            validate() {
                const errors = [];
                const warnings = [];
                // 验证任务完整性
                this.tasks.forEach((task, index) => {
                    if (!task.isValid()) {
                        errors.push(`任务 ${index + 1} (${task.title}) 不完整`);
                    }
                    // 检查循环依赖（简化检查）
                    if (task.dependencies.includes(task.id)) {
                        errors.push(`任务 ${task.title} 存在自依赖`);
                    }
                });
                // 检查是否有任务没有依赖关系
                const isolatedTasks = this.tasks.filter(task => task.dependencies.length === 0 &&
                    !this.tasks.some(t => t.dependencies.includes(task.id)));
                if (isolatedTasks.length > 0) {
                    warnings.push(`发现 ${isolatedTasks.length} 个孤立任务`);
                }
                return {
                    isValid: errors.length === 0,
                    errors,
                    warnings
                };
            }
        };
    }
}
/**
 * DAG图实现类
 */
export class DirectedAcyclicGraph {
    nodes = new Map();
    edges = [];
    addNode(task) {
        if (this.nodes.has(task.id)) {
            throw new Error(`节点 ${task.id} 已存在`);
        }
        this.nodes.set(task.id, {
            taskId: task.id,
            dependencies: [...task.dependencies],
            dependents: [],
            depth: 0
        });
        // 添加依赖关系
        task.dependencies.forEach(depId => {
            this.addDependency(depId, task.id);
        });
    }
    addDependency(from, to) {
        if (!this.nodes.has(from) || !this.nodes.has(to)) {
            throw new Error(`节点 ${from} 或 ${to} 不存在`);
        }
        this.edges.push({ from, to });
        // 更新依赖关系
        const fromNode = this.nodes.get(from);
        const toNode = this.nodes.get(to);
        if (!toNode.dependencies.includes(from)) {
            toNode.dependencies.push(from);
        }
        if (!fromNode.dependents.includes(to)) {
            fromNode.dependents.push(to);
        }
        // 重新计算深度
        this._calculateDepths();
    }
    detectCycle() {
        const visited = new Set();
        const recursionStack = new Set();
        const hasCycle = (nodeId) => {
            if (recursionStack.has(nodeId))
                return true;
            if (visited.has(nodeId))
                return false;
            visited.add(nodeId);
            recursionStack.add(nodeId);
            const node = this.nodes.get(nodeId);
            for (const depId of node.dependents) {
                if (hasCycle(depId))
                    return true;
            }
            recursionStack.delete(nodeId);
            return false;
        };
        for (const nodeId of this.nodes.keys()) {
            if (hasCycle(nodeId))
                return true;
        }
        return false;
    }
    getExecutionOrder() {
        if (this.detectCycle()) {
            throw new Error('图中存在循环依赖，无法进行拓扑排序');
        }
        const result = [];
        const visited = new Set();
        const temp = new Set();
        const visit = (nodeId) => {
            if (temp.has(nodeId)) {
                throw new Error('检测到循环依赖');
            }
            if (!visited.has(nodeId)) {
                temp.add(nodeId);
                const node = this.nodes.get(nodeId);
                node.dependencies.forEach(depId => visit(depId));
                temp.delete(nodeId);
                visited.add(nodeId);
                result.push(nodeId);
            }
        };
        for (const nodeId of this.nodes.keys()) {
            if (!visited.has(nodeId)) {
                visit(nodeId);
            }
        }
        return result.reverse();
    }
    getCriticalPath() {
        // 简化实现 - 实际应该使用最长路径算法
        const executionOrder = this.getExecutionOrder();
        return executionOrder.filter(nodeId => {
            const node = this.nodes.get(nodeId);
            return node.dependents.length === 0 || node.dependencies.length === 0;
        });
    }
    getNodeDepth(taskId) {
        const node = this.nodes.get(taskId);
        return node ? node.depth : 0;
    }
    _calculateDepths() {
        // 重置所有深度
        for (const node of this.nodes.values()) {
            node.depth = 0;
        }
        // 计算每个节点的深度
        const calculateDepth = (nodeId) => {
            const node = this.nodes.get(nodeId);
            if (node.depth > 0)
                return node.depth;
            if (node.dependencies.length === 0) {
                node.depth = 1;
                return 1;
            }
            const maxDepth = Math.max(...node.dependencies.map(calculateDepth));
            node.depth = maxDepth + 1;
            return node.depth;
        };
        for (const nodeId of this.nodes.keys()) {
            calculateDepth(nodeId);
        }
    }
}
//# sourceMappingURL=task-plan.js.map