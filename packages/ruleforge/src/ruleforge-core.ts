// NightShift RuleForge 核心引擎

import { ConversationLogParser, ConversationLog, ParseResult } from './parsers/conversation-log-parser';
import { PatternRecognitionEngine, Pattern } from './engines/pattern-recognition-engine';
import { YAMLGenerator, RuleYAML, ValidationResult } from './generators/yaml-generator';

/**
 * RuleForge 配置
 */
export interface RuleForgeConfig {
  // 解析器配置
  parser?: {
    minMessageLength?: number;
    maxMessages?: number;
    enableSentimentAnalysis?: boolean;
    enableComplexityAnalysis?: boolean;
  };
  
  // 模式识别配置
  recognition?: {
    minConfidence?: number;
    minFrequency?: number;
    maxPatterns?: number;
    enableMachineLearning?: boolean;
  };
  
  // YAML 生成配置
  generator?: {
    includeMetadata?: boolean;
    includeExamples?: boolean;
    includeTags?: boolean;
    maxExamples?: number;
    defaultAuthor?: string;
  };
  
  // 通用配置
  general?: {
    autoSave?: boolean;
    savePath?: string;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * RuleForge 处理结果
 */
export interface RuleForgeResult {
  logAnalysis: ParseResult;
  detectedPatterns: Pattern[];
  generatedRules: RuleYAML[];
  yamlOutput: string;
  statistics: {
    totalPatterns: number;
    validRules: number;
    processingTime: number;
    memoryUsage: number;
  };
  errors: string[];
  warnings: string[];
}

/**
 * RuleForge 核心引擎
 */
export class RuleForgeCore {
  private parser: ConversationLogParser;
  private recognitionEngine: PatternRecognitionEngine;
  private yamlGenerator: YAMLGenerator;
  private config: RuleForgeConfig;
  
  private processingHistory: RuleForgeResult[] = [];
  private errorLog: string[] = [];
  
  constructor(config?: RuleForgeConfig) {
    this.config = {
      parser: {
        minMessageLength: 10,
        maxMessages: 1000,
        enableSentimentAnalysis: true,
        enableComplexityAnalysis: true,
        ...config?.parser
      },
      recognition: {
        minConfidence: 0.7,
        minFrequency: 2,
        maxPatterns: 100,
        enableMachineLearning: false,
        ...config?.recognition
      },
      generator: {
        includeMetadata: true,
        includeExamples: true,
        includeTags: true,
        maxExamples: 3,
        defaultAuthor: 'RuleForge',
        ...config?.generator
      },
      general: {
        autoSave: true,
        savePath: './rules',
        logLevel: 'info',
        ...config?.general
      }
    };
    
    // 初始化各个组件
    this.parser = new ConversationLogParser();
    this.recognitionEngine = new PatternRecognitionEngine(this.config.recognition);
    this.yamlGenerator = new YAMLGenerator(this.config.generator);
  }

  /**
   * 处理会话日志并生成规则
   */
  async processConversationLog(log: ConversationLog): Promise<RuleForgeResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      this.log('info', `开始处理会话日志: ${log.id}`);
      
      // 1. 解析会话日志
      this.log('info', '步骤 1: 解析会话日志');
      const logAnalysis = await this.parser.parse(log);
      
      // 2. 检测模式
      this.log('info', '步骤 2: 检测模式');
      const detectedPatterns = await this.recognitionEngine.analyzeConversation(log);
      
      // 3. 生成 YAML 规则
      this.log('info', '步骤 3: 生成 YAML 规则');
      const generatedRules = this.yamlGenerator.generateRulesYAML(detectedPatterns);
      
      // 4. 验证规则
      this.log('info', '步骤 4: 验证规则');
      const validationResults = generatedRules.map(rule => 
        this.yamlGenerator.validateRuleYAML(rule)
      );
      
      // 收集验证错误和警告
      validationResults.forEach((result, index) => {
        if (!result.isValid) {
          errors.push(`规则 ${generatedRules[index].rule.id} 验证失败: ${result.errors.join(', ')}`);
        }
        if (result.warnings.length > 0) {
          warnings.push(`规则 ${generatedRules[index].rule.id} 警告: ${result.warnings.join(', ')}`);
        }
      });
      
      // 5. 序列化为 YAML 字符串
      this.log('info', '步骤 5: 序列化 YAML');
      const yamlOutput = this.yamlGenerator.serializeRulesToYAML(generatedRules);
      
      // 6. 自动保存（如果配置了）
      if (this.config.general?.autoSave) {
        await this.saveRules(generatedRules, log.id);
      }
      
      const processingTime = Date.now() - startTime;
      const memoryUsage = this.getMemoryUsage();
      
      const result: RuleForgeResult = {
        logAnalysis,
        detectedPatterns,
        generatedRules,
        yamlOutput,
        statistics: {
          totalPatterns: detectedPatterns.length,
          validRules: generatedRules.length,
          processingTime,
          memoryUsage
        },
        errors,
        warnings
      };
      
      // 保存处理历史
      this.processingHistory.push(result);
      
      this.log('info', `处理完成: 检测到 ${detectedPatterns.length} 个模式，生成 ${generatedRules.length} 个规则`);
      
      return result;
      
    } catch (error) {
      const errorMessage = `处理会话日志失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log('error', errorMessage);
      errors.push(errorMessage);
      
      const processingTime = Date.now() - startTime;
      
      return {
        logAnalysis: {} as ParseResult,
        detectedPatterns: [],
        generatedRules: [],
        yamlOutput: '',
        statistics: {
          totalPatterns: 0,
          validRules: 0,
          processingTime,
          memoryUsage: 0
        },
        errors,
        warnings
      };
    }
  }

  /**
   * 批量处理会话日志
   */
  async processBatchConversationLogs(logs: ConversationLog[]): Promise<RuleForgeResult[]> {
    const results: RuleForgeResult[] = [];
    
    this.log('info', `开始批量处理 ${logs.length} 个会话日志`);
    
    for (let i = 0; i < logs.length; i++) {
      try {
        this.log('info', `处理第 ${i + 1}/${logs.length} 个日志: ${logs[i].id}`);
        const result = await this.processConversationLog(logs[i]);
        results.push(result);
      } catch (error) {
        const errorMessage = `处理日志 ${logs[i].id} 失败: ${error instanceof Error ? error.message : String(error)}`;
        this.log('error', errorMessage);
        
        results.push({
          logAnalysis: {} as ParseResult,
          detectedPatterns: [],
          generatedRules: [],
          yamlOutput: '',
          statistics: {
            totalPatterns: 0,
            validRules: 0,
            processingTime: 0,
            memoryUsage: 0
          },
          errors: [errorMessage],
          warnings: []
        });
      }
    }
    
    this.log('info', `批量处理完成: 成功 ${results.filter(r => r.errors.length === 0).length}/${logs.length}`);
    
    return results;
  }

  /**
   * 保存规则到文件
   */
  private async saveRules(rules: RuleYAML[], logId: string): Promise<void> {
    try {
      const savePath = this.config.general?.savePath || './rules';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${savePath}/rules-${logId}-${timestamp}.yaml`;
      
      const yamlContent = this.yamlGenerator.serializeRulesToYAML(rules);
      
      // 在实际项目中，这里应该使用文件系统 API 保存文件
      // 这里只是模拟保存操作
      this.log('info', `规则已保存到: ${filename}`);
      
      // 模拟保存操作
      console.log(`[RuleForge] 保存规则到: ${filename}`);
      console.log(yamlContent);
      
    } catch (error) {
      this.log('error', `保存规则失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return Math.round(process.memoryUsage().heapUsed / 1024 / 1024); // MB
    }
    return 0;
  }

  /**
   * 日志记录
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const logLevel = this.config.general?.logLevel || 'info';
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    
    if (levels[level] >= levels[logLevel]) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [RuleForge] [${level.toUpperCase()}] ${message}`);
    }
    
    if (level === 'error') {
      this.errorLog.push(`${new Date().toISOString()} - ${message}`);
    }
  }

