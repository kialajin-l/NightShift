/**
 * AI 任务分解器
 * 基于 LLM 理解需求并智能拆解任务
 * 替换 MockTaskDecomposer，提供真正的 AI 驱动任务分解
 */

import { LLMClient } from './llm-client';
import { 
  Task, 
  TaskType, 
  TaskPriority, 
  TaskDecompositionResult,
  TaskDAG,
  TaskDecomposer
} from './types/task-types';

interface DecomposeParams {
  text: string;
  context: {
    projectType: string;
    technologyStack: string[];
    complexity: string;
  };
}

interface LLMDecompositionResult {
  tasks: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    agent: string;
    priority: string;
    estimatedTime: number;
    dependencies: string[];
    input: {
      requirements: string;
      specifications: Record<string, any>;
    };
    tags: string[];
  }>;
  metadata: {
    projectName: string;
    totalEstimatedTime: number;
    architecture: string;
    phases: string[];
  };
}

export class AITaskDecomposer implements TaskDecomposer {
  private llm: LLMClient;
  private logger: Console;

  constructor(llm?: LLMClient) {
    this.llm = llm || new LLMClient();
    this.logger = console;
  }

  async decompose(params: DecomposeParams): Promise<TaskDecompositionResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log('[AITaskDecomposer] 开始分解任务:', params.text.substring(0, 100) + '...');

      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(params);

      const response = await this.llm.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        responseFormat: 'json',
        temperature: 0.3, // 较低温度确保输出稳定
        maxTokens: 4096
      });

      const llmResult = this.parseLLMResponse(response.content);
      const result = this.transformToTaskResult(llmResult);

      const duration = Date.now() - startTime;
      this.logger.log(`[AITaskDecomposer] 任务分解完成: ${result.decomposedTasks.length} 个任务, 耗时: ${duration}ms`);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[AITaskDecomposer] 任务分解失败: ${error instanceof Error ? error.message : '未知错误'}, 耗时: ${duration}ms`);
      
      // 如果 AI 分解失败，回退到基础分解
      return this.fallbackDecomposition(params);
    }
  }

  private buildSystemPrompt(): string {
    return `你是一个专业的项目任务拆解专家。将用户的项目需求拆解为可执行的开发任务。

## 输出格式（严格 JSON，不要输出其他内容）

{
  "tasks": [
    {
      "id": "task-1",
      "name": "简短任务名称",
      "description": "详细描述，包含具体要做什么、技术要点、验收标准",
      "type": "component_generation | api_implementation | database_design | authentication_setup | testing | devops | infrastructure",
      "agent": "frontend | backend | fullstack | test",
      "priority": "critical | high | medium | low",
      "estimatedTime": 30,
      "dependencies": [],
      "input": {
        "requirements": "这个任务的具体需求",
        "specifications": {}
      },
      "tags": ["vue", "api", "jwt"]
    }
  ],
  "metadata": {
    "projectName": "项目名",
    "totalEstimatedTime": 120,
    "architecture": "monorepo | single | microservice",
    "phases": ["foundation", "backend", "frontend", "integration", "testing"]
  }
}

## 拆解原则
1. 每个任务 = 一个 Agent 可独立完成的工作单元
2. 粒度：单任务 15-60 分钟
3. 依赖关系准确：被依赖的必须先完成
4. agent 分配合理：前端组件→frontend，API/数据库→backend，测试→test
5. 优先级：基础设施 > 核心功能 > 辅助功能 > 测试
6. 完整项目通常 5-20 个任务
7. 每个任务的 description 要足够详细，让 Agent 不需要额外上下文就能执行

## 任务类型映射
- component_generation: 组件生成（前端组件、UI 界面）
- api_implementation: API 实现（后端接口、业务逻辑）
- database_design: 数据库设计（表结构、关系）
- authentication_setup: 认证设置（登录、权限）
- testing: 测试（单元测试、集成测试）
- devops: 运维（部署、配置）
- infrastructure: 基础设施（项目结构、配置）

## Agent 分配
- frontend: 前端组件、页面布局、样式
- backend: API 接口、数据库、业务逻辑
- fullstack: 全栈任务（前后端都需要）
- test: 测试代码、测试用例`;
  }

  private buildUserPrompt(params: DecomposeParams): string {
    const { text, context } = params;
    
    return `请将以下项目需求拆解为开发任务：

## 项目需求
${text}

## 项目上下文
- 项目类型：${context.projectType}
- 技术栈：${context.technologyStack.join(', ')}
- 复杂度：${context.complexity}

