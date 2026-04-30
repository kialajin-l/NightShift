// 临时类型定义 - 等待链接 @nightshift/ruleforge-bridge
declare module '@nightshift/ruleforge-bridge' {
  export class RuleForgeBridge {
    constructor();
    initialize(): Promise<void>;
    loadLocalRules(): Promise<any[]>;
    extractRulesFromFileChange(filePath: string, content: string): Promise<void>;
    injectRulesForTask(taskType: string): Promise<string[]>;
    dispose(): void;
  }
}