  /**
   * 获取处理历史
   */
  getProcessingHistory(): RuleForgeResult[] {
    return [...this.processingHistory];
  }

  /**
   * 获取错误日志
   */
  getErrorLog(): string[] {
    return [...this.errorLog];
  }

  /**
   * 获取统计信息
   */
  getStatistics(): {
    totalProcessed: number;
    successfulProcesses: number;
    totalPatternsDetected: number;
    totalRulesGenerated: number;
    averageProcessingTime: number;
  } {
    const successfulResults = this.processingHistory.filter(r => r.errors.length === 0);
    
    return {
      totalProcessed: this.processingHistory.length,
      successfulProcesses: successfulResults.length,
      totalPatternsDetected: this.processingHistory.reduce((sum, r) => sum + r.detectedPatterns.length, 0),
      totalRulesGenerated: this.processingHistory.reduce((sum, r) => sum + r.generatedRules.length, 0),
      averageProcessingTime: successfulResults.length > 0 
        ? successfulResults.reduce((sum, r) => sum + r.statistics.processingTime, 0) / successfulResults.length
        : 0
    };
  }

  /**
   * 重置引擎状态
   */
  reset(): void {
    this.processingHistory = [];
    this.errorLog = [];
    this.recognitionEngine.resetPatternLibrary();
    this.log('info', 'RuleForge 引擎已重置');
  }

  /**
   * 导出模式库
   */
  exportPatternLibrary(): Record<string, Pattern> {
    return this.recognitionEngine.exportPatternLibrary();
  }

  /**
   * 导入模式库
   */
  importPatternLibrary(library: Record<string, Pattern>): void {
    this.recognitionEngine.importPatternLibrary(library);
    this.log('info', '模式库已导入');
  }

  /**
   * 验证单个规则
   */
  validateRule(rule: RuleYAML): ValidationResult {
    return this.yamlGenerator.validateRuleYAML(rule);
  }

  /**
   * 序列化单个规则
   */
  serializeRule(rule: RuleYAML): string {
    return this.yamlGenerator.serializeToYAML(rule);
  }

  /**
   * 反序列化规则
   */
  deserializeRule(yamlString: string): RuleYAML {
    return this.yamlGenerator.deserializeFromYAML(yamlString);
  }

  /**
   * 获取配置
   */
  getConfig(): RuleForgeConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<RuleForgeConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      parser: { ...this.config.parser, ...newConfig.parser },
      recognition: { ...this.config.recognition, ...newConfig.recognition },
      generator: { ...this.config.generator, ...newConfig.generator },
      general: { ...this.config.general, ...newConfig.general }
    };
    
    this.log('info', 'RuleForge 配置已更新');
  }
}

/**
 * 创建 RuleForge 实例的工厂函数
 */
export function createRuleForge(config?: RuleForgeConfig): RuleForgeCore {
  return new RuleForgeCore(config);
}

/**
 * 默认 RuleForge 实例
 */
export const defaultRuleForge = createRuleForge();