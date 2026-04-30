/**
 * 增强的后端Agent - 集成LLM代码生成能力
 * 使用Phase 2实现的LLM增强BaseAgent
 */

import { LLMEnhancedBaseAgent } from './llm-enhanced-base-agent.js';
import { 
  Task, 
  TaskOutput, 
  Skill, 
  SkillInput, 
  ExecutionContext,
  ExecutionResult,
  ValidationResult,
  AgentStatus
} from './types/agent.js';

/**
 * 增强的后端Agent
 */
export class BackendAgentEnhanced extends LLMEnhancedBaseAgent {
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
        capabilities: ['code_generation', 'analysis', 'api_design'],
        costPerToken: 0.00003,
        maxTokens: 8192,
        supportedLanguages: ['python', 'javascript', 'typescript']
      }),
      trackPerformance: () => {}
    };

    super(
      'backend-agent-enhanced',
      '后端 Agent (增强版)',
      '后端开发专家',
      'gpt-4',
      mockSkillManager,
      mockModelRouter,
      {
        temperature: 0.2, // 较低温度以获得更确定的代码
        maxTokens: 6000, // 后端代码通常更长
        enableStreaming: true,
        fallbackToMock: true
      }
    );
  }

  /**
   * 加载默认技能
   */
  protected async loadDefaultSkills(): Promise<void> {
    this.log('info', '加载后端Agent默认技能');
    
    this.skills = [
      this.createAPIImplementationSkill(),
      this.createDatabaseDesignSkill(),
      this.createAuthenticationSkill(),
      this.createBusinessLogicSkill(),
      this.createAPITestingSkill()
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

    // 检查是否适合后端开发
    if (!this.isBackendTask(task)) {
      warnings.push('此任务可能更适合前端Agent处理');
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
    if (task.type === 'api_implementation') {
      selectedSkills.push(this.createAPIImplementationSkill());
      selectedSkills.push(this.createAPITestingSkill());
    }

    if (task.type === 'database_design') {
      selectedSkills.push(this.createDatabaseDesignSkill());
    }

    if (task.type === 'authentication_setup') {
      selectedSkills.push(this.createAuthenticationSkill());
    }

    // 总是包含业务逻辑技能
    selectedSkills.push(this.createBusinessLogicSkill());

    return selectedSkills.length > 0 ? selectedSkills : this.skills.slice(0, 2);
  }

  /**
   * 执行任务的核心逻辑
   */
  protected async executeWithContext(context: ExecutionContext): Promise<ExecutionResult> {
    const { task } = context;
    const startTime = Date.now();

    try {
      this.log('info', `开始执行后端任务: ${task.name}`);

      // 根据任务类型执行不同的后端开发逻辑
      let generationResult;
      
      switch (task.type) {
        case 'api_implementation':
          generationResult = await this.generateAPIImplementation(task);
          break;
        case 'database_design':
          generationResult = await this.generateDatabaseDesign(task);
          break;
        case 'authentication_setup':
          generationResult = await this.generateAuthenticationSystem(task);
          break;
        default:
          generationResult = await this.generateGeneralBackendCode(task);
      }

      // 生成测试代码
      const testResult = await this.generateTests(generationResult.code, {
        testingFramework: 'pytest',
        coverageRequirements: '85%'
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
            level: 'high',
            description: issue.message,
            mitigation: issue.suggestion || '需要人工审查'
          })),
          improvements: reviewResult.improvements
        },
        recommendations: reviewResult.issues.map(issue => `${issue.type}: ${issue.message}`),
        executionTime,
        tokensUsed: 0,
        model: this.model
      };

      this.log('info', `后端任务执行完成: ${task.name}, 耗时: ${executionTime}ms`);

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
      this.log('error', `后端任务执行失败: ${task.name}`, error);

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
   * 生成API实现代码
   */
  private async generateAPIImplementation(task: Task): Promise<{
    code: string;
    documentation?: string;
    explanation?: string;
  }> {
    const framework = task.technology?.backend?.framework || 'fastapi';
    const language = task.technology?.backend?.language || 'python';

    const context = {
      technology: language,
      framework,
      constraints: task.constraints?.map(c => c.description) || []
    };

    const apiPrompt = `实现REST API: ${task.description}\n\n要求:\n- 使用${framework}框架\n- 包含完整的CRUD操作\n- 包含错误处理\n- 包含数据验证`;

    return await this.generateCode(apiPrompt, context);
  }

  /**
   * 生成数据库设计
   */
  private async generateDatabaseDesign(task: Task): Promise<{
    code: string;
    documentation?: string;
    explanation?: string;
  }> {
    const database = task.technology?.backend?.database || 'postgresql';

    const context = {
      technology: 'sql',
      framework: database,
      constraints: task.constraints?.map(c => c.description) || []
    };

    const dbPrompt = `设计数据库架构: ${task.description}\n\n要求:\n- 使用${database}数据库\n- 包含表结构设计\n- 包含索引和约束\n- 包含关系设计`;

    return await this.generateCode(dbPrompt, context);
  }

  /**
   * 生成认证系统
   */
  private async generateAuthenticationSystem(task: Task): Promise<{
    code: string;
    documentation?: string;
    explanation?: string;
  }> {
    const authType = task.technology?.backend?.authentication || 'jwt';
    const framework = task.technology?.backend?.framework || 'fastapi';

    const context = {
      technology: 'python',
      framework,
      constraints: ['安全', '认证', authType]
    };

    const authPrompt = `实现认证系统: ${task.description}\n\n要求:\n- 使用${authType}认证\n- 包含用户注册/登录\n- 包含权限控制\n- 包含安全措施`;

    return await this.generateCode(authPrompt, context);
  }

  /**
   * 生成通用后端代码
   */
  private async generateGeneralBackendCode(task: Task): Promise<{
    code: string;
    documentation?: string;
    explanation?: string;
  }> {
    const framework = task.technology?.backend?.framework || 'fastapi';
    const language = task.technology?.backend?.language || 'python';

    const context = {
      technology: language,
      framework,
      constraints: task.constraints?.map(c => c.description) || []
    };

    return await this.generateCode(task.description, context);
  }

  /**
   * 检查是否是后端任务
   */
  private isBackendTask(task: Task): boolean {
    const backendKeywords = [
      'API', '接口', '后端', '服务器', '数据库', '业务逻辑',
      'FastAPI', 'Express', 'Spring', 'Python', 'Java', 'Node.js',
      '认证', '授权', '安全', '性能', '缓存', '队列',
      '微服务', '架构', '部署', '运维', '监控'
    ];

    const taskText = `${task.name} ${task.description}`.toLowerCase();
    
    return backendKeywords.some(keyword => 
      taskText.includes(keyword.toLowerCase())
    ) || !!task.technology?.backend;
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
   * 创建API实现技能
   */
  private createAPIImplementationSkill(): Skill {
    return {
      id: 'api-implementation',
      name: 'API实现',
      description: '实现REST API接口',
      version: '1.0.0',
      capabilities: ['api', 'backend', 'rest'],
      supportedTechnologies: ['fastapi', 'express', 'spring'],
      execute: async (input: SkillInput, _context: any) => {
        const framework = input.task.technology?.backend?.framework || 'fastapi';
        
        const result = await this.generateAPIImplementation(input.task);

        return {
          success: true,
          result: {
            code: result.code,
            type: 'api',
            framework
          },
          metadata: {
            executionTime: 1500,
            qualityScore: 88
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
   * 创建数据库设计技能
   */
  private createDatabaseDesignSkill(): Skill {
    return {
      id: 'database-design',
      name: '数据库设计',
      description: '设计数据库架构和表结构',
      version: '1.0.0',
      capabilities: ['database', 'design', 'schema'],
      supportedTechnologies: ['postgresql', 'mysql', 'mongodb'],
      execute: async (input: SkillInput, _context: any) => {
        const database = input.task.technology?.backend?.database || 'postgresql';
        
        const result = await this.generateDatabaseDesign(input.task);

        return {
          success: true,
          result: {
            code: result.code,
            type: 'database',
            database
          },
          metadata: {
            executionTime: 1200,
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
   * 创建认证技能
   */
  private createAuthenticationSkill(): Skill {
    return {
      id: 'authentication',
      name: '认证系统',
      description: '实现用户认证和授权系统',
      version: '1.0.0',
      capabilities: ['security', 'authentication', 'authorization'],
      supportedTechnologies: ['jwt', 'oauth', 'session'],
      execute: async (input: SkillInput, _context: any) => {
        const result = await this.generateAuthenticationSystem(input.task);

        return {
          success: true,
          result: {
            code: result.code,
            type: 'authentication',
            method: input.task.technology?.backend?.authentication || 'jwt'
          },
          metadata: {
            executionTime: 1800,
            qualityScore: 90
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
   * 创建业务逻辑技能
   */
  private createBusinessLogicSkill(): Skill {
    return {
      id: 'business-logic',
      name: '业务逻辑',
      description: '实现核心业务逻辑',
      version: '1.0.0',
      capabilities: ['logic', 'business', 'processing'],
      supportedTechnologies: ['python', 'java', 'javascript'],
      execute: async (input: SkillInput, _context: any) => {
        const result = await this.generateGeneralBackendCode(input.task);

        return {
          success: true,
          result: {
            code: result.code,
            type: 'business-logic'
          },
          metadata: {
            executionTime: 1000,
            qualityScore: 82
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
   * 创建API测试技能
   */
  private createAPITestingSkill(): Skill {
    return {
      id: 'api-testing',
      name: 'API测试',
      description: '生成API测试代码',
      version: '1.0.0',
      capabilities: ['testing', 'api', 'quality'],
      supportedTechnologies: ['pytest', 'jest', 'mocha'],
      execute: async (input: SkillInput, _context: any) => {
        const code = input.context?.['existingCode'] || ''; // 使用方括号访问索引签名属性
        
        const result = await this.generateTests(code, {
          testingFramework: 'pytest'
        });

        return {
          success: true,
          result: {
            testCode: result.testCode,
            testCases: result.testCases,
            type: 'api-test'
          },
          metadata: {
            executionTime: 900,
            qualityScore: 78
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
export const backendAgentEnhanced = new BackendAgentEnhanced();

export default BackendAgentEnhanced;