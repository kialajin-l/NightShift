import { BaseAgent } from './base-agent';
import { Task, TaskOutput, Skill, SkillInput, SkillContext, AgentStatus } from './types/agent';

export class BackendAgent extends BaseAgent {
  constructor() {
    super(
      'backend-agent',
      '后端 Agent',
      '后端开发专家',
      'gpt-4',
      {
        registerSkill: () => {},
        unregisterSkill: () => {},
        findSkills: () => [],
        getSkill: () => null,
        composeSkills: () => ({
          id: 'composite',
          name: 'composite',
          skills: [],
          execute: async () => ({ success: true, result: {}, metadata: { executionTime: 0 } })
        })
      },
      {
        route: () => 'gpt-4',
        getModelInfo: () => ({
          name: 'GPT-4',
          provider: 'openai',
          capabilities: ['code_generation', 'analysis', 'api_design'],
          costPerToken: 0.00003,
          maxTokens: 8192,
          supportedLanguages: ['python', 'javascript', 'typescript']
        }),
        trackPerformance: () => {}
      }
    );
  }

  protected async loadDefaultSkills(): Promise<void> {
    this.skills = [
      this.createAPIImplementationSkill(),
      this.createDatabaseDesignSkill()
    ];
  }

  protected validateTask(task: Task): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!task.id) errors.push('任务必须包含ID');
    if (!task.name) errors.push('任务必须包含名称');
    if (!task.description) errors.push('任务必须包含描述');

    return { isValid: errors.length === 0, errors, warnings };
  }

  protected selectSkills(task: Task): Skill[] {
    return this.skills;
  }

  protected async executeWithContext(context: any): Promise<any> {
    const { task } = context;
    
    return {
      success: true,
      output: {
        success: true,
        generatedCode: this.generateAPI(task),
        executionTime: 1000,
        model: this.model
      },
      context,
      metrics: {
        totalTime: 1000,
        skillExecutionCount: 1,
        tokensUsed: 0,
        qualityScore: 0.8,
        errorCount: 0
      }
    };
  }

  private generateAPI(task: Task): string {
    return `# ${task.name} API
# ${task.description}

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class ${task.name.replace(/\s+/g, '')}Request(BaseModel):
    pass

class ${task.name.replace(/\s+/g, '')}Response(BaseModel):
    pass

@app.post("/api/${task.name.toLowerCase().replace(/\s+/g, '-')}")
async def ${task.name.toLowerCase().replace(/\s+/g, '_')}(request: ${task.name.replace(/\s+/g, '')}Request):
    # TODO: 实现业务逻辑
    return ${task.name.replace(/\s+/g, '')}Response()`;
  }

  private createAPIImplementationSkill(): Skill {
    return {
      id: 'api-implementation',
      name: 'API实现',
      description: '实现REST API接口',
      version: '1.0.0',
      capabilities: ['api', 'backend', 'rest'],
      supportedTechnologies: ['fastapi', 'express', 'spring'],
      execute: async (input: SkillInput, _context: SkillContext) => ({
        success: true,
        result: { code: 'def api(): pass' },
        metadata: { executionTime: 500 }
      }),
      validate: (_input: SkillInput) => ({ isValid: true, errors: [], warnings: [] }),
      config: {}
    };
  }

  private createDatabaseDesignSkill(): Skill {
    return {
      id: 'database-design',
      name: '数据库设计',
      description: '设计数据库架构和表结构',
      version: '1.0.0',
      capabilities: ['database', 'design', 'schema'],
      supportedTechnologies: ['postgresql', 'mysql', 'mongodb'],
      execute: async (input: SkillInput, _context: SkillContext) => ({
        success: true,
        result: { code: 'CREATE TABLE example (id INT PRIMARY KEY);' },
        metadata: { executionTime: 500 }
      }),
      validate: (_input: SkillInput) => ({ isValid: true, errors: [], warnings: [] }),
      config: {}
    };
  }

  /**
   * 获取 Agent 信息
   */
  override getStatus(): AgentStatus {
    return {
      isReady: true,
      isBusy: false,
      completedTasks: 0,
      successRate: 0,
      averageExecutionTime: 0
    };
  }
}