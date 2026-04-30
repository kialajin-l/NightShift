/**
 * NightShift 任务调度 Agent - 核心任务分解器
 * 将自然语言 PRD 自动拆解为结构化任务列表
 */

import { 
  Task, 
  TaskDecompositionResult, 
  NaturalLanguageInput, 
  KeywordAnalysisResult,
  TaskCategory,
  TaskAgent,
  TaskPriority,
  TaskDependency,
  DAG,
  DAGNode,
  ConversationState
} from './types/task.js';
import { RuleForgeIntegration, TaskTemplate } from './types/task.js';

/**
 * 关键词分析器
 */
class KeywordAnalyzer {
  private readonly authenticationKeywords = [
    '登录', '注册', '认证', '密码', '邮箱', '手机', '验证码', '记住我',
    'login', 'register', 'auth', 'password', 'email', 'phone', 'otp', 'remember'
  ];

  private readonly uiComponentKeywords = [
    '页面', '组件', '按钮', '表单', '输入框', '弹窗', '导航', '菜单',
    'page', 'component', 'button', 'form', 'input', 'modal', 'navigation', 'menu'
  ];

  private readonly apiKeywords = [
    '接口', 'API', '端点', '请求', '响应', '数据', '数据库',
    'endpoint', 'request', 'response', 'data', 'database'
  ];

  private readonly technologyKeywords = {
    frontend: ['vue', 'react', 'angular', 'typescript', 'javascript', 'html', 'css'],
    backend: ['node', 'python', 'java', 'spring', 'fastapi', 'express', 'database'],
    test: ['测试', '单元测试', '集成测试', 'e2e', 'test', 'unit', 'integration']
  };

  /**
   * 分析自然语言输入，提取关键词和分类
   */
  analyze(input: NaturalLanguageInput): KeywordAnalysisResult {
    const text = input.text.toLowerCase();
    const keywords: string[] = [];
    const categories: TaskCategory[] = [];
    const technologyStack: string[] = [];

    // 提取关键词
    const allKeywords = [
      ...this.authenticationKeywords,
      ...this.uiComponentKeywords,
      ...this.apiKeywords,
      ...Object.values(this.technologyKeywords).flat()
    ];

    for (const keyword of allKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    }

    // 分类识别
    if (this.authenticationKeywords.some(k => text.includes(k))) {
      categories.push('authentication');
    }
    if (this.uiComponentKeywords.some(k => text.includes(k))) {
      categories.push('ui_component');
    }
    if (this.apiKeywords.some(k => text.includes(k))) {
      categories.push('api_endpoint');
    }

    // 技术栈推断
    for (const [stack, techKeywords] of Object.entries(this.technologyKeywords)) {
      if (techKeywords.some(k => text.includes(k))) {
        technologyStack.push(stack);
      }
    }

    // 复杂度评估
    const wordCount = text.split(/\s+/).length;
    const keywordDensity = keywords.length / wordCount;
    const complexity = this.assessComplexity(wordCount, keywordDensity, categories.length);

    // 置信度计算
    const confidence = this.calculateConfidence(keywords.length, categories.length);

    return {
      keywords,
      categories,
      technologyStack: [...new Set(technologyStack)],
      complexity,
      confidence
    };
  }

  private assessComplexity(wordCount: number, keywordDensity: number, categoryCount: number): 'simple' | 'medium' | 'complex' {
    const score = wordCount * 0.3 + keywordDensity * 40 + categoryCount * 20;
    
    if (score < 50) return 'simple';
    if (score < 100) return 'medium';
    return 'complex';
  }

  private calculateConfidence(keywordCount: number, categoryCount: number): number {
    const baseConfidence = Math.min(keywordCount * 0.1 + categoryCount * 0.2, 0.8);
    return Math.round(baseConfidence * 100) / 100;
  }
}

/**
 * 依赖推断器
 */
