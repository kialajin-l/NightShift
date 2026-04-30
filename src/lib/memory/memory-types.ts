// NightShift 记忆体系统类型定义

/**
 * 消息数据结构
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  metadata?: {
    toolCalls?: ToolCall[];
    codeBlocks?: CodeBlock[];
    errors?: Error[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    complexity?: 'simple' | 'medium' | 'complex';
    sessionId?: string;
    userId?: string;
    projectId?: string;
  };
}

/**
 * 工具调用数据结构
 */
export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
  duration?: number;
  success: boolean;
}

/**
 * 代码块数据结构
 */
export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
  changes?: CodeChange[];
  metadata?: {
    quality?: number; // 0-1
    complexity?: number; // 0-1
    styleScore?: number; // 0-1
  };
}

/**
 * 代码变更数据结构
 */
export interface CodeChange {
  type: 'add' | 'modify' | 'delete';
  lineNumber: number;
  content: string;
  oldContent?: string;
}

/**
 * 日志条目数据结构
 */
export interface LogEntry {
  id: string;
  type: 'message' | 'code-change' | 'error' | 'tool-call';
  timestamp: Date;
  data: Message | CodeChange | Error | ToolCall;
  sessionId: string;
  userId: string;
  projectId: string;
  tags: string[];
}

/**
 * 日志过滤器
 */
export interface LogFilters {
  sessionId?: string;
  userId?: string;
  projectId?: string;
  type?: string;
  tags?: string[];
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * 用户习惯数据结构
 */
export interface UserHabit {
  id: string;
  type: 'code-style' | 'architecture' | 'tool-usage' | 'communication';
  pattern: string;
  frequency: number;
  confidence: number; // 0-1
  firstSeen: Date;
  lastSeen: Date;
  examples: HabitExample[];
  metadata?: {
    impact?: 'positive' | 'negative' | 'neutral';
    category?: string;
    tags?: string[];
  };
}

/**
 * 习惯示例
 */
export interface HabitExample {
  context: string;
  code: string;
  explanation: string;
  timestamp: Date;
}

/**
 * 习惯配置文件
 */
export interface HabitProfile {
  userId: string;
  habits: UserHabit[];
  lastUpdated: Date;
  statistics: {
    totalHabits: number;
    positiveHabits: number;
    negativeHabits: number;
    averageConfidence: number;
  };
}

/**
 * 任务上下文
 */
export interface TaskContext {
  taskId: string;
  taskType: 'frontend' | 'backend' | 'testing' | 'documentation';
  technologyStack: string[];
  complexity: 'low' | 'medium' | 'high';
  requirements: string[];
  constraints: string[];
}

/**
 * 偏好预测
 */
export interface PreferencePrediction {
  type: string;
  preference: string;
  confidence: number; // 0-1
  reasoning: string;
  examples: string[];
}

/**
 * 知识数据结构
 */
export interface Knowledge {
  id: string;
  type: 'success-pattern' | 'error-pattern' | 'best-practice' | 'domain-knowledge';
  title: string;
  description: string;
  content: string;
  source: string;
  confidence: number; // 0-1
  relevance: number; // 0-1
  tags: string[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    author: string;
    version: string;
  };
}

/**
 * 知识上下文
 */
export interface KnowledgeContext {
  taskId: string;
  relevantKnowledge: Knowledge[];
  contextSummary: string;
  recommendations: string[];
  confidence: number; // 0-1
}

/**
 * 短期记忆数据结构
 */
export interface ShortTermMemory {
  id: string;
  sessionId: string;
  content: any;
  timestamp: Date;
  expiresAt: Date;
  importance: 'low' | 'medium' | 'high';
}

/**
 * 长期记忆数据结构
 */
export interface LongTermMemory {
  id: string;
  userId: string;
  type: 'habit' | 'knowledge' | 'preference';
  content: any;
  timestamp: Date;
  lastAccessed: Date;
  accessCount: number;
  importance: 'low' | 'medium' | 'high';
}

/**
 * 工作记忆数据结构
 */
export interface WorkingMemory {
  id: string;
  sessionId: string;
  currentTask: string;
  context: any;
  activeKnowledge: Knowledge[];
  recentActions: string[];
  timestamp: Date;
}

/**
 * 记忆体系统配置
 */
export interface MemorySystemConfig {
  // 对话记录配置
  logger?: {
    maxLogEntries?: number;
    retentionDays?: number;
    enableCompression?: boolean;
  };
  
  // 习惯学习配置
  learner?: {
    minConfidence?: number;
    minFrequency?: number;
    enableRealTimeLearning?: boolean;
    updateInterval?: number; // 分钟
  };
  
  // 知识传递配置
  transfer?: {
    maxRelevantKnowledge?: number;
    minRelevance?: number;
    enableContextOptimization?: boolean;
  };
  
  // 记忆存储配置
  store?: {
    shortTermRetention?: number; // 小时
    longTermRetention?: number; // 天
    enableVectorSearch?: boolean;
    databasePath?: string;
  };
  
  // 通用配置
  general?: {
    autoSave?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    enablePerformanceMonitoring?: boolean;
  };
}

/**
 * 记忆体系统统计信息
 */
export interface MemorySystemStats {
  totalLogEntries: number;
  totalHabits: number;
  totalKnowledge: number;
  shortTermMemorySize: number;
  longTermMemorySize: number;
  averageResponseTime: number;
  memoryUsage: number; // MB
  lastUpdated: Date;
}

/**
 * 记忆体系统事件
 */
export interface MemorySystemEvent {
  type: 'log-added' | 'habit-learned' | 'knowledge-extracted' | 'memory-updated';
  timestamp: Date;
  data: any;
  sessionId: string;
  userId: string;
}

/**
 * 记忆查询接口
 */
export interface MemoryQuery {
  sessionId?: string;
  userId?: string;
  projectId?: string;
  importance?: 'low' | 'medium' | 'high';
  fromDate?: Date;
  toDate?: Date;
  keywords?: string[];
  includeShortTerm?: boolean;
  includeLongTerm?: boolean;
  includeWorking?: boolean;
  limit?: number;
}

/**
 * 记忆统计信息
 */
export interface MemoryStats {
  totalShortTerm: number;
  totalLongTerm: number;
  totalWorking: number;
  shortTermByImportance: {
    low: number;
    medium: number;
    high: number;
  };
  longTermByType: {
    habit: number;
    knowledge: number;
    preference: number;
  };
  averageAccessCount: number;
  memoryUsage: {
    shortTerm: number;
    total: number;
  };
  lastCleanup: Date;
  // 兼容扩展字段
  logStats?: any;
  knowledgeStats?: any;
}

/**
 * 对话记录器配置
 */
export interface ConversationLoggerConfig {
  maxLogEntries: number;
  retentionDays: number;
  enableCompression: boolean;
  databasePath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 习惯学习器配置
 */
export interface HabitLearnerConfig {
  minConfidence: number;
  minFrequency: number;
  enableRealTimeLearning: boolean;
  updateInterval: number;
  databasePath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 记忆体系统 (MemorySystem)
 */
export interface MemorySystem {
  // 对话记录
  logger: any;
  // 习惯学习
  learner: any;
  // 知识传递
  transfer: any;
  // 记忆库
  store: any;
}