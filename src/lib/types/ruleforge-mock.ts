// RuleForge 模拟类型定义

/**
 * 模式识别器接口
 */
export interface PatternRecognizer {
  recognizePatterns(session: ParsedSession): Promise<RecognitionResult>;
  config?: {
    minConfidence?: number;
    minFrequency?: number;
    maxPatterns?: number;
  };
}

/**
 * 解析的会话接口
 */
export interface ParsedSession {
  sessionId: string;
  events: ParsedEvent[];
  metadata: Record<string, any>;
}

/**
 * 解析的事件接口
 */
export interface ParsedEvent {
  type: string;
  message: string;
  timestamp: string;
  metadata: Record<string, any>;
}

/**
 * 候选模式接口
 */
export interface CandidatePattern {
  id: string;
  name: string;
  description: string;
  confidence: number;
  frequency: number;
  category: string;
  metadata: Record<string, any>;
}

/**
 * 识别结果接口
 */
export interface RecognitionResult {
  success: boolean;
  patterns: CandidatePattern[];
  errors?: string[];
  metadata?: Record<string, any>;
}

/**
 * 模拟模式识别器实现
 */
export class MockPatternRecognizer implements PatternRecognizer {
  config: {
    minConfidence: number;
    minFrequency: number;
    maxPatterns: number;
  };

  constructor(config: {
    minConfidence: number;
    minFrequency: number;
    maxPatterns: number;
  }) {
    this.config = config;
  }

  async recognizePatterns(session: ParsedSession): Promise<RecognitionResult> {
    // 模拟模式识别逻辑
    const patterns: CandidatePattern[] = [];
    
    // 分析事件类型
    const eventTypes = session.events.map(event => event.type);
    const typeCounts = eventTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 生成候选模式
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count >= this.config.minFrequency) {
        const confidence = Math.min(0.9, count / session.events.length);
        
        if (confidence >= this.config.minConfidence) {
          patterns.push({
            id: `pattern-${type}-${Date.now()}`,
            name: `${type}_pattern`,
            description: `检测到 ${count} 个 ${type} 类型事件`,
            confidence,
            frequency: count,
            category: 'code_style',
            metadata: {
              eventType: type,
              totalEvents: session.events.length
            }
          });
        }
      }
    }

    // 限制模式数量
    const limitedPatterns = patterns
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxPatterns);

    return {
      success: true,
      patterns: limitedPatterns,
      metadata: {
        totalEvents: session.events.length,
        uniqueEventTypes: Object.keys(typeCounts).length,
        analyzedAt: new Date().toISOString()
      }
    };
  }
}