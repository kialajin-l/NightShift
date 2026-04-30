import * as path from 'path';
import * as fs from 'fs/promises';
import * as vscode from 'vscode';
import { RuleExtractor, RuleValidator } from './types/ruleforge-core-mock';

/**
 * RuleForge 桥接层 - 集成 NightShift 与 RuleForge 核心引擎
 */
export class RuleForgeBridge implements vscode.Disposable {
  private extractor: RuleExtractor;
  private validator: RuleValidator;
  private rulesDir: string;
  private sessionLogPath: string;
  private isInitialized: boolean = false;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.extractor = new RuleExtractor();
    this.validator = new RuleValidator();
    this.rulesDir = path.join(process.cwd(), '.nightshift', 'rules');
    this.sessionLogPath = path.join(process.cwd(), '.nightshift', 'sessions', `session-${Date.now()}.log`);
  }

  /**
   * 初始化 RuleForge 桥接层
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('RuleForge 桥接层已初始化');
        return;
      }

      console.log('🔄 初始化 RuleForge 桥接层...');

      // 1. 确保必要的目录存在
      await this._ensureDirectories();

      // 2. 加载本地规则库
      const rules = await this.loadLocalRules();
      console.log(`📚 已加载 ${rules.length} 条本地规则`);

      // 3. 初始化 RuleForge 核心组件
      await this.extractor.initialize();
      await this.validator.initialize();

      // 4. 注册会话监听器
      this.registerSessionListeners();

      // 5. 启动规则自动同步（如果配置了远程源）
      this.startRuleSync();

      this.isInitialized = true;
      console.log('✅ RuleForge 桥接层初始化完成');

    } catch (error) {
      console.error('❌ RuleForge 桥接层初始化失败:', error);
      throw new Error(`RuleForge 初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 加载本地规则库
   */
  async loadLocalRules(): Promise<any[]> {
    try {
      const rules: any[] = [];
      
      // 检查规则目录是否存在
      if (!await this._directoryExists(this.rulesDir)) {
        console.log('规则目录不存在，跳过加载');
        return rules;
      }

      // 读取所有 .yaml 和 .yml 文件
      const files = await fs.readdir(this.rulesDir);
      const ruleFiles = files.filter(file => 
        file.endsWith('.yaml') || file.endsWith('.yml')
      );

      for (const file of ruleFiles) {
        try {
          const filePath = path.join(this.rulesDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          
          // 解析 YAML 内容
          const rule = this._parseRuleYaml(content, file);
          if (rule) {
            // 验证规则格式
            const validationResult = await this.validator.validateRule(rule);
            if (validationResult.isValid) {
              rules.push(rule);
              console.log(`✅ 加载规则: ${rule.meta?.name || file}`);
            } else {
              console.warn(`⚠️ 规则验证失败 (${file}):`, validationResult.errors);
            }
          }
        } catch (error) {
          console.error(`❌ 加载规则文件失败 (${file}):`, error);
        }
      }

      return rules;
    } catch (error) {
      console.error('❌ 加载本地规则库失败:', error);
      return [];
    }
  }

  /**
   * 从文件变更中提取规则
   */
  async extractRulesFromFileChange(filePath: string, content: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.warn('RuleForge 桥接层未初始化，跳过规则提取');
        return;
      }

      // 只处理 TypeScript/JavaScript 文件
      const ext = path.extname(filePath).toLowerCase();
      if (!['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
        return;
      }

      console.log(`🔍 从文件变更提取规则: ${path.basename(filePath)}`);

      // 调用 RuleForge 提取器
      const extractionResult = await this.extractor.extractFromCode(content, {
        language: ext.includes('ts') ? 'typescript' : 'javascript',
        filePath,
        context: {
          projectType: this._detectProjectType(filePath),
          framework: this._detectFramework(filePath)
        }
      });

      if (extractionResult.rules.length > 0) {
        console.log(`🎯 提取到 ${extractionResult.rules.length} 条规则`);
        
        // 保存提取的规则
        for (const rule of extractionResult.rules) {
          await this._saveRule(rule);
        }

        // 显示通知
        if (extractionResult.rules.length > 0) {
          vscode.window.showInformationMessage(
            `🎯 NightShift 提取了 ${extractionResult.rules.length} 条编码规则`,
            '查看规则'
          ).then(selection => {
            if (selection === '查看规则') {
              // TODO: 打开规则查看面板
            }
          });
        }
      }

      // 记录到会话日志
      await this._logSessionActivity({
        type: 'rule_extraction',
        file: filePath,
        timestamp: new Date(),
        rulesExtracted: extractionResult.rules.length,
        confidence: extractionResult.confidence
      });

    } catch (error) {
      console.error('❌ 规则提取失败:', error);
    }
  }

  /**
   * 根据任务类型注入相关规则
   */
  async injectRulesForTask(taskType: string): Promise<string[]> {
    try {
      const rules = await this.loadLocalRules();
      
      // 根据任务类型过滤规则
      const relevantRules = rules.filter(rule => {
        const compatibility = rule.compatibility || {};
        return (
          compatibility.taskTypes?.includes(taskType) ||
          compatibility.frameworks?.some((fw: string) => 
            taskType.toLowerCase().includes(fw.toLowerCase())
          ) ||
          rule.meta?.tags?.some((tag: string) => 
            taskType.toLowerCase().includes(tag.toLowerCase())
          )
        );
      });

      // 转换为系统提示格式
      const rulePrompts = relevantRules.map(rule => {
        const meta = rule.meta || {};
        const ruleDef = rule.rule || {};
        
        return `规则: ${meta.name || '未命名规则'}
描述: ${meta.description || '无描述'}
触发条件: ${ruleDef.trigger || '无'}
建议: ${ruleDef.suggestion || '无'}
置信度: ${meta.confidence || '未知'}`;
      });

      console.log(`🎯 为任务类型 "${taskType}" 注入 ${rulePrompts.length} 条规则`);
      return rulePrompts;

    } catch (error) {
      console.error('❌ 规则注入失败:', error);
      return [];
    }
  }

  /**
   * 注册会话监听器
   */
  private registerSessionListeners(): void {
    // 监听终端命令执行（简化实现，避免不存在的API）
    const terminalListener = vscode.window.onDidChangeActiveTerminal(async (terminal) => {
      if (terminal) {
        await this._logSessionActivity({
          type: 'terminal_change',
          terminalName: terminal.name,
          timestamp: new Date()
        });
      }
    });

    // 监听调试会话
    const debugListener = vscode.debug.onDidStartDebugSession(async (session) => {
      await this._logSessionActivity({
        type: 'debug_start',
        sessionName: session.name,
        timestamp: new Date()
      });
    });

    // 监听扩展安装/卸载
    const extensionListener = vscode.extensions.onDidChange(async () => {
      await this._logSessionActivity({
        type: 'extension_change',
        timestamp: new Date()
      });
    });

    // 监听文件保存
    const fileSaveListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
      await this._logSessionActivity({
        type: 'file_save',
        fileName: document.fileName,
        languageId: document.languageId,
        timestamp: new Date()
      });
    });

    this.disposables.push(terminalListener, debugListener, extensionListener, fileSaveListener);
  }

  /**
   * 启动规则自动同步
   */
  private startRuleSync(): void {
    // 每30分钟检查一次远程规则更新
    setInterval(async () => {
      try {
        await this._syncRemoteRules();
      } catch (error) {
        console.error('规则同步失败:', error);
      }
    }, 30 * 60 * 1000); // 30分钟
  }

  /**
   * 确保必要的目录存在
   */
  private async _ensureDirectories(): Promise<void> {
    const directories = [
      this.rulesDir,
      path.join(process.cwd(), '.nightshift', 'sessions'),
      path.join(process.cwd(), '.nightshift', 'cache'),
      path.join(process.cwd(), '.nightshift', 'logs')
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`创建目录失败: ${dir}`, error);
      }
    }
  }

  /**
   * 检查目录是否存在
   */
  private async _directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * 解析 YAML 规则文件
   */
  private _parseRuleYaml(content: string, filename: string): any {
    try {
      // 简化实现 - 实际应该使用 YAML 解析库
      const lines = content.split('\n');
      const rule: any = { meta: {}, rule: {}, compatibility: {} };
      
      let currentSection = '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('meta:')) {
          currentSection = 'meta';
        } else if (trimmed.startsWith('rule:')) {
          currentSection = 'rule';
        } else if (trimmed.startsWith('compatibility:')) {
          currentSection = 'compatibility';
        } else if (trimmed.includes(':')) {
          const [key, value] = trimmed.split(':').map(s => s.trim());
          if (currentSection && key) {
            rule[currentSection][key] = value;
          }
        }
      }

      // 设置默认元数据
      if (!rule.meta.name) {
        rule.meta.name = path.basename(filename, path.extname(filename));
      }
      if (!rule.meta.id) {
        rule.meta.id = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      return rule;
    } catch (error) {
      console.error(`解析 YAML 规则失败 (${filename}):`, error);
      return null;
    }
  }

  /**
   * 保存规则到文件
   */
  private async _saveRule(rule: any): Promise<void> {
    try {
      const ruleId = rule.meta?.id || `rule-${Date.now()}`;
      const filename = `${ruleId}.yaml`;
      const filePath = path.join(this.rulesDir, filename);
      
      // 转换为 YAML 格式（简化实现）
      const yamlContent = this._convertToYaml(rule);
      
      await fs.writeFile(filePath, yamlContent, 'utf-8');
      console.log(`💾 规则已保存: ${filename}`);
    } catch (error) {
      console.error('保存规则失败:', error);
    }
  }

  /**
   * 将规则对象转换为 YAML 格式
   */
  private _convertToYaml(rule: any): string {
    const lines: string[] = [];
    
    // Meta 部分
    lines.push('meta:');
    Object.entries(rule.meta || {}).forEach(([key, value]) => {
      lines.push(`  ${key}: ${value}`);
    });
    
    // Rule 部分
    lines.push('rule:');
    Object.entries(rule.rule || {}).forEach(([key, value]) => {
      lines.push(`  ${key}: ${value}`);
    });
    
    // Compatibility 部分
    lines.push('compatibility:');
    Object.entries(rule.compatibility || {}).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        lines.push(`  ${key}:`);
        value.forEach((item: any) => lines.push(`    - ${item}`));
      } else {
        lines.push(`  ${key}: ${value}`);
      }
    });
    
    return lines.join('\n');
  }

  /**
   * 检测项目类型
   */
  private _detectProjectType(filePath: string): string {
    if (filePath.includes('packages/core')) return 'library';
    if (filePath.includes('packages/editor')) return 'vscode-extension';
    if (filePath.includes('packages/agents')) return 'agent-system';
    return 'unknown';
  }

  /**
   * 检测框架类型
   */
  private _detectFramework(filePath: string): string {
    if (filePath.includes('react') || filePath.includes('.tsx')) return 'react';
    if (filePath.includes('vue')) return 'vue';
    if (filePath.includes('angular')) return 'angular';
    return 'nodejs';
  }

  /**
   * 记录会话活动
   */
  private async _logSessionActivity(activity: any): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        ...activity
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(this.sessionLogPath, logLine, 'utf-8');
    } catch (error) {
      console.error('记录会话活动失败:', error);
    }
  }

  /**
   * 同步远程规则
   */
  private async _syncRemoteRules(): Promise<void> {
    // TODO: 实现远程规则同步逻辑
    console.log('🔄 检查远程规则更新...');
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];
    console.log('🛑 RuleForge 桥接层已清理');
  }
}