class DependencyResolver {
  /**
   * 推断任务间的依赖关系
   */
  resolveDependencies(tasks: Task[]): TaskDependency[] {
    const dependencies: TaskDependency[] = [];
    const taskMap = new Map(tasks.map(task => [task.id, task]));

    for (const task of tasks) {
      // 前端组件依赖后端 API
      if (task.agent === 'frontend' && task.tags.includes('api_consumer')) {
        const backendTasks = tasks.filter(t => 
          t.agent === 'backend' && t.tags.includes('api_provider')
        );
        
        for (const backendTask of backendTasks) {
          dependencies.push({
            from: task.id,
            to: backendTask.id,
            type: 'hard'
          });
        }
      }

      // 测试依赖功能实现
      if (task.agent === 'test') {
        const functionalTasks = tasks.filter(t => 
          t.agent !== 'test' && !t.tags.includes('infrastructure')
        );
        
        for (const functionalTask of functionalTasks) {
          dependencies.push({
            from: task.id,
            to: functionalTask.id,
            type: 'hard'
          });
        }
      }

      // 数据库依赖后端逻辑
      if (task.tags.includes('database')) {
        const backendTasks = tasks.filter(t => 
          t.agent === 'backend' && t.tags.includes('data_access')
        );
        
        for (const backendTask of backendTasks) {
          dependencies.push({
            from: backendTask.id,
            to: task.id,
            type: 'hard'
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * 检测循环依赖
   */
  detectCycles(dependencies: TaskDependency[], tasks: Task[]): string[] {
    const graph = new Map<string, string[]>();
    
    // 构建邻接表
    for (const task of tasks) {
      graph.set(task.id, []);
    }
    
    for (const dep of dependencies) {
      graph.get(dep.from)!.push(dep.to);
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];

    const dfs = (node: string, path: string[]): boolean => {
      if (recursionStack.has(node)) {
        cycles.push([...path, node].join(' -> '));
        return true;
      }
      
      if (visited.has(node)) return false;
      
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      
      for (const neighbor of graph.get(node) || []) {
        if (dfs(neighbor, path)) {
          return true;
        }
      }
      
      path.pop();
      recursionStack.delete(node);
      return false;
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        dfs(task.id, []);
      }
    }

    return cycles;
  }
}

/**
 * DAG 生成器
 */
class DAGGenerator {
  /**
   * 生成任务依赖图
   */
  generateDAG(tasks: Task[], dependencies: TaskDependency[]): DAG {
    const nodes = new Map<string, DAGNode>();
    
    // 初始化节点
    for (const task of tasks) {
      nodes.set(task.id, {
        id: task.id,
        task,
        dependencies: [],
        dependents: []
      });
    }

    // 构建依赖关系
    for (const dep of dependencies) {
      const fromNode = nodes.get(dep.from);
      const toNode = nodes.get(dep.to);
      
      if (fromNode && toNode) {
        fromNode.dependencies.push(dep.to);
        toNode.dependents.push(dep.from);
      }
    }

    // 检测循环依赖
    const cycles = new DependencyResolver().detectCycles(dependencies, tasks);
    const hasCycle = cycles.length > 0;

    // 拓扑排序
    const topologicalOrder = hasCycle ? [] : this.topologicalSort(nodes);

    // 关键路径分析
    const criticalPath = hasCycle ? [] : this.findCriticalPath(nodes, topologicalOrder);

    return {
      nodes,
      edges: dependencies,
      hasCycle,
      topologicalOrder,
      criticalPath
    };
  }

  /**
   * 拓扑排序
   */
  private topologicalSort(nodes: Map<string, DAGNode>): string[] {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];

    // 计算入度
    for (const [id, node] of nodes) {
      inDegree.set(id, node.dependencies.length);
      if (node.dependencies.length === 0) {
        queue.push(id);
      }
    }

    // Kahn 算法
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const node = nodes.get(nodeId)!;
      for (const dependentId of node.dependents) {
        const currentInDegree = inDegree.get(dependentId)! - 1;
        inDegree.set(dependentId, currentInDegree);
        
        if (currentInDegree === 0) {
          queue.push(dependentId);
        }
      }
    }

    return result;
  }

  /**
   * 寻找关键路径
   */
  private findCriticalPath(nodes: Map<string, DAGNode>, topologicalOrder: string[]): string[] {
    if (topologicalOrder.length === 0) return [];

    const earliestStart = new Map<string, number>();
    const latestStart = new Map<string, number>();

    // 正向计算最早开始时间
    for (const nodeId of topologicalOrder) {
      const node = nodes.get(nodeId)!;
      let maxTime = 0;
      
      for (const depId of node.dependencies) {
        maxTime = Math.max(maxTime, earliestStart.get(depId)! + (node.task.estimatedTime || 0));
      }
      
      earliestStart.set(nodeId, maxTime);
    }

    // 反向计算最晚开始时间
    const totalTime = Math.max(...Array.from(earliestStart.values()));
    
    for (let i = topologicalOrder.length - 1; i >= 0; i--) {
      const nodeId = topologicalOrder[i];
      const node = nodes.get(nodeId)!;
      
      let minTime = totalTime;
      for (const dependentId of node.dependents) {
        minTime = Math.min(minTime, latestStart.get(dependentId)! - (node.task.estimatedTime || 0));
      }
      
      latestStart.set(nodeId, minTime === totalTime ? totalTime : minTime);
    }

    // 找出关键路径
    const criticalPath: string[] = [];
    for (const nodeId of topologicalOrder) {
      if (earliestStart.get(nodeId) === latestStart.get(nodeId)) {
        criticalPath.push(nodeId);
      }
    }

    return criticalPath;
  }
}

/**
 * RuleForge 集成器
 */
class RuleForgeIntegrator implements RuleForgeIntegration {
  private taskTemplates: TaskTemplate[] = [
    {
      id: 'auth-login-page',
      name: '登录页面',
      description: '实现用户登录界面，包含邮箱密码输入和记住我功能',
      category: 'authentication',
      agent: 'frontend',
      defaultDependencies: ['auth-api-login'],
      estimatedTime: { min: 120, max: 240, average: 180 },
      keywords: ['登录', '邮箱', '密码', '记住我', 'login', 'email', 'password'],
      technologyPatterns: ['vue', 'react', 'typescript'],
      priority: 'high'
    },
    {
      id: 'auth-api-login',
      name: '登录 API',
      description: '实现用户登录后端接口，包含密码验证和 token 生成',
      category: 'authentication',
      agent: 'backend',
      defaultDependencies: ['auth-database'],
      estimatedTime: { min: 90, max: 180, average: 120 },
      keywords: ['登录', '认证', 'API', 'token', 'login', 'auth', 'api'],
      technologyPatterns: ['node', 'python', 'fastapi'],
      priority: 'high'
    },
    {
      id: 'auth-register-page',
      name: '注册页面',
      description: '实现用户注册界面，包含表单验证和注册入口',
      category: 'authentication',
      agent: 'frontend',
      defaultDependencies: ['auth-api-register'],
      estimatedTime: { min: 150, max: 300, average: 200 },
      keywords: ['注册', '表单', '验证', 'register', 'form', 'validation'],
      technologyPatterns: ['vue', 'react', 'typescript'],
      priority: 'medium'
    }
  ];

  async loadRules(): Promise<TaskTemplate[]> {
    // 这里可以集成 RuleForge 的实际规则加载
    return this.taskTemplates;
  }

  async matchPatterns(input: NaturalLanguageInput): Promise<TaskTemplate[]> {
    const text = input.text.toLowerCase();
    const matchedTemplates: TaskTemplate[] = [];

    for (const template of this.taskTemplates) {
      const matchScore = template.keywords.filter(keyword => 
        text.includes(keyword.toLowerCase())
      ).length;

      if (matchScore > 0) {
        matchedTemplates.push(template);
      }
    }

    return matchedTemplates;
  }

  async validateTaskDependencies(tasks: Task[]): Promise<{ isValid: boolean; errors: string[]; warnings: string[]; suggestions: string[]; }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 检查前端任务是否有对应的后端 API
    const frontendTasks = tasks.filter(t => t.agent === 'frontend');
    const backendTasks = tasks.filter(t => t.agent === 'backend');

    for (const frontendTask of frontendTasks) {
      const hasBackendSupport = backendTasks.some(backendTask =>
        backendTask.name.includes(frontendTask.name.replace('页面', 'API').replace('Page', 'API'))
      );

      if (!hasBackendSupport) {
        warnings.push(`前端任务 "${frontendTask.name}" 缺少对应的后端 API 支持`);
      }
    }

    // 检查关键任务是否被标记为高优先级
    const criticalTasks = tasks.filter(t => 
      t.tags.includes('authentication') || t.tags.includes('core_functionality')
    );

    for (const criticalTask of criticalTasks) {
      if (criticalTask.priority !== 'high' && criticalTask.priority !== 'critical') {
        suggestions.push(`建议将关键任务 "${criticalTask.name}" 的优先级设置为 high`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }
}

/**
 * 对话管理器
 */
class ConversationManager {
  private sessions = new Map<string, ConversationState>();

  createSession(sessionId: string): ConversationState {
    const state: ConversationState = {
      sessionId,
      currentInput: { text: '' },
      previousTasks: [],
      clarificationQuestions: [],
      confirmedRequirements: [],
      context: {}
    };

    this.sessions.set(sessionId, state);
    return state;
  }

  updateSession(sessionId: string, input: NaturalLanguageInput, tasks: Task[]): ConversationState {
    const state = this.sessions.get(sessionId) || this.createSession(sessionId);
    
    state.currentInput = input;
    state.previousTasks = tasks;
    
    // 生成澄清问题
    state.clarificationQuestions = this.generateClarificationQuestions(input, tasks);
    
    this.sessions.set(sessionId, state);
    return state;
  }

  private generateClarificationQuestions(input: NaturalLanguageInput, tasks: Task[]): string[] {
    const questions: string[] = [];
    const text = input.text.toLowerCase();

    // 检查技术栈是否明确
    if (!text.includes('vue') && !text.includes('react') && !text.includes('angular')) {
      questions.push('请明确前端技术栈（Vue/React/Angular）？');
    }

    if (!text.includes('node') && !text.includes('python') && !text.includes('java')) {
      questions.push('请明确后端技术栈（Node.js/Python/Java）？');
    }

    // 检查功能细节
    if (text.includes('登录') && !text.includes('注册')) {
      questions.push('是否需要用户注册功能？');
    }

    if (text.includes('记住我') && !text.includes('token')) {
      questions.push('是否需要实现 token 自动刷新功能？');
    }

    return questions.slice(0, 3); // 最多返回3个问题
  }
}

/**
 * 主任务分解器
 */
export class TaskDecomposer {
  private keywordAnalyzer: KeywordAnalyzer;
  private dependencyResolver: DependencyResolver;
  private dagGenerator: DAGGenerator;
  private ruleForgeIntegrator: RuleForgeIntegrator;
  private conversationManager: ConversationManager;

  constructor() {
    this.keywordAnalyzer = new KeywordAnalyzer();
    this.dependencyResolver = new DependencyResolver();
    this.dagGenerator = new DAGGenerator();
    this.ruleForgeIntegrator = new RuleForgeIntegrator();
    this.conversationManager = new ConversationManager();
  }

  /**
   * 主分解方法
   */
  async decompose(
    input: NaturalLanguageInput, 
    sessionId?: string
  ): Promise<TaskDecompositionResult> {
    // 关键词分析
    const analysis = this.keywordAnalyzer.analyze(input);
    
    // 规则匹配
    const matchedTemplates = await this.ruleForgeIntegrator.matchPatterns(input);
    
    // 生成任务列表
    const tasks = this.generateTasksFromTemplates(matchedTemplates, analysis);
    
    // 推断依赖关系
    const dependencies = this.dependencyResolver.resolveDependencies(tasks);
    
    // 检测循环依赖
    const cycles = this.dependencyResolver.detectCycles(dependencies, tasks);
    
    // 生成 DAG
    const dag = this.dagGenerator.generateDAG(tasks, dependencies);
    
    // 验证任务依赖
    const validation = await this.ruleForgeIntegrator.validateTaskDependencies(tasks);
    
    // 对话管理
    if (sessionId) {
      this.conversationManager.updateSession(sessionId, input, tasks);
    }

    // 计算总时间
    const estimatedTotalTime = tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);

    return {
      tasks,
      dependencies,
      estimatedTotalTime,
      criticalPath: dag.criticalPath,
      warnings: [...validation.warnings, ...(cycles.length > 0 ? ['发现循环依赖: ' + cycles.join(', ')] : [])],
      suggestions: validation.suggestions
    };
  }

  /**
   * 从模板生成具体任务
   */
  private generateTasksFromTemplates(templates: TaskTemplate[], analysis: KeywordAnalysisResult): Task[] {
    const tasks: Task[] = [];
    
    for (const template of templates) {
      const task: Task = {
        id: this.generateTaskId(template.id),
        name: template.name,
        description: template.description,
        agent: template.agent,
        dependencies: [...template.defaultDependencies],
        estimatedTime: template.estimatedTime.average,
        priority: template.priority,
        status: 'pending',
        tags: [template.category, ...template.technologyPatterns],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      tasks.push(task);
    }

    return tasks;
  }

  /**
   * 生成唯一任务 ID
   */
  private generateTaskId(baseId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${baseId}-${timestamp}-${random}`;
  }

  /**
   * 获取对话状态
   */
  getConversationState(sessionId: string): ConversationState | undefined {
    return this.conversationManager['sessions'].get(sessionId);
  }

  /**
   * 获取澄清问题
   */
  async getClarificationQuestions(sessionId: string): Promise<string[]> {
    const state = this.getConversationState(sessionId);
    return state?.clarificationQuestions || [];
  }
}