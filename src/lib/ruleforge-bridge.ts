// RuleForge 集成桥接层 - 连接 NightShift 会话系统与 RuleForge 引擎

import { 
  PatternRecognizer, 
  ParsedSession, 
  ParsedEvent, 
  CandidatePattern, 
  RecognitionResult,
  MockPatternRecognizer 
} from './types/ruleforge-mock';
import { Conversation } from '@/types';
import { Message } from '@/types-unified';
import { getConversation, getAllConversations } from './conversation-registry';

/**
 * RuleForge 桥接服务
 */
export class RuleForgeBridge {
  private recognizer: PatternRecognizer;
  private isInitialized: boolean = false;

  constructor() {
    this.recognizer = new MockPatternRecognizer({
      minConfidence: 0.6,
      minFrequency: 2,
      maxPatterns: 15
    });
    this.isInitialized = true;
  }

  /**
   * 将 NightShift 会话转换为 RuleForge 可解析的格式
   */
  private convertSessionToParsedSession(conversation: Conversation): ParsedSession {
    const events: ParsedEvent[] = [];
    
    // 分析消息内容，提取开发事件
    conversation.messages.forEach((message, index) => {
      const event = this.extractEventFromMessage(message, index);
      if (event) {
        events.push(event);
      }
    });

    // 推断项目类型和语言
    const projectType = this.inferProjectType(events);
    const language = this.inferLanguage(events);

    return {
      sessionId: conversation.id,
      events,
      metadata: {
        projectType,
        language
      }
    };
  }

  /**
   * 从消息中提取开发事件
   */
  private extractEventFromMessage(message: Message, index: number): ParsedEvent | null {
    const content = message.content.toLowerCase();
    const timestamp = (message as any).timestamp?.toISOString?.() || (message as any).createdAt || new Date().toISOString();

    // 检测错误相关事件
    if (content.includes('error') || content.includes('bug') || content.includes('fix')) {
      return {
        type: 'error_fixed',
        message: message.content,
        timestamp,
        metadata: { messageIndex: index }
      };
    }

    // 检测文件保存事件
    if (content.includes('file') || content.includes('create') || content.includes('save')) {
      return {
        type: 'file_saved',
        message: message.content,
        timestamp,
        metadata: { messageIndex: index }
      };
    }

    // 检测测试相关事件
    if (content.includes('test') || content.includes('spec') || content.includes('unit')) {
      return {
        type: 'test_run',
        message: message.content,
        timestamp,
        metadata: { messageIndex: index }
      };
    }

    // 检测终端命令事件
    if (content.includes('command') || content.includes('run') || content.includes('execute')) {
      return {
        type: 'terminal_command',
        message: message.content,
        timestamp,
        metadata: { messageIndex: index }
      };
    }

    return null;
  }

  /**
   * 推断项目类型
   */
  private inferProjectType(events: ParsedEvent[]): ParsedSession['metadata']['projectType'] {
    const content = events.map(e => e.message || '').join(' ').toLowerCase();
    
    if (content.includes('vue') || content.includes('component')) {
      return 'vue';
    } else if (content.includes('react') || content.includes('jsx')) {
      return 'react';
    } else if (content.includes('fastapi') || content.includes('flask')) {
      return 'fastapi';
    } else if (content.includes('node') || content.includes('express')) {
      return 'node';
    }
    
    return 'vue'; // 默认值
  }

  /**
   * 推断编程语言
   */
  private inferLanguage(events: ParsedEvent[]): ParsedSession['metadata']['language'] {
    const content = events.map(e => e.message || '').join(' ').toLowerCase();
    
    if (content.includes('typescript') || content.includes('.ts')) {
      return 'typescript';
    } else if (content.includes('python') || content.includes('.py')) {
      return 'python';
    }
    
    return 'typescript'; // 默认值
  }

