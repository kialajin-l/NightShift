import * as vscode from 'vscode';
import { TaskPlanPanel } from './ui/task-plan-panel';
import { RuleForgeBridge } from '@nightshift/ruleforge-bridge';

/**
 * NightShift 编辑器扩展激活函数
 * @param context - VSCode 扩展上下文
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    console.log('✅ NightShift 已激活');
    
    // 获取当前主题色配置
    const themeColor = getThemeColor();
    
    // 1. 注册命令：启动多Agent会话
    const startCmd = vscode.commands.registerCommand(
      'nightshift.start',
      async () => {
        try {
          vscode.window.showInformationMessage('🚀 NightShift: 开始多Agent开发会话', { 
            modal: true,
            detail: '正在初始化调度器、前端Agent、后端Agent和测试Agent...'
          });
          
          // TODO: 打开任务计划面板 + 聊天界面
          await TaskPlanPanel.createOrShow(context.extensionUri);
          
          // 显示进度通知
          vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'NightShift 会话初始化中',
            cancellable: false
          }, async (progress) => {
            progress.report({ increment: 0 });
            
            // 模拟初始化步骤
            for (let i = 0; i < 5; i++) {
              await new Promise(resolve => setTimeout(resolve, 500));
              progress.report({ increment: 20, message: `步骤 ${i + 1}/5` });
            }
            
            vscode.window.showInformationMessage('🎉 NightShift 会话已准备就绪！');
          });
          
        } catch (error) {
          vscode.window.showErrorMessage(`❌ 启动 NightShift 会话失败: ${error instanceof Error ? error.message : String(error)}`);
          console.error('NightShift 启动错误:', error);
        }
      }
    );
    
    // 2. 注册命令：显示任务计划面板
    const showPlanCmd = vscode.commands.registerCommand(
      'nightshift.showPlan',
      () => {
        try {
          TaskPlanPanel.createOrShow(context.extensionUri);
          vscode.window.showInformationMessage('📋 打开任务计划面板');
        } catch (error) {
          vscode.window.showErrorMessage(`❌ 打开任务计划面板失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    );
    
    // 3. 注册命令：停止会话
    const stopCmd = vscode.commands.registerCommand(
      'nightshift.stop',
      () => {
        vscode.window.showInformationMessage('🛑 NightShift 会话已停止');
        // TODO: 清理资源
      }
    );
    
    // 4. 初始化 RuleForge 桥接
    const ruleForge = new RuleForgeBridge();
    await ruleForge.initialize();
    
    // 5. 注册配置变更监听
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('nightshift')) {
        console.log('⚙️ NightShift 配置已更新');
        
        // 重新加载配置
        const config = vscode.workspace.getConfiguration('nightshift');
        const enabled = config.get<boolean>('enabled', true);
        const autoPlan = config.get<boolean>('autoPlan', true);
        
        console.log(`配置更新: enabled=${enabled}, autoPlan=${autoPlan}`);
        
        if (!enabled) {
          vscode.window.showWarningMessage('⚠️ NightShift 已被禁用');
        }
      }
    });
    
    // 6. 注册文件保存监听（用于规则提取）
    const fileSaveListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (document.languageId === 'typescript' || document.languageId === 'javascript') {
        try {
          await ruleForge.extractRulesFromFileChange(document.fileName, document.getText());
        } catch (error) {
          console.warn('规则提取失败:', error);
        }
      }
    });
    
    // 7. 注册所有订阅
    context.subscriptions.push(
      startCmd,
      showPlanCmd,
      stopCmd,
      ruleForge,
      configChangeListener,
      fileSaveListener
    );
    
    console.log('🎯 NightShift 扩展初始化完成');
    
  } catch (error) {
    console.error('❌ NightShift 激活失败:', error);
    vscode.window.showErrorMessage(`NightShift 扩展激活失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 根据当前主题获取适配的颜色
 */
function getThemeColor(): string {
  const theme = vscode.window.activeColorTheme.kind;
  
  switch (theme) {
    case vscode.ColorThemeKind.Light:
      return '#1e88e5'; // 蓝色主题色
    case vscode.ColorThemeKind.Dark:
      return '#64b5f6'; // 浅蓝色主题色
    case vscode.ColorThemeKind.HighContrast:
      return '#ff9800'; // 橙色高对比度
    default:
      return '#2196f3'; // 默认主题色
  }
}

/**
 * NightShift 编辑器扩展停用函数
 */
export function deactivate(): void {
  console.log('🛑 NightShift 已停用');
  // 清理资源
}