/**
 * NightShift 任务计划面板
 * 在 VSCode 侧边栏显示任务计划和实时状态
 */

import { 
  Task, 
  TaskStatus, 
  TaskPlan, 
  TaskTreeNode, 
  PanelState, 
  ThemeConfig, 
  PanelConfig,
  WebSocketMessage,
  TaskUpdateMessage,
  ViewConfig,
  VSCodeAPI
} from './types/task-plan.js';

/**
 * 状态图标映射
 */
const STATUS_ICONS: Record<TaskStatus, string> = {
  pending: '⏳',
  running: '🔄',
  completed: '✅',
  failed: '❌'
};

/**
 * 优先级颜色映射
 */
const PRIORITY_COLORS = {
  critical: '#ff4444',
  high: '#ffaa00',
  medium: '#44aaff',
  low: '#888888'
};

/**
 * 主题适配器
 */
class ThemeAdapter {
  private currentTheme: ThemeConfig;
  
  constructor() {
    this.currentTheme = this.getDefaultTheme();
  }

  /**
   * 获取默认主题配置
   */
  private getDefaultTheme(): ThemeConfig {
    return {
      backgroundColor: '#1e1e1e',
      foregroundColor: '#cccccc',
      borderColor: '#444444',
      
      pendingColor: '#ffaa00',
      runningColor: '#44aaff',
      completedColor: '#44ff44',
      failedColor: '#ff4444',
      
      criticalColor: '#ff4444',
      highColor: '#ffaa00',
      mediumColor: '#44aaff',
      lowColor: '#888888',
      
      hoverColor: '#2a2d2e',
      selectedColor: '#094771',
      
      fontFamily: 'var(--vscode-font-family)',
      fontSize: 'var(--vscode-font-size)',
      
      iconSize: '16px'
    };
  }

  /**
   * 更新主题配置
   */
  updateTheme(customTheme?: Partial<ThemeConfig>): void {
    this.currentTheme = { ...this.getDefaultTheme(), ...customTheme };
  }

  /**
   * 获取当前主题
   */
  getTheme(): ThemeConfig {
    return this.currentTheme;
  }

  /**
   * 获取状态颜色
   */
  getStatusColor(status: TaskStatus): string {
    const colors = {
      pending: this.currentTheme.pendingColor,
      running: this.currentTheme.runningColor,
      completed: this.currentTheme.completedColor,
      failed: this.currentTheme.failedColor
    };
    return colors[status];
  }

  /**
   * 获取优先级颜色
   */
  getPriorityColor(priority: string): string {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || this.currentTheme.foregroundColor;
  }
}

/**
 * WebSocket 管理器
 */
class WebSocketManager {
  private ws: WebSocket | null = null;
  private messageCallbacks: Array<(message: WebSocketMessage) => void> = [];
  private connectionCallbacks: Array<(connected: boolean) => void> = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * 连接到 WebSocket 服务器
   */
  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.notifyConnectionChange(true);
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.notifyMessage(message);
          } catch (error) {
            console.error('WebSocket 消息解析失败:', error);
          }
        };
        
        this.ws.onclose = () => {
          this.notifyConnectionChange(false);
          this.attemptReconnect(url);
        };
        
        this.ws.onerror = (error) => {
          reject(error);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 发送消息
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * 监听消息
   */
  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  /**
   * 监听连接状态变化
   */
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect(url).catch(console.error);
      }, Math.min(1000 * this.reconnectAttempts, 10000)); // 指数退避
    }
  }

  /**
   * 通知消息
   */
  private notifyMessage(message: WebSocketMessage): void {
    this.messageCallbacks.forEach(callback => callback(message));
  }

  /**
   * 通知连接状态变化
   */
  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }
}

/**
 * 任务树构建器
 */
