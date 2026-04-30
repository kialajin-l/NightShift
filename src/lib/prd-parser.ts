/**
 * PRD解析器 - 解析产品需求文档，提取结构化需求信息
 */

import LLMClient from './llm-client';

interface PRDParserConfig {
  llmClient?: LLMClient;
  enableDetailedAnalysis?: boolean;
  maxRetryAttempts?: number;
}

interface PRDContent {
  title: string;
  description: string;
  version: string;
  stakeholders: string[];
  businessObjectives: string[];
  userStories: UserStory[];
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  constraints: Constraint[];
  assumptions: Assumption[];
  risks: Risk[];
  timeline?: Timeline;
  successMetrics: SuccessMetric[];
}

interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedEffort?: number; // 小时
  dependencies?: string[];
}

interface FunctionalRequirement {
  id: string;
  title: string;
  description: string;
  userStories: string[];
  priority: 'high' | 'medium' | 'low';
  complexity: 'simple' | 'medium' | 'complex';
}

interface NonFunctionalRequirement {
  id: string;
  category: 'performance' | 'security' | 'usability' | 'reliability' | 'scalability';
  description: string;
  metrics: string[];
  priority: 'high' | 'medium' | 'low';
}

interface Constraint {
  id: string;
  type: 'technical' | 'business' | 'regulatory';
  description: string;
  impact: 'high' | 'medium' | 'low';
}

interface Assumption {
  id: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

interface Risk {
  id: string;
  description: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

interface Timeline {
  startDate?: Date;
  endDate?: Date;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  name: string;
  date: Date;
  deliverables: string[];
}

interface SuccessMetric {
  id: string;
  name: string;
  target: string;
  measurement: string;
}

interface ParsingResult {
  success: boolean;
  prd: PRDContent;
  confidence: number; // 0-100
  warnings: string[];
  errors: string[];
  parsingTime: number;
}

export class PRDParser {
  private llmClient: LLMClient;
  private config: Required<PRDParserConfig>;
  private logger: Console;

  constructor(config: PRDParserConfig = {}) {
    this.config = {
      llmClient: config.llmClient || new LLMClient(),
      enableDetailedAnalysis: config.enableDetailedAnalysis ?? true,
      maxRetryAttempts: config.maxRetryAttempts ?? 3
    };

    this.llmClient = this.config.llmClient;
    this.logger = console;
  }

  /**
   * 解析PRD文档
   */
  async parsePRD(prdText: string): Promise<ParsingResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log('[PRDParser] 开始解析PRD文档');

      // 使用LLM进行智能解析
      const analysisResult = await this.analyzePRDWithLLM(prdText);
      
      // 提取结构化信息
      const prdContent = this.extractStructuredContent(analysisResult, prdText);
      
      // 验证解析结果
      const validation = this.validateParsingResult(prdContent);

      const parsingTime = Date.now() - startTime;

      this.logger.log(`[PRDParser] PRD解析完成，耗时: ${parsingTime}ms`);

      return {
        success: validation.isValid,
        prd: prdContent,
        confidence: this.calculateConfidence(prdContent, validation),
        warnings: validation.warnings,
        errors: validation.errors,
        parsingTime
      };

    } catch (error) {
      const parsingTime = Date.now() - startTime;
      this.logger.error('[PRDParser] PRD解析失败:', error);

      return {
        success: false,
        prd: this.createEmptyPRD(),
        confidence: 0,
        warnings: [],
        errors: [error instanceof Error ? error.message : '解析过程出错'],
        parsingTime
      };
    }
  }