  /**
   * 从会话中提取规则
   */
  async extractRulesFromSession(sessionId: string): Promise<RecognitionResult> {
    try {
      const conversation = getConversation(sessionId);
      if (!conversation) {
        throw new Error(`会话 ${sessionId} 不存在`);
      }

      const parsedSession = this.convertSessionToParsedSession(conversation as any);
      
      // 使用 RuleForge 识别模式
      const result = await this.recognizer.recognizePatterns(parsedSession);
      
      return result;
    } catch (error) {
      console.error('规则提取失败:', error);
      throw error;
    }
  }

  /**
   * 从所有会话中批量提取规则
   */
  async extractRulesFromAllSessions(): Promise<{
    sessionId: string;
    result: RecognitionResult;
  }[]> {
    const sessions = getAllConversations();
    const results = [];

    for (const session of sessions) {
      try {
        const sessionId = (session as any).id || (session as any).sessionId || 'unknown';
        const conversation = getConversation(sessionId);
        if (conversation && (conversation as any).messages?.length > 0) {
          const parsedSession = this.convertSessionToParsedSession(conversation as any);
          const result = await this.recognizer.recognizePatterns(parsedSession);
          
          results.push({
            sessionId: sessionId,
            result
          });
        }
      } catch (error) {
        console.error(`会话规则提取失败:`, error);
      }
    }

    return results;
  }

  /**
   * 获取高置信度规则（用于自动注入）
   */
  async getHighConfidenceRules(minConfidence: number = 0.8): Promise<CandidatePattern[]> {
    const allResults = await this.extractRulesFromAllSessions();
    const highConfidenceRules: CandidatePattern[] = [];

    allResults.forEach(({ result }) => {
      result.patterns.forEach(pattern => {
        if (pattern.confidence >= minConfidence) {
          highConfidenceRules.push(pattern);
        }
      });
    });

    // 去重并排序
    return this.deduplicateRules(highConfidenceRules)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 规则去重
   */
  private deduplicateRules(rules: CandidatePattern[]): CandidatePattern[] {
    const seen = new Set<string>();
    return rules.filter(rule => {
      const key = `${rule.category}-${rule.name}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 获取规则统计信息
   */
  async getRuleStats() {
    const allResults = await this.extractRulesFromAllSessions();
    
    const stats = {
      totalSessions: allResults.length,
      totalRules: 0,
      rulesByCategory: {
        code_style: 0,
        error_fix: 0,
        test_pattern: 0,
        api_design: 0
      },
      averageConfidence: 0,
      highConfidenceRules: 0
    };

    let totalConfidence = 0;

    allResults.forEach(({ result }) => {
      stats.totalRules += result.patterns.length;
      
      result.patterns.forEach(pattern => {
        const category = pattern.category as keyof typeof stats.rulesByCategory;
        if (category in stats.rulesByCategory) {
          stats.rulesByCategory[category]++;
        }
        totalConfidence += pattern.confidence;
        
        if (pattern.confidence >= 0.8) {
          stats.highConfidenceRules++;
        }
      });
    });

    stats.averageConfidence = stats.totalRules > 0 ? totalConfidence / stats.totalRules : 0;

    return stats;
  }

  /**
   * 检查桥接服务状态
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      recognizerConfig: {
        minConfidence: this.recognizer['config']?.minConfidence || 0.6,
        minFrequency: this.recognizer['config']?.minFrequency || 2,
        maxPatterns: this.recognizer['config']?.maxPatterns || 15
      },
      availableTemplates: this.getAvailableTemplates()
    };
  }

  /**
   * 获取可用模板信息
   */
  private getAvailableTemplates() {
    // 这里可以扩展为从 RuleForge 获取实际模板信息
    return {
      vue: 'Vue.js 最佳实践模板',
      fastapi: 'FastAPI 架构模式模板',
      test: '测试模式和最佳实践',
      total: 25 // 示例值
    };
  }
}

// 导出单例实例
export const ruleForgeBridge = new RuleForgeBridge();