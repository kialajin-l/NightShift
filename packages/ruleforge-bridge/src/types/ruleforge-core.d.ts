// 临时类型定义 - 等待链接 @ruleforge/core
declare module '@ruleforge/core' {
  export class RuleExtractor {
    initialize(): Promise<void>;
    extractFromCode(code: string, options: any): Promise<{
      rules: any[];
      confidence: number;
    }>;
  }
  
  export class RuleValidator {
    initialize(): Promise<void>;
    validateRule(rule: any): Promise<{
      isValid: boolean;
      errors: string[];
    }>;
  }
}