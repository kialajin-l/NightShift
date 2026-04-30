// 临时类型定义 - 等待链接 @nightshift/core
declare module '@nightshift/core' {
  export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  export type AgentRole = 'scheduler' | 'frontend' | 'backend' | 'test';
  
  export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    agent: AgentRole;
    dependencies: string[];
    priority: number;
    estimatedTime?: number;
    actualTime?: number;
    input?: any;
    output?: any;
    error?: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    metadata?: Record<string, any>;
    
    isValid(): boolean;
    canStart(): boolean;
    getProgress(): number;
  }
  
  export interface TaskPlan {
    id: string;
    prompt: string;
    tasks: Task[];
    status: 'planning' | 'executing' | 'reviewing' | 'done';
    createdAt: Date;
    updatedAt: Date;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalEstimatedTime: number;
    
    getReadyTasks(): Task[];
    getCompletedCount(): number;
    getTotalProgress(): number;
    getExecutionOrder(): string[];
    validate(): { isValid: boolean; errors: string[]; warnings: string[] };
  }
  
  export class TaskFactory {
    static createTask(title: string, description: string, agent: AgentRole, priority?: number): Task;
    static createTaskPlanFromPrompt(prompt: string): TaskPlan;
  }
}