class TaskTreeBuilder {
  /**
   * 构建任务树
   */
  buildTaskTree(tasks: Task[]): TaskTreeNode[] {
    const taskMap = new Map<string, Task>();
    const childrenMap = new Map<string, Task[]>();
    
    // 构建任务映射和子任务关系
    tasks.forEach(task => {
      taskMap.set(task.id, task);
      
      // 初始化子任务映射
      if (!childrenMap.has(task.id)) {
        childrenMap.set(task.id, []);
      }
      
      // 处理依赖关系（作为子任务）
      task.dependencies.forEach(depId => {
        if (!childrenMap.has(depId)) {
          childrenMap.set(depId, []);
        }
        childrenMap.get(depId)!.push(task);
      });
    });
    
    // 构建树节点
    const rootNodes = tasks.filter(task => task.dependencies.length === 0);
    const treeNodes: TaskTreeNode[] = [];
    
    const buildNode = (task: Task, level: number, parentId?: string): void => {
      const children = childrenMap.get(task.id) || [];
      
      treeNodes.push({
        task: { ...task, expanded: task.expanded ?? true },
        level,
        parentId,
        hasChildren: children.length > 0,
        visible: true
      });
      
      // 递归构建子节点
      if (task.expanded !== false) {
        children.forEach(child => {
          buildNode(child, level + 1, task.id);
        });
      }
    };
    
    rootNodes.forEach(task => buildNode(task, 0));
    
    return treeNodes;
  }

  /**
   * 更新任务树中的任务
   */
  updateTaskInTree(treeNodes: TaskTreeNode[], taskId: string, updates: Partial<Task>): TaskTreeNode[] {
    return treeNodes.map(node => {
      if (node.task.id === taskId) {
        return {
          ...node,
          task: { ...node.task, ...updates }
        };
      }
      return node;
    });
  }

  /**
   * 过滤任务树
   */
  filterTaskTree(treeNodes: TaskTreeNode[], filter: (task: Task) => boolean): TaskTreeNode[] {
    const visibleNodes = new Set<string>();
    
    // 从叶子节点向上标记可见节点
    for (let i = treeNodes.length - 1; i >= 0; i--) {
      const node = treeNodes[i];
      
      if (filter(node.task)) {
        visibleNodes.add(node.task.id);
        // 标记所有祖先节点为可见
        let currentId = node.parentId;
        while (currentId) {
          visibleNodes.add(currentId);
          const parentNode = treeNodes.find(n => n.task.id === currentId);
          currentId = parentNode?.parentId;
        }
      }
    }
    
    return treeNodes.map(node => ({
      ...node,
      visible: visibleNodes.has(node.task.id)
    }));
  }
}

/**
 * 任务计划面板主类
 */
export class TaskPlanPanel {
  private state: PanelState;
  private themeAdapter: ThemeAdapter;
  private wsManager: WebSocketManager;
  private treeBuilder: TaskTreeBuilder;
  private vscodeAPI: VSCodeAPI;
  
  private container: HTMLElement;
  private taskList: HTMLElement;
  private statsPanel: HTMLElement;
  
  constructor(container: HTMLElement, vscodeAPI: VSCodeAPI) {
    this.container = container;
    this.vscodeAPI = vscodeAPI;
    
    this.themeAdapter = new ThemeAdapter();
    this.wsManager = new WebSocketManager();
    this.treeBuilder = new TaskTreeBuilder();
    
    this.state = this.getInitialState();
    
    this.initializeUI();
    this.setupEventListeners();
    this.connectToWebSocket();
  }

