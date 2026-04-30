/**
 * LLM 调用封装层
 * 提供统一的 LLM 调用接口，所有模块复用
 * 
 * 支持：
 * - 多渠道配置（OpenRouter、中转站等）
 * - 流式和非流式调用
 * - 自动重试和错误处理
 * - Token 用量统计
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  model?: string;              // 覆盖默认模型
  temperature?: number;        // 默认 0.7
  maxTokens?: number;          // 默认 4096
  responseFormat?: 'json' | 'text';
  timeout?: number;            // 超时毫秒数，默认 60000
}

interface ChatResponse {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: string;
}

interface LLMConfig {
  name: string;              // 渠道名，如 "openrouter"、"中转站A"
  baseUrl: string;           // API 地址
  apiKey: string;            // 密钥
  defaultModel: string;      // 该渠道的默认模型
  protocol: 'openai';        // v1.0 只支持 OpenAI 兼容协议
  headers?: Record<string, string>;  // 自定义请求头（某些中转站需要）
}

interface LLMClientConfig {
  primary: LLMConfig;
  secondary?: LLMConfig;     // 备用渠道
  fallbackToMock?: boolean;  // 失败时是否回退到 Mock
}

class LLMClient {
  private config: LLMClientConfig;
  private logger: Console;

  constructor(config?: LLMClientConfig) {
    if (config) {
      this.config = config;
    } else {
      // 从环境变量加载配置
      this.config = this.loadConfigFromEnv();
    }
    
    this.logger = console;
  }

  private loadConfigFromEnv(): LLMClientConfig {
    const primaryBaseUrl = process.env.LLM_PRIMARY_BASE_URL;
    const primaryApiKey = process.env.LLM_PRIMARY_API_KEY;
    const primaryDefaultModel = process.env.LLM_PRIMARY_DEFAULT_MODEL || 'anthropic/claude-sonnet-4';

    if (!primaryBaseUrl || !primaryApiKey) {
      throw new Error('LLM 配置缺失：请设置 LLM_PRIMARY_BASE_URL 和 LLM_PRIMARY_API_KEY 环境变量');
    }

    const config: LLMClientConfig = {
      primary: {
        name: 'primary',
        baseUrl: primaryBaseUrl,
        apiKey: primaryApiKey,
        defaultModel: primaryDefaultModel,
        protocol: 'openai'
      },
      fallbackToMock: process.env.USE_MOCK === 'true'
    };

    // 加载备用渠道（可选）
    const secondaryBaseUrl = process.env.LLM_SECONDARY_BASE_URL;
    const secondaryApiKey = process.env.LLM_SECONDARY_API_KEY;
    const secondaryDefaultModel = process.env.LLM_SECONDARY_DEFAULT_MODEL || 'gpt-4o';

    if (secondaryBaseUrl && secondaryApiKey) {
      config.secondary = {
        name: 'secondary',
        baseUrl: secondaryBaseUrl,
        apiKey: secondaryApiKey,
        defaultModel: secondaryDefaultModel,
        protocol: 'openai'
      };
    }

    return config;
  }

  private selectConfig(model?: string): LLMConfig {
    // 根据模型名称选择渠道
    if (model) {
      // 如果模型名包含渠道关键词，优先匹配
      if (model.includes('claude') && this.config.primary.defaultModel.includes('claude')) {
        return this.config.primary;
      }
      if (model.includes('gpt') && this.config.secondary?.defaultModel.includes('gpt')) {
        return this.config.secondary!;
      }
    }

    // 默认返回主渠道
    return this.config.primary;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      const config = this.selectConfig(options?.model);
      const model = options?.model || config.defaultModel;
      const timeout = options?.timeout || 60000;

      const requestBody: any = {
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096
      };

      if (options?.responseFormat === 'json') {
        requestBody.response_format = { type: 'json_object' };
      }

      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          ...config.headers
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      const result: ChatResponse = {
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        },
        finishReason: data.choices[0]?.finish_reason || 'stop'
      };

      const duration = Date.now() - startTime;
      this.logger.log(`[LLMClient] 调用成功: ${model}, tokens: ${result.usage.totalTokens}, 耗时: ${duration}ms`);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[LLMClient] 调用失败: ${error instanceof Error ? error.message : '未知错误'}, 耗时: ${duration}ms`);
      
      // 错误处理：429 限流等待重试，5xx 重试，4xx 抛出
      if (this.shouldRetry(error)) {
        return this.retryWithBackoff(messages, options, error);
      }
      
      throw error;
    }
  }

  async *chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string> {
    const config = this.selectConfig(options?.model);
    const model = options?.model || config.defaultModel;
    const timeout = options?.timeout || 60000;

    const requestBody: any = {
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      stream: true
    };

    if (options?.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...config.headers
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeout)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API 流式请求失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '' || trimmed === 'data: [DONE]') continue;
          
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const content = data.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (parseError) {
              // 忽略解析错误，继续处理下一行
              this.logger.warn('[LLMClient] 流式响应解析失败:', parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      // 网络错误或超时
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return true;
      }
      
      // 限流错误
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return true;
      }
      
      // 服务器错误
      if (error.message.includes('5')) {
        return true;
      }
    }
    return false;
  }

  private async retryWithBackoff(
    messages: ChatMessage[], 
    options?: ChatOptions, 
    originalError?: unknown
  ): Promise<ChatResponse> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1秒

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const delay = baseDelay * Math.pow(2, attempt - 1); // 指数退避
      
      this.logger.log(`[LLMClient] 重试 ${attempt}/${maxRetries}, ${delay}ms 后重试`);
      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        return await this.chat(messages, options);
      } catch (retryError) {
        if (attempt === maxRetries) {
          this.logger.error(`[LLMClient] 所有重试尝试均失败`);
          
          // 如果配置了回退到 Mock 模式
          if (this.config.fallbackToMock) {
            this.logger.warn('[LLMClient] 回退到 Mock 模式');
            return this.mockResponse(messages, options);
          }
          
          throw new Error(`LLM 调用失败，重试 ${maxRetries} 次后仍然失败: ${retryError instanceof Error ? retryError.message : '未知错误'}`);
        }
      }
    }

    throw new Error('重试逻辑异常');
  }

  private mockResponse(messages: ChatMessage[], options?: ChatOptions): ChatResponse {
    // Mock 响应，用于开发调试
    const lastMessage = messages[messages.length - 1]?.content || '';
    
    let content = '这是 Mock 响应。请设置正确的 LLM 配置以使用真实模型。';
    
    if (lastMessage.includes('任务分解')) {
      content = JSON.stringify({
        tasks: [
          {
            id: "task-1",
            name: "创建项目基础结构",
            description: "设置项目目录结构、配置文件、依赖管理",
            type: "infrastructure",
            agent: "backend",
            priority: "critical",
            estimatedTime: 30,
            dependencies: [],
            input: {
              requirements: "创建基础项目结构"
            },
            tags: ["typescript", "node"]
          }
        ],
        metadata: {
          projectName: "Mock 项目",
          totalEstimatedTime: 30,
          architecture: "monorepo",
          phases: ["foundation"]
        }
      }, null, 2);
    }

    return {
      content,
      model: options?.model || 'mock-model',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      finishReason: 'stop'
    };
  }

  // 获取渠道信息
  getConfigInfo(): { primary: LLMConfig; secondary?: LLMConfig } {
    return {
      primary: this.config.primary,
      secondary: this.config.secondary
    };
  }

  // 检查配置是否有效
  async validateConfig(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // 测试主渠道
      const testResponse = await fetch(`${this.config.primary.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.primary.apiKey}`
        }
      });

      if (!testResponse.ok) {
        errors.push(`主渠道验证失败: ${testResponse.status} ${testResponse.statusText}`);
      }
    } catch (error) {
      errors.push(`主渠道连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    // 测试备用渠道（如果存在）
    if (this.config.secondary) {
      try {
        const testResponse = await fetch(`${this.config.secondary.baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${this.config.secondary.apiKey}`
          }
        });

        if (!testResponse.ok) {
          errors.push(`备用渠道验证失败: ${testResponse.status} ${testResponse.statusText}`);
        }
      } catch (error) {
        errors.push(`备用渠道连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// 导出单例实例
export const llmClient = new LLMClient();

export { LLMClient };
export default LLMClient;