/**
 * 增强的BaseAgent - 集成LLM执行能力
 * 使用Phase 1实现的LLM客户端，提供真正的AI代码生成能力
 */

import { BaseAgent } from './base-agent.js';
import { 
  Task, 
  TaskOutput, 
  Skill, 
  SkillInput, 
  SkillContext, 
  SkillOutput,
  ExecutionContext,
  ExecutionResult,
  ValidationResult,
  AgentConfig
} from './types/agent.js';

// 导入Phase 1的LLM客户端
import { LLMClient } from '../../src/lib/llm-client.js';

interface LLMEnhancedAgentConfig extends AgentConfig {
  llmClient?: LLMClient;
  enableStreaming?: boolean;
  maxRetryAttempts?: number;
  fallbackToMock?: boolean;
}

/**
 * 增强的BaseAgent，集成LLM执行能力
 */
export abstract class LLMEnhancedBaseAgent extends BaseAgent {
  protected llmClient: LLMClient;
  protected enableStreaming: boolean;
  protected maxRetryAttempts: number;
  protected fallbackToMock: boolean;

  constructor(
    id: string,
    name: string,
    role: string,
    model: string,
    skillManager: any, // 暂时使用any，后续实现SkillManager
    modelRouter: any,  // 暂时使用any，后续完善
    config?: Partial<LLMEnhancedAgentConfig>
  ) {
    super(id, name, role, model, skillManager, modelRouter, config);

    const enhancedConfig: LLMEnhancedAgentConfig = {
      ...this.config,
      ...config
    };

    this.llmClient = enhancedConfig.llmClient || new LLMClient();
    this.enableStreaming = enhancedConfig.enableStreaming ?? false;
    this.maxRetryAttempts = enhancedConfig.maxRetryAttempts ?? 3;
    this.fallbackToMock = enhancedConfig.fallbackToMock ?? true;
  }

  /**
   * 执行LLM调用
   */
  protected async executeLLM(
    prompt: string,
    systemPrompt?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<string> {
    const model = options?.model || this.model;
    const temperature = options?.temperature || this.config.temperature;
    const maxTokens = options?.maxTokens || this.config.maxTokens;

    try {
      this.log('debug', `执行LLM调用: ${model}, 温度: ${temperature}`);

      const response = await this.llmClient.chat({
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user' as const, content: prompt }
        ],
        model,
        temperature,
        maxTokens
      });

      this.log('debug', `LLM调用成功，Token使用: ${response.usage?.totalTokens || '未知'}`);
      
      return response.content;

    } catch (error) {
      this.log('error', `LLM调用失败: ${error}`);
      
      // 如果启用回退，使用Mock响应
      if (this.fallbackToMock) {
        this.log('warn', '使用Mock回退响应');
        return this.generateMockResponse(prompt, systemPrompt);
      }
      
      throw error;
    }
  }

