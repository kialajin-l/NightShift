/**
 * 增强的前端Agent - 集成LLM代码生成能力
 * 使用Phase 2实现的LLM增强BaseAgent
 */

import { LLMEnhancedBaseAgent } from './llm-enhanced-base-agent.js';
import { 
  Task, 
  TaskOutput, 
  Skill, 
  SkillInput, 
  SkillContext, 
  ExecutionContext,
  ExecutionResult,
  ValidationResult,
  AgentStatus
} from './types/agent.js';

/**
 * 增强的前端Agent
 */
export class FrontendAgentEnhanced extends LLMEnhancedBaseAgent {
  constructor() {
    // 创建模拟的skillManager和modelRouter
    const mockSkillManager: any = {
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
    };

    const mockModelRouter: any = {
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
    };

    super(
      'frontend-agent-enhanced',
      '前端 Agent (增强版)',
      '前端开发专家',
      'gpt-4',
      mockSkillManager,
      mockModelRouter,
      {
        temperature: 0.3, // 较低温度以获得更确定的代码
        maxTokens: 4000,
        enableStreaming: true,
        fallbackToMock: true
      }
    );
  }

  /**
   * 加载默认技能
   */
  protected async loadDefaultSkills(): Promise<void> {
    this.log('info', '加载前端Agent默认技能');
    
    // 这里可以注册具体的前端开发技能
    this.skills = [
      this.createVueComponentSkill(),
      this.createReactComponentSkill(),
      this.createStyleGenerationSkill(),
      this.createComponentTestingSkill()
    ];
  }