  /**
   * 获取初始状态
   */
  private getInitialState(): PanelState {
    return {
      taskPlan: null,
      tasks: new Map(),
      taskTree: [],
      
      loading: true,
      error: null,
      connected: false,
      
      taskDetail: {
        task: {} as Task,
        visible: false,
        position: 'right'
      },
      
      codePreview: {
        task: {} as Task,
        visible: false,
        language: '',
        code: ''
      },
      
      theme: this.themeAdapter.getTheme(),
      config: {
        showProgressBars: true,
        showTimeEstimates: true,
        showCodePreview: true,
        autoExpandCompleted: false,
        enableDragDrop: false,
        enableKeyboardShortcuts: true,
        realTimeUpdates: true,
        updateInterval: 1000
      },
      
      selectedTaskId: null,
      expandedTaskIds: new Set(),
      
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        failedTasks: 0,
        estimatedTime: 0,
        actualTime: 0
      }
    };
  }

  /**
   * 初始化 UI
   */
  private initializeUI(): void {
    this.container.innerHTML = '';
    this.applyTheme();
    
    // 创建主布局
    const header = this.createHeader();
    this.taskList = this.createTaskList();
    this.statsPanel = this.createStatsPanel();
    
    this.container.appendChild(header);
    this.container.appendChild(this.taskList);
    this.container.appendChild(this.statsPanel);
    
    // 显示加载状态
    this.showLoading();
  }

  /**
   * 创建头部
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'task-plan-header';
    header.innerHTML = `
      <div class="header-title">
        <span class="icon">📋</span>
        <span class="title">开发计划</span>
        <span class="status-indicator ${this.state.connected ? 'connected' : 'disconnected'}"></span>
      </div>
      <div class="header-actions">
        <button class="btn-refresh" title="刷新">🔄</button>
        <button class="btn-expand-all" title="展开全部">📂</button>
        <button class="btn-collapse-all" title="收起全部">📁</button>
        <button class="btn-settings" title="设置">⚙️</button>
      </div>
    `;
    
    return header;
  }

  /**
   * 创建任务列表
   */
  private createTaskList(): HTMLElement {
    const taskList = document.createElement('div');
    taskList.className = 'task-list';
    return taskList;
  }

  /**
   * 创建统计面板
   */
  private createStatsPanel(): HTMLElement {
    const statsPanel = document.createElement('div');
    statsPanel.className = 'stats-panel';
    return statsPanel;
  }

  /**
   * 应用主题样式
   */
  private applyTheme(): void {
    const theme = this.state.theme;
    
    this.container.style.cssText = `
      background-color: ${theme.backgroundColor};
      color: ${theme.foregroundColor};
      font-family: ${theme.fontFamily};
      font-size: ${theme.fontSize};
      border: 1px solid ${theme.borderColor};
      height: 100%;
      display: flex;
      flex-direction: column;
    `;
    
    // 动态添加 CSS 样式
    this.injectStyles(theme);
  }

  /**
   * 注入 CSS 样式
   */
  private injectStyles(theme: ThemeConfig): void {
    const style = document.createElement('style');
    style.textContent = `
      .task-plan-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid ${theme.borderColor};
        background-color: ${theme.backgroundColor};
      }
      
      .header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: bold;
      }
      
      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      
      .status-indicator.connected {
        background-color: ${theme.completedColor};
      }
      
      .status-indicator.disconnected {
        background-color: ${theme.failedColor};
      }
      
      .header-actions {
        display: flex;
        gap: 4px;
      }
      
      .header-actions button {
        background: none;
        border: 1px solid ${theme.borderColor};
        color: ${theme.foregroundColor};
        padding: 4px 8px;
        border-radius: 3px;
        cursor: pointer;
      }
      
      .header-actions button:hover {
        background-color: ${theme.hoverColor};
      }
      
      .task-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      
      .task-node {
        margin: 2px 0;
        user-select: none;
      }
      
      .task-item {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 3px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .task-item:hover {
        background-color: ${theme.hoverColor};
      }
      
      .task-item.selected {
        background-color: ${theme.selectedColor};
      }
      
      .task-indent {
        width: 16px;
        display: inline-block;
      }
      
      .task-expand-toggle {
        width: 16px;
        text-align: center;
        cursor: pointer;
      }
      
      .task-status-icon {
        width: 16px;
        text-align: center;
        margin-right: 4px;
      }
      
      .task-name {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .task-priority {
        width: 4px;
        height: 16px;
        margin-right: 8px;
        border-radius: 2px;
      }
      
      .task-time {
        font-size: 0.8em;
        color: ${theme.borderColor};
        margin-left: 8px;
      }
      
      .stats-panel {
        padding: 8px 12px;
        border-top: 1px solid ${theme.borderColor};
        background-color: ${theme.backgroundColor};
        font-size: 0.9em;
      }
      
      .progress-bar {
        width: 100%;
        height: 4px;
        background-color: ${theme.borderColor};
        border-radius: 2px;
        overflow: hidden;
        margin: 4px 0;
      }
      
      .progress-fill {
        height: 100%;
        background-color: ${theme.completedColor};
        transition: width 0.3s;
      }
      
      .loading-spinner {
        text-align: center;
        padding: 20px;
        color: ${theme.borderColor};
      }
      
      .error-message {
        color: ${theme.failedColor};
        padding: 20px;
        text-align: center;
      }
    `;
    
    this.container.appendChild(style);
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // WebSocket 消息监听
    this.wsManager.onMessage((message) => {
      this.handleWebSocketMessage(message);
    });
    
    this.wsManager.onConnectionChange((connected) => {
      this.setState({ connected });
      this.updateConnectionStatus();
    });
    
    // 键盘快捷键
    if (this.state.config.enableKeyboardShortcuts) {
      this.setupKeyboardShortcuts();
    }
  }

  /**
   * 连接到 WebSocket
   */
  private async connectToWebSocket(): Promise<void> {
    try {
      await this.wsManager.connect('ws://localhost:8080/tasks');
    } catch (error) {
      console.error('WebSocket 连接失败:', error);
      this.setState({ 
        error: '无法连接到任务服务器',
        loading: false 
      });
      this.showError();
    }
  }

  /**
   * 处理 WebSocket 消息
   */
  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'taskUpdate':
        this.handleTaskUpdate(message.data);
        break;
      case 'taskAdded':
        this.handleTaskAdded(message.data);
        break;
      case 'planUpdate':
        this.handlePlanUpdate(message.data);
        break;
      case 'connectionStatus':
        this.setState({ connected: message.data.connected });
        break;
    }
  }

  /**
   * 处理任务更新
   */
  private handleTaskUpdate(update: TaskUpdateMessage): void {
    const { taskId, updates } = update;
    
    // 更新任务状态
    this.state.tasks.set(taskId, {
      ...this.state.tasks.get(taskId)!,
      ...updates
    });
    
    // 更新任务树
    this.state.taskTree = this.treeBuilder.updateTaskInTree(
      this.state.taskTree, 
      taskId, 
      updates
    );
    
    // 更新统计信息
    this.updateStats();
    
    // 重新渲染
    this.renderTaskList();
    this.renderStats();
  }

  /**
   * 处理任务添加
   */
  private handleTaskAdded(task: Task): void {
    this.state.tasks.set(task.id, task);
    this.state.taskTree = this.treeBuilder.buildTaskTree(
      Array.from(this.state.tasks.values())
    );
    
    this.updateStats();
    this.renderTaskList();
    this.renderStats();
  }

  /**
   * 处理计划更新
   */
  private handlePlanUpdate(plan: TaskPlan): void {
    this.setState({ 
      taskPlan: plan,
      loading: false,
      error: null 
    });
    
    // 构建任务映射
    const tasksMap = new Map<string, Task>();
    const flattenTasks = (tasks: Task[]) => {
      tasks.forEach(task => {
        tasksMap.set(task.id, task);
        if (task.children) {
          flattenTasks(task.children);
        }
      });
    };
    
    flattenTasks(plan.tasks);
    this.state.tasks = tasksMap;
    
    // 构建任务树
    this.state.taskTree = this.treeBuilder.buildTaskTree(plan.tasks);
    
    this.updateStats();
    this.renderTaskList();
    this.renderStats();
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    const tasks = Array.from(this.state.tasks.values());
    
    this.state.stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      inProgressTasks: tasks.filter(t => t.status === 'running').length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      estimatedTime: tasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0),
      actualTime: tasks.reduce((sum, t) => sum + (t.actualTime || 0), 0)
    };
  }

  /**
   * 渲染任务列表
   */
  private renderTaskList(): void {
    if (this.state.loading) {
      this.showLoading();
      return;
    }
    
    if (this.state.error) {
      this.showError();
      return;
    }
    
    this.taskList.innerHTML = '';
    
    const visibleNodes = this.state.taskTree.filter(node => node.visible);
    
    visibleNodes.forEach(node => {
      const taskElement = this.createTaskElement(node);
      this.taskList.appendChild(taskElement);
    });
    
    if (visibleNodes.length === 0) {
      this.taskList.innerHTML = '<div class="no-tasks">暂无任务</div>';
    }
  }

  /**
   * 创建任务元素
   */
  private createTaskElement(node: TaskTreeNode): HTMLElement {
    const { task, level } = node;
    const taskNode = document.createElement('div');
    taskNode.className = 'task-node';
    
    const indent = ' '.repeat(level * 2);
    const isSelected = this.state.selectedTaskId === task.id;
    
    taskNode.innerHTML = `
      <div class="task-item ${isSelected ? 'selected' : ''}" data-task-id="${task.id}">
        <div class="task-indent" style="width: ${level * 16}px;"></div>
        <div class="task-expand-toggle">${node.hasChildren ? (task.expanded ? '▼' : '▶') : ' '}</div>
        <div class="task-priority" style="background-color: ${this.themeAdapter.getPriorityColor(task.priority)}"></div>
        <div class="task-status-icon">${STATUS_ICONS[task.status]}</div>
        <div class="task-name" title="${task.description || task.name}">
          ${task.name}
        </div>
        ${this.state.config.showTimeEstimates ? `
          <div class="task-time">${task.estimatedTime || 0}m</div>
        ` : ''}
      </div>
    `;
    
    // 添加点击事件
    const taskItem = taskNode.querySelector('.task-item') as HTMLElement;
    taskItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleTaskClick(task.id, node);
    });
    
    // 添加展开/收起事件
    const expandToggle = taskNode.querySelector('.task-expand-toggle') as HTMLElement;
    if (node.hasChildren) {
      expandToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleTaskExpansion(task.id);
      });
    }
    
    return taskNode;
  }

  /**
   * 渲染统计面板
   */
  private renderStats(): void {
    const { stats, taskPlan } = this.state;
    const progress = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;
    
    this.statsPanel.innerHTML = `
      <div class="stats-row">
        <span>进度: ${stats.completedTasks}/${stats.totalTasks} 任务完成</span>
        <span>预计时间: ${stats.estimatedTime}分钟</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
      <div class="stats-details">
        <span>进行中: ${stats.inProgressTasks}</span>
        <span>失败: ${stats.failedTasks}</span>
        <span>实际时间: ${stats.actualTime}分钟</span>
      </div>
    `;
  }

  /**
   * 显示加载状态
   */
  private showLoading(): void {
    this.taskList.innerHTML = `
      <div class="loading-spinner">
        <div>🔄 加载中...</div>
      </div>
    `;
  }

  /**
   * 显示错误状态
   */
  private showError(): void {
    this.taskList.innerHTML = `
      <div class="error-message">
        <div>❌ ${this.state.error}</div>
        <button class="btn-retry">重试</button>
      </div>
    `;
    
    const retryBtn = this.taskList.querySelector('.btn-retry') as HTMLButtonElement;
    retryBtn.addEventListener('click', () => {
      this.setState({ loading: true, error: null });
      this.connectToWebSocket();
    });
  }

  /**
   * 处理任务点击
   */
  private handleTaskClick(taskId: string, node: TaskTreeNode): void {
    this.setState({ selectedTaskId: taskId });
    
    // 显示任务详情
    if (this.state.config.showCodePreview && node.task.generatedCode) {
      this.showCodePreview(node.task);
    } else {
      this.showTaskDetail(node.task);
    }
    
    this.renderTaskList();
  }

  /**
   * 切换任务展开状态
   */
  private toggleTaskExpansion(taskId: string): void {
    const task = this.state.tasks.get(taskId);
    if (task) {
      const expanded = !task.expanded;
      
      if (expanded) {
        this.state.expandedTaskIds.add(taskId);
      } else {
        this.state.expandedTaskIds.delete(taskId);
      }
      
      this.handleTaskUpdate({
        taskId,
        updates: { expanded }
      });
    }
  }

  /**
   * 显示任务详情
   */
  private showTaskDetail(task: Task): void {
    this.vscodeAPI.postMessage({
      type: 'showTaskDetail',
      task: task
    });
  }

  /**
   * 显示代码预览
   */
  private showCodePreview(task: Task): void {
    if (task.generatedCode) {
      this.vscodeAPI.showCodePreview(task.generatedCode, task.codeLanguage || 'typescript');
    }
  }

  /**
   * 更新连接状态显示
   */
  private updateConnectionStatus(): void {
    const statusIndicator = this.container.querySelector('.status-indicator');
    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${this.state.connected ? 'connected' : 'disconnected'}`;
    }
  }

  /**
   * 设置键盘快捷键
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault();
            this.refresh();
            break;
          case 'e':
            e.preventDefault();
            this.expandAll();
            break;
          case 'c':
            e.preventDefault();
            this.collapseAll();
            break;
        }
      }
    });
  }

  /**
   * 刷新数据
   */
  refresh(): void {
    this.wsManager.send({
      type: 'refresh',
      data: {},
      timestamp: new Date()
    });
  }

  /**
   * 展开所有任务
   */
  expandAll(): void {
    this.state.tasks.forEach((task, id) => {
      if (task.children && task.children.length > 0) {
        this.state.expandedTaskIds.add(id);
        this.handleTaskUpdate({
          taskId: id,
          updates: { expanded: true }
        });
      }
    });
  }

  /**
   * 收起所有任务
   */
  collapseAll(): void {
    this.state.expandedTaskIds.clear();
    this.state.tasks.forEach((task, id) => {
      this.handleTaskUpdate({
        taskId: id,
        updates: { expanded: false }
      });
    });
  }

  /**
   * 更新状态
   */
  private setState(updates: Partial<PanelState>): void {
    this.state = { ...this.state, ...updates };
  }

  /**
   * 销毁面板
   */
  destroy(): void {
    this.wsManager.disconnect();
    this.container.innerHTML = '';
  }
}