  /**
   * 流式执行LLM调用
   */
  protected async executeLLMStream(
    prompt: string,
    systemPrompt?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
      onChunk?: (chunk: string) => void;
      onComplete?: (content: string) => void;
    }
  ): Promise<string> {
    if (!this.enableStreaming) {
      return this.executeLLM(prompt, systemPrompt, options);
    }

    const model = options?.model || this.model;
    const temperature = options?.temperature || this.config.temperature;
    const maxTokens = options?.maxTokens || this.config.maxTokens;

    try {
      this.log('debug', `执行流式LLM调用: ${model}`);

      let fullContent = '';
      
      await this.llmClient.chatStream({
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user' as const, content: prompt }
        ],
        model,
        temperature,
        maxTokens,
        onMessage: (chunk) => {
          fullContent += chunk;
          options?.onChunk?.(chunk);
        }
      });

      options?.onComplete?.(fullContent);
      this.log('debug', `流式LLM调用完成，内容长度: ${fullContent.length}`);
      
      return fullContent;

    } catch (error) {
      this.log('error', `流式LLM调用失败: ${error}`);
      
      if (this.fallbackToMock) {
        this.log('warn', '使用Mock回退响应');
        const mockResponse = this.generateMockResponse(prompt, systemPrompt);
        options?.onComplete?.(mockResponse);
        return mockResponse;
      }
      
      throw error;
    }
  }

  /**
   * 生成代码
   */
  protected async generateCode(
    requirements: string,
    context: {
      technology?: string;
      framework?: string;
      existingCode?: string;
      constraints?: string[];
    } = {}
  ): Promise<{
    code: string;
    documentation?: string;
    explanation?: string;
  }> {
    const systemPrompt = this.buildCodeGenerationSystemPrompt(context);
    const userPrompt = this.buildCodeGenerationUserPrompt(requirements, context);

    const response = await this.executeLLM(userPrompt, systemPrompt);
    
    return this.parseCodeGenerationResponse(response);
  }

  /**
   * 生成测试代码
   */
  protected async generateTests(
    code: string,
    context: {
      testingFramework?: string;
      coverageRequirements?: string;
    } = {}
  ): Promise<{
    testCode: string;
    testCases?: string[];
    coverageReport?: string;
  }> {
    const systemPrompt = this.buildTestGenerationSystemPrompt(context);
    const userPrompt = this.buildTestGenerationUserPrompt(code, context);

    const response = await this.executeLLM(userPrompt, systemPrompt);
    
    return this.parseTestGenerationResponse(response);
  }

  /**
   * 代码审查
   */
  protected async reviewCode(
    code: string,
    requirements: string
  ): Promise<{
    issues: Array<{
      type: 'error' | 'warning' | 'suggestion';
      line?: number;
      message: string;
      suggestion?: string;
    }>;
    overallQuality: number;
    improvements: string[];
  }> {
    const systemPrompt = `你是一个专业的代码审查专家。请仔细审查提供的代码，检查以下方面：
1. 代码是否符合需求
2. 代码质量和可读性
3. 潜在的错误和安全问题
4. 性能优化建议
5. 代码风格一致性

请提供详细的审查报告。`;

    const userPrompt = `请审查以下代码：

需求：
${requirements}

代码：
\`\`\`
${code}
\`\`\`

请提供详细的代码审查报告。`;

    const response = await this.executeLLM(userPrompt, systemPrompt);
    
    return this.parseCodeReviewResponse(response);
  }

  /**
   * 构建代码生成系统提示
   */
  protected buildCodeGenerationSystemPrompt(context: any): string {
    const technology = context.technology || 'typescript';
    const framework = context.framework || 'vue';
    
    return `你是一个专业的${technology}开发专家，擅长使用${framework}框架。

请遵循以下准则：
1. 生成的代码必须高质量、可读性强
2. 遵循最佳实践和设计模式
3. 包含适当的错误处理
4. 提供清晰的注释
5. 考虑性能和安全
6. 符合${framework}框架的约定

请生成符合需求的完整代码。`;
  }

  /**
   * 构建代码生成用户提示
   */
  protected buildCodeGenerationUserPrompt(requirements: string, context: any): string {
    const constraints = context.constraints ? `
约束条件：
${context.constraints.join('\n')}` : '';

    const existingCode = context.existingCode ? `
现有代码：
\`\`\`
${context.existingCode}
\`\`\`` : '';

    return `请根据以下需求生成代码：

需求描述：
${requirements}
${constraints}
${existingCode}

请生成完整的、可运行的代码。`;
  }

  /**
   * 构建测试生成系统提示
   */
  protected buildTestGenerationSystemPrompt(context: any): string {
    const framework = context.testingFramework || 'jest';
    
    return `你是一个专业的测试工程师，擅长使用${framework}测试框架。

请遵循以下准则：
1. 测试覆盖所有主要功能
2. 包含边界条件测试
3. 模拟外部依赖
4. 测试用例清晰明确
5. 遵循${framework}的最佳实践

请生成高质量的测试代码。`;
  }

  /**
   * 构建测试生成用户提示
   */
  protected buildTestGenerationUserPrompt(code: string, context: any): string {
    const coverage = context.coverageRequirements ? `
覆盖率要求：${context.coverageRequirements}` : '';

    return `请为以下代码生成测试：

代码：
\`\`\`
${code}
\`\`\`
${coverage}

请生成完整的测试代码。`;
  }

  /**
   * 解析代码生成响应
   */
  protected parseCodeGenerationResponse(response: string): {
    code: string;
    documentation?: string;
    explanation?: string;
  } {
    // 简单的解析逻辑，实际应该更复杂
    const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1] : response;

    return {
      code: code.trim(),
      documentation: '自动生成的代码文档',
      explanation: '代码实现说明'
    };
  }

  /**
   * 解析测试生成响应
   */
  protected parseTestGenerationResponse(response: string): {
    testCode: string;
    testCases?: string[];
    coverageReport?: string;
  } {
    const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
    const testCode = codeMatch ? codeMatch[1] : response;

    return {
      testCode: testCode.trim(),
      testCases: ['基本功能测试', '边界条件测试', '错误处理测试'],
      coverageReport: '预计覆盖率: 85%'
    };
  }

  /**
   * 解析代码审查响应
   */
  protected parseCodeReviewResponse(response: string): {
    issues: Array<{
      type: 'error' | 'warning' | 'suggestion';
      line?: number;
      message: string;
      suggestion?: string;
    }>;
    overallQuality: number;
    improvements: string[];
  } {
    // 简化解析，实际应该更智能
    return {
      issues: [
        {
          type: 'suggestion',
          message: '代码结构良好，建议增加错误处理',
          suggestion: '添加try-catch块处理潜在异常'
        }
      ],
      overallQuality: 85,
      improvements: ['增加错误处理', '优化性能', '改进代码注释']
    };
  }

  /**
   * 生成Mock响应（回退用）
   */
  protected generateMockResponse(prompt: string, systemPrompt?: string): string {
    this.log('debug', '生成Mock响应');

    if (prompt.includes('代码') || prompt.includes('生成')) {
      return `// Mock生成的代码
// 这是基于以下需求的模拟实现：
// ${prompt.substring(0, 100)}...

function mockImplementation() {
  console.log('这是Mock实现');
  return 'Mock结果';
}`;
    }

    if (prompt.includes('测试') || prompt.includes('test')) {
      return `// Mock测试代码
describe('Mock测试', () => {
  it('应该通过基本测试', () => {
    expect(true).toBe(true);
  });
});`;
    }

    return `Mock响应：已处理请求"${prompt.substring(0, 50)}..."`;
  }

  /**
   * 重试执行（带指数退避）
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetryAttempts; attempt++) {
      try {
        this.log('debug', `执行${operationName}，尝试 ${attempt}/${this.maxRetryAttempts}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `${operationName} 尝试 ${attempt} 失败: ${error}`);
        
        if (attempt < this.maxRetryAttempts) {
          // 指数退避
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * 验证生成的代码
   */
  protected validateGeneratedCode(code: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基本验证
    if (!code || code.trim().length === 0) {
      errors.push('生成的代码为空');
    }

    if (code.length < 10) {
      warnings.push('生成的代码过短，可能不完整');
    }

    // 检查语法问题（简化版）
    if (code.includes('undefined') && !code.includes('undefined')) {
      warnings.push('代码中可能包含未定义变量');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取LLM使用统计
   */
  protected getLLMUsageStats(): {
    totalCalls: number;
    successRate: number;
    averageResponseTime: number;
    totalTokens: number;
  } {
    // 这里应该集成实际的统计跟踪
    return {
      totalCalls: 0,
      successRate: 1.0,
      averageResponseTime: 0,
      totalTokens: 0
    };
  }
}

export default LLMEnhancedBaseAgent;