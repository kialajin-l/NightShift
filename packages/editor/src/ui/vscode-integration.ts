/**
 * VSCode Webview API 集成
 * 提供与 VSCode 扩展的通信接口
 */

import { Task, ThemeConfig, PanelConfig } from './types/task-plan.js';

// VSCode API 类型定义
declare function acquireVsCodeApi(): {
  postMessage(message: any): void;
  setState(state: any): void;
  getState(): any;
};

/**
 * VSCode API 实现
 */
export class VSCodeIntegration {
  private vscode: any;
  private themeChangeCallbacks: Array<(theme: ThemeConfig) => void> = [];

  constructor() {
    // 获取 VSCode API
    this.vscode = acquireVsCodeApi?.() || this.createMockAPI();
    
    // 监听来自 VSCode 的消息
    window.addEventListener('message', (event) => {
      this.handleMessage(event.data);
    });
  }

  /**
   * 创建模拟 API（用于开发环境）
   */
  private createMockAPI(): any {
    return {
      postMessage: (message: any) => {
        console.log('VSCode API - 发送消息:', message);
      },
      setState: (state: any) => {
        console.log('VSCode API - 设置状态:', state);
      },
      getState: () => {
        console.log('VSCode API - 获取状态');
        return null;
      }
    };
  }

  /**
   * 发送消息到 VSCode 扩展
   */
  postMessage(message: any): void {
    this.vscode.postMessage(message);
  }

  /**
   * 设置面板状态
   */
  setState(state: any): void {
    this.vscode.setState(state);
  }

  /**
   * 获取面板状态
   */
  getState(): any {
    return this.vscode.getState();
  }

  /**
   * 获取当前主题配置
   */
  getTheme(): ThemeConfig {
    // 从 CSS 变量获取 VSCode 主题颜色
    const getCssVariable = (name: string, fallback: string) => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim() || fallback;
    };

    return {
      backgroundColor: getCssVariable('--vscode-editor-background', '#1e1e1e'),
      foregroundColor: getCssVariable('--vscode-editor-foreground', '#cccccc'),
      borderColor: getCssVariable('--vscode-panel-border', '#444444'),
      
      pendingColor: getCssVariable('--vscode-inputValidation-warningBorder', '#ffaa00'),
      runningColor: getCssVariable('--vscode-inputValidation-infoBorder', '#44aaff'),
      completedColor: getCssVariable('--vscode-inputValidation-infoBackground', '#44ff44'),
      failedColor: getCssVariable('--vscode-inputValidation-errorBorder', '#ff4444'),
      
      criticalColor: '#ff4444',
      highColor: '#ffaa00',
      mediumColor: '#44aaff',
      lowColor: '#888888',
      
      hoverColor: getCssVariable('--vscode-list-hoverBackground', '#2a2d2e'),
      selectedColor: getCssVariable('--vscode-list-activeSelectionBackground', '#094771'),
      
      fontFamily: getCssVariable('--vscode-font-family', 'Consolas, "Courier New", monospace'),
      fontSize: getCssVariable('--vscode-font-size', '13px'),
      
      iconSize: '16px'
    };
  }

  /**
   * 监听主题变化
   */
  onThemeChange(callback: (theme: ThemeConfig) => void): void {
    this.themeChangeCallbacks.push(callback);
    
    // 模拟主题变化（实际应该由 VSCode 触发）
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'style') {
          const newTheme = this.getTheme();
          this.themeChangeCallbacks.forEach(cb => cb(newTheme));
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  /**
   * 打开文件
   */
  openFile(path: string): void {
    this.postMessage({
      type: 'openFile',
      path: path
    });
  }

  /**
   * 显示代码预览
   */
  showCodePreview(code: string, language: string): void {
    this.postMessage({
      type: 'showCodePreview',
      code: code,
      language: language
    });
  }

  /**
   * 获取配置
   */
  getConfiguration(): PanelConfig {
    // 从本地存储或默认配置获取
    const storedConfig = localStorage.getItem('nightshift-panel-config');
    if (storedConfig) {
      return JSON.parse(storedConfig);
    }
    
    return {
      showProgressBars: true,
      showTimeEstimates: true,
      showCodePreview: true,
      autoExpandCompleted: false,
      enableDragDrop: false,
      enableKeyboardShortcuts: true,
      realTimeUpdates: true,
      updateInterval: 1000
    };
  }

  /**
   * 更新配置
   */
  updateConfiguration(config: Partial<PanelConfig>): void {
    const currentConfig = this.getConfiguration();
    const newConfig = { ...currentConfig, ...config };
    
    localStorage.setItem('nightshift-panel-config', JSON.stringify(newConfig));
    
    this.postMessage({
      type: 'configUpdated',
      config: newConfig
    });
  }

  /**
   * 处理来自 VSCode 的消息
   */
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'themeChanged':
        this.handleThemeChange(message.theme);
        break;
      case 'configUpdated':
        this.handleConfigUpdate(message.config);
        break;
      case 'taskUpdated':
        this.handleTaskUpdate(message.task);
        break;
      case 'planUpdated':
        this.handlePlanUpdate(message.plan);
        break;
    }
  }

  /**
   * 处理主题变化
   */
  private handleThemeChange(theme: ThemeConfig): void {
    this.themeChangeCallbacks.forEach(callback => callback(theme));
  }

  /**
   * 处理配置更新
   */
  private handleConfigUpdate(config: PanelConfig): void {
    // 配置更新逻辑
    localStorage.setItem('nightshift-panel-config', JSON.stringify(config));
  }

  /**
   * 处理任务更新
   */
  private handleTaskUpdate(task: Task): void {
    // 任务更新逻辑（将由面板处理）
    window.dispatchEvent(new CustomEvent('taskUpdate', {
      detail: { task }
    }));
  }

  /**
   * 处理计划更新
   */
  private handlePlanUpdate(plan: any): void {
    // 计划更新逻辑（将由面板处理）
    window.dispatchEvent(new CustomEvent('planUpdate', {
      detail: { plan }
    }));
  }
}

/**
 * 面板初始化函数
 */
export function initializeTaskPlanPanel(container: HTMLElement): void {
  // 创建 VSCode 集成实例
  const vscodeAPI = new VSCodeIntegration();
  
  // 导入任务计划面板
  import('./task-plan-panel.js').then(module => {
    const { TaskPlanPanel } = module;
    
    // 创建面板实例
    const panel = new TaskPlanPanel(container, vscodeAPI);
    
    // 保存到全局变量以便访问
    (window as any).taskPlanPanel = panel;
    
    console.log('NightShift 任务计划面板已初始化');
    
  }).catch(error => {
    console.error('初始化任务计划面板失败:', error);
    
    // 显示错误信息
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #ff4444;">
        <h3>❌ 初始化失败</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()">重新加载</button>
      </div>
    `;
  });
}

/**
 * 导出给 HTML 使用的全局函数
 */
(window as any).initializeTaskPlanPanel = initializeTaskPlanPanel;