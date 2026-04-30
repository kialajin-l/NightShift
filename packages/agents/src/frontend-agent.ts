import { BaseAgent } from './base-agent';
import { Task, TaskOutput, Skill, SkillInput, SkillContext, AgentStatus } from './types/agent';

export class FrontendAgent extends BaseAgent {
  constructor() {
    super(
      'frontend-agent',
      '前端 Agent',
      '前端开发专家',
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
          capabilities: ['code_generation', 'analysis'],
          costPerToken: 0.00003,
          maxTokens: 8192,
          supportedLanguages: ['typescript', 'javascript', 'vue']
        }),
        trackPerformance: () => {}
      }
    );
  }

  protected async loadDefaultSkills(): Promise<void> {
    this.skills = [
      this.createVueComponentSkill(),
      this.createReactComponentSkill()
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
        generatedCode: this.generateComponent(task),
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

  private generateComponent(task: Task): string {
    return `<template>
  <div class="component">
    <h3>${task.name}</h3>
    <p>${task.description}</p>
  </div>
</template>

<script setup lang="ts">
// ${task.name} 组件
</script>

<style scoped>
.component {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 10px 0;
}

h3 {
  margin: 0 0 15px 0;
  color: #333;
}
</style>`;
  }

  private createVueComponentSkill(): Skill {
    return {
      id: 'vue-component',
      name: 'Vue组件生成',
      description: '生成Vue组件代码',
      version: '1.0.0',
      capabilities: ['vue', 'component_generation'],
      supportedTechnologies: ['vue', 'typescript'],
      execute: async (input: SkillInput, _context: SkillContext) => ({
        success: true,
        result: { code: '<template><div>Vue Component</div></template>' },
        metadata: { executionTime: 500 }
      }),
      validate: (_input: SkillInput) => ({ isValid: true, errors: [], warnings: [] }),
      config: {}
    };
  }

  private createReactComponentSkill(): Skill {
    return {
      id: 'react-component',
      name: 'React组件生成',
      description: '生成React组件代码',
      version: '1.0.0',
      capabilities: ['react', 'component_generation'],
      supportedTechnologies: ['react', 'typescript'],
      execute: async (input: SkillInput, _context: SkillContext) => ({
        success: true,
        result: { code: 'export default function Component() { return <div>React Component</div>; }' },
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