  /**
   * 使用LLM分析PRD
   */
  private async analyzePRDWithLLM(prdText: string): Promise<string> {
    const systemPrompt = `你是一个专业的产品需求分析师。请仔细分析提供的PRD文档，提取以下关键信息：

1. 产品概述和核心目标
2. 用户故事和功能需求
3. 非功能性需求
4. 约束条件和假设
5. 风险评估
6. 时间线和成功指标

请以结构化的JSON格式返回分析结果。`;

    const userPrompt = `请分析以下PRD文档：

${prdText}

请提供详细的结构化分析结果。`;

    const response = await this.llmClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      model: 'gpt-4',
      temperature: 0.1,
      maxTokens: 4000
    });

    return response.content;
  }

  /**
   * 提取结构化内容
   */
  private extractStructuredContent(llmResponse: string, originalText: string): PRDContent {
    try {
      // 尝试解析LLM返回的JSON
      const parsed = JSON.parse(this.extractJSONFromResponse(llmResponse));
      return this.normalizePRDContent(parsed);
    } catch (error) {
      // 如果JSON解析失败，使用启发式规则提取
      this.logger.warn('[PRDParser] JSON解析失败，使用启发式规则');
      return this.extractWithHeuristics(originalText);
    }
  }

  /**
   * 从响应中提取JSON
   */
  private extractJSONFromResponse(response: string): string {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    // 如果找不到JSON，返回空对象
    return '{}';
  }

  /**
   * 标准化PRD内容
   */
  private normalizePRDContent(rawData: any): PRDContent {
    return {
      title: rawData.title || '未命名产品',
      description: rawData.description || '',
      version: rawData.version || '1.0.0',
      stakeholders: Array.isArray(rawData.stakeholders) ? rawData.stakeholders : [],
      businessObjectives: Array.isArray(rawData.businessObjectives) ? rawData.businessObjectives : [],
      userStories: this.normalizeUserStories(rawData.userStories),
      functionalRequirements: this.normalizeFunctionalRequirements(rawData.functionalRequirements),
      nonFunctionalRequirements: this.normalizeNonFunctionalRequirements(rawData.nonFunctionalRequirements),
      constraints: this.normalizeConstraints(rawData.constraints),
      assumptions: this.normalizeAssumptions(rawData.assumptions),
      risks: this.normalizeRisks(rawData.risks),
      timeline: this.normalizeTimeline(rawData.timeline),
      successMetrics: this.normalizeSuccessMetrics(rawData.successMetrics)
    };
  }

  /**
   * 标准化用户故事
   */
  private normalizeUserStories(stories: any): UserStory[] {
    if (!Array.isArray(stories)) return [];
    
    return stories.map((story, index) => ({
      id: story.id || `us-${index + 1}`,
      title: story.title || `用户故事 ${index + 1}`,
      description: story.description || '',
      acceptanceCriteria: Array.isArray(story.acceptanceCriteria) ? story.acceptanceCriteria : [],
      priority: this.normalizePriority(story.priority),
      estimatedEffort: typeof story.estimatedEffort === 'number' ? story.estimatedEffort : undefined,
      dependencies: Array.isArray(story.dependencies) ? story.dependencies : []
    }));
  }

  /**
   * 标准化功能需求
   */
  private normalizeFunctionalRequirements(requirements: any): FunctionalRequirement[] {
    if (!Array.isArray(requirements)) return [];
    
    return requirements.map((req, index) => ({
      id: req.id || `fr-${index + 1}`,
      title: req.title || `功能需求 ${index + 1}`,
      description: req.description || '',
      userStories: Array.isArray(req.userStories) ? req.userStories : [],
      priority: this.normalizePriority(req.priority),
      complexity: this.normalizeComplexity(req.complexity)
    }));
  }

  /**
   * 标准化非功能需求
   */
  private normalizeNonFunctionalRequirements(requirements: any): NonFunctionalRequirement[] {
    if (!Array.isArray(requirements)) return [];
    
    return requirements.map((req, index) => ({
      id: req.id || `nfr-${index + 1}`,
      category: this.normalizeNFCategory(req.category),
      description: req.description || '',
      metrics: Array.isArray(req.metrics) ? req.metrics : [],
      priority: this.normalizePriority(req.priority)
    }));
  }

  /**
   * 标准化约束条件
   */
  private normalizeConstraints(constraints: any): Constraint[] {
    if (!Array.isArray(constraints)) return [];
    
    return constraints.map((constraint, index) => ({
      id: constraint.id || `c-${index + 1}`,
      type: this.normalizeConstraintType(constraint.type),
      description: constraint.description || '',
      impact: this.normalizeImpact(constraint.impact)
    }));
  }

  /**
   * 标准化假设
   */
  private normalizeAssumptions(assumptions: any): Assumption[] {
    if (!Array.isArray(assumptions)) return [];
    
    return assumptions.map((assumption, index) => ({
      id: assumption.id || `a-${index + 1}`,
      description: assumption.description || '',
      confidence: this.normalizeConfidence(assumption.confidence)
    }));
  }

  /**
   * 标准化风险
   */
  private normalizeRisks(risks: any): Risk[] {
    if (!Array.isArray(risks)) return [];
    
    return risks.map((risk, index) => ({
      id: risk.id || `r-${index + 1}`,
      description: risk.description || '',
      probability: this.normalizeProbability(risk.probability),
      impact: this.normalizeImpact(risk.impact),
      mitigation: risk.mitigation || ''
    }));
  }

  /**
   * 标准化时间线
   */
  private normalizeTimeline(timeline: any): Timeline | undefined {
    if (!timeline) return undefined;
    
    return {
      startDate: timeline.startDate ? new Date(timeline.startDate) : undefined,
      endDate: timeline.endDate ? new Date(timeline.endDate) : undefined,
      milestones: this.normalizeMilestones(timeline.milestones)
    };
  }

  /**
   * 标准化里程碑
   */
  private normalizeMilestones(milestones: any): Milestone[] {
    if (!Array.isArray(milestones)) return [];
    
    return milestones.map((milestone, index) => ({
      id: milestone.id || `m-${index + 1}`,
      name: milestone.name || `里程碑 ${index + 1}`,
      date: new Date(milestone.date || Date.now()),
      deliverables: Array.isArray(milestone.deliverables) ? milestone.deliverables : []
    }));
  }

  /**
   * 标准化成功指标
   */
  private normalizeSuccessMetrics(metrics: any): SuccessMetric[] {
    if (!Array.isArray(metrics)) return [];
    
    return metrics.map((metric, index) => ({
      id: metric.id || `sm-${index + 1}`,
      name: metric.name || `指标 ${index + 1}`,
      target: metric.target || '',
      measurement: metric.measurement || ''
    }));
  }

  /**
   * 使用启发式规则提取
   */
  private extractWithHeuristics(text: string): PRDContent {
    // 简化的启发式提取逻辑
    return {
      title: this.extractTitle(text),
      description: text.substring(0, 500),
      version: '1.0.0',
      stakeholders: [],
      businessObjectives: this.extractObjectives(text),
      userStories: this.extractUserStories(text),
      functionalRequirements: [],
      nonFunctionalRequirements: [],
      constraints: [],
      assumptions: [],
      risks: [],
      successMetrics: []
    };
  }

  /**
   * 提取标题
   */
  private extractTitle(text: string): string {
    const titleMatch = text.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : '未命名产品';
  }

  /**
   * 提取目标
   */
  private extractObjectives(text: string): string[] {
    const objectiveMatches = text.match(/目标[:：]\s*([^\n]+)/gi);
    return objectiveMatches ? objectiveMatches.map(obj => obj.replace(/目标[:：]\s*/, '')) : [];
  }

  /**
   * 提取用户故事
   */
  private extractUserStories(text: string): UserStory[] {
    const storyMatches = text.match(/作为(.+?)我希望(.+?)以便(.+?)(?=\n|$)/gi);
    if (!storyMatches) return [];

    return storyMatches.map((story, index) => ({
      id: `us-heuristic-${index + 1}`,
      title: `用户故事 ${index + 1}`,
      description: story,
      acceptanceCriteria: [],
      priority: 'medium',
      dependencies: []
    }));
  }

  /**
   * 验证解析结果
   */
  private validateParsingResult(prd: PRDContent): { isValid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 基本验证
    if (!prd.title || prd.title === '未命名产品') {
      warnings.push('产品标题缺失或为默认值');
    }

    if (prd.description.length < 50) {
      warnings.push('产品描述可能过于简短');
    }

    if (prd.userStories.length === 0) {
      warnings.push('未发现用户故事');
    }

    if (prd.functionalRequirements.length === 0 && prd.userStories.length === 0) {
      errors.push('未发现任何功能需求');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * 计算解析置信度
   */
  private calculateConfidence(prd: PRDContent, validation: any): number {
    let confidence = 100;

    // 根据验证结果调整置信度
    confidence -= validation.warnings.length * 5;
    confidence -= validation.errors.length * 20;

    // 根据内容完整性调整
    if (prd.userStories.length === 0) confidence -= 30;
    if (prd.functionalRequirements.length === 0) confidence -= 20;
    if (prd.description.length < 100) confidence -= 10;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * 创建空的PRD内容
   */
  private createEmptyPRD(): PRDContent {
    return {
      title: '解析失败',
      description: '',
      version: '1.0.0',
      stakeholders: [],
      businessObjectives: [],
      userStories: [],
      functionalRequirements: [],
      nonFunctionalRequirements: [],
      constraints: [],
      assumptions: [],
      risks: [],
      successMetrics: []
    };
  }

  /**
   * 标准化枚举值
   */
  private normalizePriority(priority: any): 'high' | 'medium' | 'low' {
    if (['high', 'medium', 'low'].includes(priority)) {
      return priority as 'high' | 'medium' | 'low';
    }
    return 'medium';
  }

  private normalizeComplexity(complexity: any): 'simple' | 'medium' | 'complex' {
    if (['simple', 'medium', 'complex'].includes(complexity)) {
      return complexity as 'simple' | 'medium' | 'complex';
    }
    return 'medium';
  }

  private normalizeNFCategory(category: any): 'performance' | 'security' | 'usability' | 'reliability' | 'scalability' {
    const validCategories = ['performance', 'security', 'usability', 'reliability', 'scalability'];
    if (validCategories.includes(category)) {
      return category as any;
    }
    return 'performance';
  }

  private normalizeConstraintType(type: any): 'technical' | 'business' | 'regulatory' {
    if (['technical', 'business', 'regulatory'].includes(type)) {
      return type as 'technical' | 'business' | 'regulatory';
    }
    return 'technical';
  }

  private normalizeImpact(impact: any): 'high' | 'medium' | 'low' {
    return this.normalizePriority(impact);
  }

  private normalizeConfidence(confidence: any): 'high' | 'medium' | 'low' {
    return this.normalizePriority(confidence);
  }

  private normalizeProbability(probability: any): 'high' | 'medium' | 'low' {
    return this.normalizePriority(probability);
  }

  /**
   * 获取解析器配置
   */
  getConfig(): PRDParserConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PRDParserConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log('[PRDParser] 配置已更新');
  }
}

// 导出单例实例
export const prdParser = new PRDParser();

export default PRDParser;