  /**
   * 验证任务是否适合此 Agent
   */
  protected validateTask(task: Task): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!task.id) {
      errors.push('任务必须包含ID');
    }

    if (!task.name) {
      errors.push('任务必须包含名称');
    }

    if (!task.description) {
      errors.push('任务必须包含描述');
    }

    // 检查是否适合前端开发
    if (!this.isFrontendTask(task)) {
      warnings.push('此任务可能更适合后端Agent处理');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 选择适合任务的技能
   */
  protected selectSkills(task: Task): Skill[] {
    const selectedSkills: Skill[] = [];

    // 根据任务类型选择技能
    if (task.type === 'component_generation') {
      if (task.technology?.frontend?.framework === 'vue') {
        selectedSkills.push(this.createVueComponentSkill());
      } else if (task.technology?.frontend?.framework === 'react') {
        selectedSkills.push(this.createReactComponentSkill());
      }
      
      selectedSkills.push(this.createStyleGenerationSkill());
    }

    // 总是包含测试技能
    selectedSkills.push(this.createComponentTestingSkill());

    return selectedSkills.length > 0 ? selectedSkills : this.skills.slice(0, 1);
  }

  /**
   * 执行任务的核心逻辑
   */
  protected async executeWithContext(context: ExecutionContext): Promise<ExecutionResult> {
    const { task } = context;
    const startTime = Date.now();

    try {
      this.log('info', `开始执行前端任务: ${task.name}`);

      // 使用LLM生成前端代码
      const generationResult = await this.generateFrontendCode(task);

      // 生成测试代码
      const testResult = await this.generateTests(generationResult.code, {
        testingFramework: 'vitest',
        coverageRequirements: '80%'
      });

      // 代码审查
      const reviewResult = await this.reviewCode(generationResult.code, task.description);

      const executionTime = Date.now() - startTime;

      const output: TaskOutput = {
        success: true,
        generatedCode: generationResult.code,
        documentation: generationResult.documentation || '', // 修复exactOptionalPropertyTypes问题
        testCases: [testResult.testCode],
        analysis: {
          complexity: this.estimateComplexity(task.description),
          quality: reviewResult.overallQuality,
          risks: reviewResult.issues.filter(issue => issue.type === 'error').map(issue => ({
            type: 'security',
            level: 'medium',
            description: issue.message,
            mitigation: issue.suggestion || '需要人工审查'
          })),
          improvements: reviewResult.improvements
        },
        recommendations: reviewResult.issues.map(issue => `${issue.type}: ${issue.message}`),
        executionTime,
        tokensUsed: 0, // 实际应该从LLM调用中获取
        model: this.model
      };

      this.log('info', `前端任务执行完成: ${task.name}, 耗时: ${executionTime}ms`);

      return {
        success: true,
        output,
        context,
        metrics: {
          totalTime: executionTime,
          skillExecutionCount: context.skills.length,
          tokensUsed: 0,
          qualityScore: reviewResult.overallQuality,
          errorCount: reviewResult.issues.filter(issue => issue.type === 'error').length
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.log('error', `前端任务执行失败: ${task.name}`, error);

      return {
        success: false,
        output: {
          success: false,
          executionTime,
          error: error instanceof Error ? error.message : String(error),
          model: this.model
        },
        context,
        metrics: {
          totalTime: executionTime,
          skillExecutionCount: 0,
          tokensUsed: 0,
          qualityScore: 0,
          errorCount: 1
        }
      };
    }
  }

  /**
   * 生成前端代码
   */
  private async generateFrontendCode(task: Task): Promise<{
    code: string;
    documentation?: string;
    explanation?: string;
  }> {
    const framework = task.technology?.frontend?.framework || 'vue';
    const language = task.technology?.frontend?.language || 'typescript';
    const styling = task.technology?.frontend?.styling || 'tailwind';

    const context = {
      technology: language,
      framework,
      styling,
      constraints: task.constraints?.map(c => c.description) || []
    };

    return await this.generateCode(task.description, context);
  }

  /**
   * 检查是否是前端任务
   */
  private isFrontendTask(task: Task): boolean {
    const frontendKeywords = [
      '组件', '界面', '页面', '前端', 'UI', '用户界面',
      'Vue', 'React', 'Angular', 'HTML', 'CSS', 'JavaScript',
      '样式', '布局', '响应式', '交互', '按钮', '表单',
      '导航', '菜单', '弹窗', '模态框', '列表', '表格'
    ];

    const taskText = `${task.name} ${task.description}`.toLowerCase();
    
    return frontendKeywords.some(keyword => 
      taskText.includes(keyword.toLowerCase())
    ) || !!task.technology?.frontend;
  }

  /**
   * 估算任务复杂度
   */
  private estimateComplexity(description: string): 'simple' | 'medium' | 'complex' {
    const wordCount = description.split(/\s+/).length;
    
    if (wordCount < 50) return 'simple';
    if (wordCount < 200) return 'medium';
    return 'complex';
  }

  /**
   * 创建Vue组件技能
   */
  private createVueComponentSkill(): Skill {
    return {
      id: 'vue-component-generation',
      name: 'Vue组件生成',
      description: '生成Vue 3组件代码',
      version: '1.0.0',
      capabilities: ['vue', 'component_generation', 'frontend'],
      supportedTechnologies: ['vue', 'typescript', 'javascript'],
      execute: async (input: SkillInput, _context: SkillContext) => {
        // 使用LLM生成Vue组件
        const result = await this.generateCode(input.requirements, {
          technology: 'typescript',
          framework: 'vue'
        });

        return {
          success: true,
          result: {
            code: result.code,
            type: 'vue-component',
            framework: 'vue'
          },
          metadata: {
            executionTime: 1000,
            qualityScore: 85
          }
        };
      },
      validate: (_input: SkillInput) => ({
        isValid: true,
        errors: [],
        warnings: []
      }),
      config: {}
    };
  }

  /**
   * 创建React组件技能
   */
  private createReactComponentSkill(): Skill {
    return {
      id: 'react-component-generation',
      name: 'React组件生成',
      description: '生成React组件代码',
      version: '1.0.0',
      capabilities: ['react', 'component_generation', 'frontend'],
      supportedTechnologies: ['react', 'typescript', 'javascript'],
      execute: async (input: SkillInput, _context: SkillContext) => {
        const result = await this.generateCode(input.requirements, {
          technology: 'typescript',
          framework: 'react'
        });

        return {
          success: true,
          result: {
            code: result.code,
            type: 'react-component',
            framework: 'react'
          },
          metadata: {
            executionTime: 1000,
            qualityScore: 85
          }
        };
      },
      validate: (_input: SkillInput) => ({
        isValid: true,
        errors: [],
        warnings: []
      }),
      config: {}
    };
  }

  /**
   * 创建样式生成技能
   */
  private createStyleGenerationSkill(): Skill {
    return {
      id: 'style-generation',
      name: '样式生成',
      description: '生成CSS/Tailwind样式代码',
      version: '1.0.0',
      capabilities: ['css', 'styling', 'design'],
      supportedTechnologies: ['css', 'tailwind', 'scss'],
      execute: async (input: SkillInput, context: SkillContext) => {
        const styling = input.task.technology?.frontend?.styling || 'tailwind';
        
        const result = await this.generateCode(
          `生成${styling}样式代码: ${input.requirements}`,
          {
            technology: styling
          }
        );

        return {
          success: true,
          result: {
            code: result.code,
            type: 'style',
            framework: styling
          },
          metadata: {
            executionTime: 500,
            qualityScore: 80
          }
        };
      },
      validate: (_input: SkillInput) => ({
        isValid: true,
        errors: [],
        warnings: []
      }),
      config: {}
    };
  }

  /**
   * 创建组件测试技能
   */
  private createComponentTestingSkill(): Skill {
    return {
      id: 'component-testing',
      name: '组件测试',
      description: '生成组件测试代码',
      version: '1.0.0',
      capabilities: ['testing', 'quality'],
      supportedTechnologies: ['vitest', 'jest', 'testing-library'],
      execute: async (input: SkillInput, _context: SkillContext) => {
        const code = input.context?.['existingCode'] || ''; // 使用方括号访问索引签名属性
        
        const result = await this.generateTests(code, {
          testingFramework: 'vitest'
        });

        return {
          success: true,
          result: {
            testCode: result.testCode,
            testCases: result.testCases,
            type: 'test'
          },
          metadata: {
            executionTime: 800,
            qualityScore: 75
          }
        };
      },
      validate: (_input: SkillInput) => ({
        isValid: true,
        errors: [],
        warnings: []
      }),
      config: {}
    };
  }

  /**
   * 获取Agent状态
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

// 导出单例实例
export const frontendAgentEnhanced = new FrontendAgentEnhanced();

export default FrontendAgentEnhanced;