请按照系统提示的要求输出 JSON 格式的任务分解结果。`;
  }

  private parseLLMResponse(content: string): LLMDecompositionResult {
    try {
      // 尝试从内容中提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('LLM 响应中未找到有效的 JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]) as LLMDecompositionResult;
      
      // 基础验证
      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        throw new Error('LLM 响应格式错误：缺少 tasks 数组');
      }

      if (!parsed.metadata || typeof parsed.metadata !== 'object') {
        throw new Error('LLM 响应格式错误：缺少 metadata 对象');
      }

      return parsed;

    } catch (error) {
      this.logger.error('[AITaskDecomposer] JSON 解析失败:', error);
      throw new Error(`LLM 响应解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private transformToTaskResult(llmResult: LLMDecompositionResult): TaskDecompositionResult {
    const tasks: Task[] = [];

    // 转换任务
    for (const taskData of llmResult.tasks) {
      const task: Task = {
        id: taskData.id,
        name: taskData.name,
        description: taskData.description,
        type: this.mapTaskType(taskData.type),
        status: 'pending',
        priority: this.mapTaskPriority(taskData.priority),
        input: {
          requirements: taskData.input.requirements
        },
        technology: {},
        dependencies: taskData.dependencies,
        metadata: {},
        agent: taskData.agent,
        tags: taskData.tags,
        estimatedTime: taskData.estimatedTime,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      tasks.push(task);
    }

    // 构建依赖关系图
    const edges: Array<{ from: string; to: string }> = [];
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        edges.push({ from: depId, to: task.id });
      }
    }

    const dag: TaskDAG = {
      nodes: tasks,
      edges,
      estimatedTime: llmResult.metadata.totalEstimatedTime
    };

    return {
      success: true,
      decomposedTasks: tasks,
      dag,
      metadata: {
        projectName: llmResult.metadata.projectName,
        architecture: llmResult.metadata.architecture,
        phases: llmResult.metadata.phases
      }
    };
  }

  private mapTaskType(type: string): TaskType {
    const typeMap: Record<string, TaskType> = {
      'component_generation': 'component_generation',
      'api_implementation': 'api_implementation',
      'database_design': 'database_design',
      'authentication_setup': 'authentication_setup',
      'testing': 'testing',
      'devops': 'devops',
      'infrastructure': 'infrastructure'
    };

    return typeMap[type] || 'infrastructure';
  }

  private mapTaskPriority(priority: string): TaskPriority {
    const priorityMap: Record<string, TaskPriority> = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };

    return priorityMap[priority] || 'medium';
  }

  private fallbackDecomposition(params: DecomposeParams): TaskDecompositionResult {
    this.logger.warn('[AITaskDecomposer] 使用回退分解策略');

    // 基础任务分解（当 AI 分解失败时使用）
    const baseTasks: Task[] = [
      {
        id: 'task-1',
        name: '创建项目基础结构',
        description: '设置项目目录结构、配置文件、依赖管理',
        type: 'infrastructure',
        status: 'pending',
        priority: 'critical',
        input: { requirements: '创建基础项目结构' },
        technology: {},
        dependencies: [],
        metadata: {},
        agent: 'backend',
        tags: ['typescript', 'node'],
        estimatedTime: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'task-2',
        name: '实现核心功能',
        description: '根据需求实现核心业务逻辑',
        type: 'api_implementation',
        status: 'pending',
        priority: 'high',
        input: { requirements: '实现核心功能' },
        technology: {},
        dependencies: ['task-1'],
        metadata: {},
        agent: 'backend',
        tags: ['api', 'business'],
        estimatedTime: 45,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'task-3',
        name: '创建前端界面',
        description: '开发用户界面和交互逻辑',
        type: 'component_generation',
        status: 'pending',
        priority: 'high',
        input: { requirements: '创建前端界面' },
        technology: {},
        dependencies: ['task-2'],
        metadata: {},
        agent: 'frontend',
        tags: ['vue', 'react', 'ui'],
        estimatedTime: 60,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const dag: TaskDAG = {
      nodes: baseTasks,
      edges: [
        { from: 'task-1', to: 'task-2' },
        { from: 'task-2', to: 'task-3' }
      ],
      estimatedTime: 135
    };

    return {
      success: true,
      decomposedTasks: baseTasks,
      dag,
      metadata: {
        projectName: '回退项目',
        architecture: 'single',
        phases: ['foundation', 'backend', 'frontend']
      }
    };
  }

  // 验证任务分解结果的合理性
  validateDecomposition(result: TaskDecompositionResult): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (result.decomposedTasks.length === 0) {
      errors.push('任务列表为空');
    }

    if (result.dag.estimatedTime <= 0) {
      errors.push('总预估时间必须大于0');
    }

    // 检查任务 ID 唯一性
    const taskIds = new Set<string>();
    for (const task of result.decomposedTasks) {
      if (taskIds.has(task.id)) {
        errors.push(`任务 ID 重复: ${task.id}`);
      }
      taskIds.add(task.id);
    }

    // 检查依赖关系
    const validTaskIds = new Set(result.decomposedTasks.map(t => t.id));
    for (const edge of result.dag.edges) {
      if (!validTaskIds.has(edge.from)) {
        errors.push(`依赖任务不存在: ${edge.from}`);
      }
      if (!validTaskIds.has(edge.to)) {
        errors.push(`被依赖任务不存在: ${edge.to}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default AITaskDecomposer;