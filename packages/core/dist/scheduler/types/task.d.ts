/**
 * 任务调度 Agent 类型定义
 */
export interface Task {
    id: string;
    name: string;
    description: string;
    agent: TaskAgent;
    dependencies: string[];
    estimatedTime?: number;
    priority: TaskPriority;
    input?: Record<string, any>;
    output?: Record<string, any>;
    status: TaskStatus;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export type TaskAgent = 'frontend' | 'backend' | 'test' | 'design' | 'devops' | 'documentation';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed';
export interface TaskDependency {
    from: string;
    to: string;
    type: 'hard' | 'soft';
}
export interface TaskDecompositionResult {
    tasks: Task[];
    dependencies: TaskDependency[];
    estimatedTotalTime: number;
    criticalPath: string[];
    warnings: string[];
    suggestions: string[];
}
export interface NaturalLanguageInput {
    text: string;
    context?: {
        projectType?: string;
        technologyStack?: string[];
        teamSize?: number;
        deadline?: Date;
        constraints?: string[];
    };
}
export interface KeywordAnalysisResult {
    keywords: string[];
    categories: TaskCategory[];
    technologyStack: string[];
    complexity: 'simple' | 'medium' | 'complex';
    confidence: number;
}
export type TaskCategory = 'authentication' | 'ui_component' | 'api_endpoint' | 'database' | 'testing' | 'deployment' | 'documentation';
export interface RuleForgeIntegration {
    loadRules(): Promise<TaskTemplate[]>;
    matchPatterns(input: NaturalLanguageInput): Promise<TaskTemplate[]>;
    validateTaskDependencies(tasks: Task[]): Promise<ValidationResult>;
}
export interface TaskTemplate {
    id: string;
    name: string;
    description: string;
    category: TaskCategory;
    agent: TaskAgent;
    defaultDependencies: string[];
    estimatedTime: {
        min: number;
        max: number;
        average: number;
    };
    inputSchema?: Record<string, any>;
    outputSchema?: Record<string, any>;
    keywords: string[];
    technologyPatterns: string[];
    priority: TaskPriority;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
}
/**
 * DAG 节点接口
 */
export interface DAGNode {
    task: Task;
    dependencies: string[];
    dependents: string[];
    level: number;
}
/**
 * 任务依赖图接口
 */
export interface DAG {
    nodes: Map<string, DAGNode>;
    criticalPath: string[];
    estimatedTime: number;
}
export interface ConversationState {
    sessionId: string;
    currentInput: NaturalLanguageInput;
    previousTasks: Task[];
    clarificationQuestions: string[];
    confirmedRequirements: string[];
    context: Record<string, any>;
}
export interface DAGNode {
    id: string;
    task: Task;
    dependencies: string[];
    dependents: string[];
}
export interface DAG {
    nodes: Map<string, DAGNode>;
    edges: TaskDependency[];
    hasCycle: boolean;
    topologicalOrder: string[];
    criticalPath: string[];
}
//# sourceMappingURL=task.d.ts.map