/**
 * 任务计划面板类型定义
 */

/**
 * 任务状态类型
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * 任务优先级类型
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * 任务类型
 */
export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedTime?: number; // 分钟
  actualTime?: number; // 分钟
  progress?: number; // 0-100
  
  // 依赖关系
  dependencies: string[];
  children: Task[];
  
  // 元数据
  tags: string[];
  agent: 'frontend' | 'backend' | 'test' | 'design' | 'devops';
  
  // 时间信息
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // 代码生成相关
  generatedCode?: string;
  codeLanguage?: string;
  
  // UI 状态
  expanded?: boolean;
  selected?: boolean;
}

/**
 * 任务树节点
 */
export interface TaskTreeNode {
  task: Task;
  level: number;
  parentId?: string;
  hasChildren: boolean;
  visible: boolean;
}

/**
 * 任务计划数据
 */
export interface TaskPlan {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
  totalTasks: number;
  completedTasks: number;
  estimatedTotalTime: number;
  actualTotalTime?: number;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * WebSocket 消息类型
 */
export interface WebSocketMessage {
  type: 'taskUpdate' | 'taskAdded' | 'taskDeleted' | 'planUpdate' | 'connectionStatus';
  data: any;
  timestamp: Date;
}

/**
 * 任务更新消息
 */
export interface TaskUpdateMessage {
  taskId: string;
  updates: Partial<Task>;
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  // VSCode 主题变量
  backgroundColor: string;
  foregroundColor: string;
  borderColor: string;
  
  // 状态颜色
  pendingColor: string;
  runningColor: string;
  completedColor: string;
  failedColor: string;
  
  // 优先级颜色
  criticalColor: string;
  highColor: string;
  mediumColor: string;
  lowColor: string;
  
  // 交互颜色
  hoverColor: string;
  selectedColor: string;
  
  // 字体
  fontFamily: string;
  fontSize: string;
  
  // 图标
  iconSize: string;
}

/**
 * 面板配置
 */
export interface PanelConfig {
  // 显示选项
  showProgressBars: boolean;
  showTimeEstimates: boolean;
  showCodePreview: boolean;
  autoExpandCompleted: boolean;
  
  // 交互选项
  enableDragDrop: boolean;
  enableKeyboardShortcuts: boolean;
  
  // 更新选项
  realTimeUpdates: boolean;
  updateInterval: number; // 毫秒
}

/**
 * 任务详情视图
 */
export interface TaskDetailView {
  task: Task;
  visible: boolean;
  position: 'right' | 'bottom' | 'modal';
}

/**
 * 代码预览视图
 */
export interface CodePreviewView {
  task: Task;
  visible: boolean;
  language: string;
  code: string;
}

/**
 * 面板状态
 */
export interface PanelState {
  // 数据状态
  taskPlan: TaskPlan | null;
  tasks: Map<string, Task>;
  taskTree: TaskTreeNode[];
  
  // UI 状态
  loading: boolean;
  error: string | null;
  connected: boolean;
  
  // 视图状态
  taskDetail: TaskDetailView;
  codePreview: CodePreviewView;
  
  // 配置
  theme: ThemeConfig;
  config: PanelConfig;
  
  // 交互状态
  selectedTaskId: string | null;
  expandedTaskIds: Set<string>;
  
  // 统计信息
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    failedTasks: number;
    estimatedTime: number;
    actualTime: number;
  };
}

/**
 * 事件类型
 */
export type PanelEvent = 
  | 'taskSelected'
  | 'taskExpanded'
  | 'taskCollapsed'
  | 'taskStatusChanged'
  | 'taskDetailOpened'
  | 'codePreviewOpened'
  | 'planUpdated';

/**
 * 事件数据
 */
export interface PanelEventData {
  type: PanelEvent;
  data: any;
  timestamp: Date;
}

/**
 * VSCode Webview API 集成
 */
export interface VSCodeAPI {
  // 消息传递
  postMessage(message: any): void;
  setState(state: any): void;
  getState(): any;
  
  // 主题相关
  getTheme(): ThemeConfig;
  onThemeChange(callback: (theme: ThemeConfig) => void): void;
  
  // 文件操作
  openFile(path: string): void;
  showCodePreview(code: string, language: string): void;
  
  // 配置管理
  getConfiguration(): PanelConfig;
  updateConfiguration(config: Partial<PanelConfig>): void;
}

/**
 * WebSocket 管理器接口
 */
export interface WebSocketManager {
  connect(url: string): Promise<void>;
  disconnect(): void;
  send(message: WebSocketMessage): void;
  onMessage(callback: (message: WebSocketMessage) => void): void;
  onConnectionChange(callback: (connected: boolean) => void): void;
  isConnected(): boolean;
}

/**
 * 任务过滤器
 */
export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  agent?: string[];
  tags?: string[];
  searchText?: string;
}

/**
 * 任务排序选项
 */
export type TaskSortOption = 
  | 'name'
  | 'status'
  | 'priority'
  | 'estimatedTime'
  | 'createdAt'
  | 'progress';

/**
 * 任务分组选项
 */
export type TaskGroupOption = 
  | 'status'
  | 'priority'
  | 'agent'
  | 'none';

/**
 * 视图配置
 */
export interface ViewConfig {
  filter: TaskFilter;
  sort: {
    by: TaskSortOption;
    ascending: boolean;
  };
  group: TaskGroupOption;
  
  // 显示选项
  showCompleted: boolean;
  showFailed: boolean;
  showProgress: boolean;
  
  // 布局选项
  compactMode: boolean;
  showIcons: boolean;
  showTime: boolean;
}

/**
 * 键盘快捷键配置
 */
export interface KeyboardShortcuts {
  expandAll: string;
  collapseAll: string;
  toggleDetails: string;
  refresh: string;
  filter: string;
  search: string;
}

/**
 * 本地存储状态
 */
export interface LocalStorageState {
  // 用户偏好
  viewConfig: ViewConfig;
  expandedTaskIds: string[];
  selectedTaskId?: string;
  
  // 面板状态
  panelWidth: number;
  panelHeight: number;
  
  // 历史记录
  recentTaskPlans: string[];
  
  // 配置版本
  version: string;
}