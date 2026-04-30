// src/lib/types/task-types.ts
// 主应用的权威 Task 类型定义

export type TaskType = 
  | 'component_generation'
  | 'api_implementation' 
  | 'database_design'
  | 'authentication_setup'
  | 'task_decomposition'
  | 'conflict_resolution'
  | 'testing'
  | 'devops'
  | 'infrastructure';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskInput {
  requirements: string;
  examples?: any[];
  specifications?: Record<string, any>;
  existingCode?: string;
}

export interface TechnologyStack {
  frontend?: {
    framework: 'vue' | 'react' | 'angular';
    language: 'typescript' | 'javascript';
    styling: 'tailwind' | 'css' | 'scss';
  };
  backend?: {
    framework: 'fastapi' | 'express' | 'spring';
    language: 'python' | 'javascript' | 'java';
    database: 'postgresql' | 'mysql' | 'mongodb';
  };
}

export interface Task {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  
  // 输入（来自 agent.ts）
  input: TaskInput;
  technology: TechnologyStack;
  
  // 调度（来自 scheduler-mock.ts）
  dependencies: string[];
  metadata: Record<string, any>;
  
  // Agent 分配
  agent: string;           // "frontend" | "backend" | "fullstack" | "test"
  tags: string[];
  
  // 时间
  estimatedTime: number;   // 分钟
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;        // v1.0 新增
  completedAt?: Date;      // v1.0 新增
  
  // 执行
  output?: any;            // v1.0 新增
  retryCount?: number;     // v1.0 新增
  
  // 分析
  analysis?: {
    complexity?: 'simple' | 'medium' | 'complex';
    quality?: number;
    [key: string]: any;
  };
}

export interface TaskDAG {
  nodes: Task[];
  edges: Array<{ from: string; to: string }>;
  estimatedTime: number;
}

export interface TaskDecompositionResult {
  success: boolean;
  decomposedTasks: Task[];
  dag: TaskDAG;
  errors?: string[];
  metadata?: Record<string, any>;
  // 兼容 scheduler-agent-new.ts 使用的字段
  tasks?: Task[];
  totalEstimatedTime?: number;
}

export interface TaskDecomposer {
  decompose(params: {
    text: string;
    context: {
      projectType: string;
      technologyStack: string[];
      complexity: string;
    };
  }): Promise<TaskDecompositionResult>;
}

export interface TaskManager {
  addTask(task: Task): Promise<string>;
  getTask(id: string): Promise<Task | null>;
  updateTaskStatus(id: string, status: TaskStatus, output?: any): Promise<void>;
  getPendingTasks(): Promise<Task[]>;
  getTaskDependencies(id: string): Promise<string[]>;
  
  // v1.0 新增方法
  start(): Promise<void>;
  shutdown(): Promise<void>;
  isRunning(): boolean;
  getStats(): TaskManagerStats;
  getAllTasks(): Task[];
  retryTask(taskId: string): Promise<boolean>;
  cancelTask(taskId: string): Promise<boolean>;
}

export interface TaskManagerStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface TaskOutput {
  success: boolean;
  generatedCode?: string;
  documentation?: string;
  executionTime?: number;
  tokensUsed?: number;
  model?: string;
  error?: string;
  analysis?: {
    quality?: number;
    complexity?: number;
    testCoverage?: number;
  };
  testCases?: any[];
}

export interface ExecutionContext {
  projectRoot?: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
  constraints?: string[];
  availableTools?: string[];
  // 兼容 scheduler-agent-new.ts 使用的字段
  projectType?: string;
  technologyStack?: string[];
  complexity?: string;
  dependencies?: string[];
}

export interface ExecutionResult {
  success: boolean;
  output: TaskOutput;
  executionTime: number;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  supportedTechnologies: string[];
  execute: (input: SkillInput, context: SkillContext) => Promise<SkillOutput>;
  validate: (input: SkillInput) => ValidationResult;
}

export interface SkillInput {
  requirements: string;
  parameters?: Record<string, any>;
  context?: Record<string, any>;
}

export interface SkillContext {
  task: Task;
  environment: ExecutionContext;
  availableTools: string[];
}

export interface SkillOutput {
  success: boolean;
  output: any;
  executionTime: number;
  error?: string;
}

// 类型导出结束