// 统一的消息接口
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// 消息元数据详细定义
export interface MessageMetadata {
  toolCalls?: ToolCall[];
  confidence?: number;
  source?: string;
  userContext?: UserContext;
  sessionInfo?: SessionInfo;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  success: boolean;
  duration?: number;
}

export interface UserContext {
  userId: string;
  preferences: Record<string, unknown>;
  historySummary: string;
}

export interface SessionInfo {
  sessionId: string;
  projectId: string;
  environment: 'development' | 'production' | 'testing';
}

// 统计信息接口
export interface LogStats {
  totalSessions: number;
  totalMessages: number;
  memoryUsage: string;
  averageResponseTime?: number;
  errorRate?: number;
  sessionDuration?: number;
}

export interface SchedulerStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks?: number;
  averageTaskDuration?: number;
  queueLength?: number;
  throughput?: number;
}

export interface RuleStats {
  totalRules: number;
  rulesByCategory: Record<string, number>;
  averageConfidence: number;
  highConfidenceRules: number;
  lowConfidenceRules: number;
  rulesBySource: Record<string, number>;
}

// 习惯学习统计
export interface HabitStats {
  totalHabits: number;
  habitsByCategory: Record<string, number>;
  averageConfidence: number;
  activeHabits: number;
  inactiveHabits: number;
}

// 知识库统计
export interface KnowledgeStats {
  totalFacts: number;
  factsByCategory: Record<string, number>;
  averageRelevance: number;
  lastUpdated: Date;
}

// 处理结果接口
export interface ProcessResult {
  enhancedContext: EnhancedContext;
  knowledgeContext: KnowledgeContext;
  recommendations: Recommendation[];
  metadata?: ProcessMetadata;
}

export interface EnhancedContext {
  habits?: Habit[];
  preferences?: Preference[];
  userHistory?: UserHistory;
  currentTask?: CurrentTask;
}

export interface Habit {
  id: string;
  name: string;
  confidence: number;
  frequency: number;
  category: string;
}

export interface Preference {
  id: string;
  type: string;
  value: unknown;
  confidence: number;
}

export interface UserHistory {
  totalInteractions: number;
  recentTopics: string[];
  averageResponseTime: number;
}

export interface CurrentTask {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
}

export interface KnowledgeContext {
  relevantFacts: Fact[];
  relatedTopics: string[];
  recommendations: string[];
  confidence: number;
}

export interface Fact {
  id: string;
  content: string;
  source: string;
  relevance: number;
  lastUsed?: Date;
}

export interface Recommendation {
  id: string;
  type: 'tool' | 'approach' | 'optimization';
  content: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

export interface ProcessMetadata {
  processingTime: number;
  confidence?: number;
  warnings?: string[];
  modulesUsed: string[];
  cacheHit?: boolean;
}

// 任务分解接口
export interface TaskDecomposition {
  tasks: Task[];
  totalEstimatedTime: number;
  dependencies?: TaskDependency[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedResources: ResourceEstimate;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
  requiredSkills?: string[];
  estimatedEffort: number;
  riskLevel: 'low' | 'medium' | 'high';
  deliverables?: string[];
}

export interface TaskDependency {
  from: string;
  to: string;
  type: 'sequential' | 'parallel';
  description?: string;
  required?: boolean;
}

export interface ResourceEstimate {
  developerHours: number;
  testingHours: number;
  reviewHours: number;
  totalHours: number;
  requiredTools: string[];
  skillRequirements: SkillRequirement[];
}

export interface SkillRequirement {
  skill: string;
  level: 'basic' | 'intermediate' | 'advanced';
  required: boolean;
}

// 配置接口
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface IntegrationConfig {
  enableMemory: boolean;
  enableRuleForge: boolean;
  enableScheduler: boolean;
  logLevel: LogLevel;
  cacheEnabled?: boolean;
  retryAttempts?: number;
}

// 任务DAG接口
export interface TaskDAG {
  tasks: Task[];
  dependencies: TaskDependency[];
  metadata: TaskDAGMetadata;
}

export interface TaskDAGMetadata {
  createdAt: Date;
  createdBy: string;
  estimatedCompletionTime: Date;
  totalTasks: number;
}

// 任务状态接口
export interface TaskStatus {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: unknown;
}

// 规则提取结果接口
export interface RuleExtractionResult {
  patterns: Pattern[];
  totalPatterns: number;
  averageConfidence: number;
  extractionTime: number;
}

export interface Pattern {
  id: string;
  type: string;
  confidence: number;
  content: string;
  source: string;
  metadata?: PatternMetadata;
}

export interface PatternMetadata {
  frequency: number;
  complexity: number;
  applicability: string[];
}

// 规则注入结果接口
export interface RuleInjectionResult {
  originalCode: string;
  modifiedCode: string;
  appliedRules: AppliedRule[];
  totalApplied: number;
  injectionTime: number;
}

export interface AppliedRule {
  patternId: string;
  location: CodeLocation;
  success: boolean;
  message?: string;
}

export interface CodeLocation {
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

// 集成服务主接口
export interface IIntegrationService {
  initialize(): Promise<void>;
  setCurrentSession(sessionId: string): void;
  processUserMessage(message: Message): Promise<ProcessResult>;
  processAIResponse(message: Message, originalMessage: Message): Promise<void>;
  decomposeTask(requirement: string): Promise<TaskDecomposition>;
  scheduleTasks(dag: TaskDAG): Promise<TaskSchedulingResult>;
  getTaskStatus(taskId: string): Promise<TaskStatus>;
  getAllTaskStatus(): Promise<TaskStatus[]>;
  extractRules(sessionData: SessionData): Promise<RuleExtractionResult>;
  extractRulesBatch(sessionsData: SessionData[]): Promise<RuleExtractionResult[]>;
  generateYAMLRules(patterns: Pattern[]): Promise<string>;
  injectRulesToCode(code: string, patterns: Pattern[]): Promise<RuleInjectionResult>;
  getIntegrationStatus(): IntegrationStatus;
  getMemoryStats(): Promise<MemoryStats>;
  getSchedulerStats(): Promise<SchedulerStats>;
  getRuleStats(patterns: Pattern[]): Promise<RuleStats>;
  exportIntegrationData(): Promise<string>;
  reset(): Promise<void>;
}

export interface SessionData {
  id: string;
  messages: Message[];
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  projectId: string;
  environment: string;
  startTime: Date;
  endTime?: Date;
}

export interface TaskSchedulingResult {
  totalTasks: number;
  scheduledTasks: number;
  failedTasks: number;
  scheduledAt: Date;
}

export interface IntegrationStatus {
  memorySystem: boolean;
  ruleForge: boolean;
  scheduler: boolean;
  isInitialized: boolean;
  lastCheck: Date;
}

export interface MemoryStats {
  shortTermMemory: number;
  workingMemory: number;
  totalSessions: number;
  logStats?: LogStats;
  knowledgeStats?: KnowledgeStats;
}

// 核心服务接口
export interface IConversationLogger {
  initialize(): Promise<void>;
  logMessage(message: Message): Promise<void>;
  getConversationHistory(options: { sessionId?: string; limit?: number }): Promise<Message[]>;
  getLogStats(): Promise<LogStats>;
  reset(): Promise<void>;
}

export interface IHabitLearner {
  initialize(): Promise<void>;
  analyzeHabits(messages: Message[]): Promise<Habit[]>;
  predictPreferences(context: UserContext): Promise<Preference[]>;
  getHabitStats(): Promise<HabitStats>;
  reset(): Promise<void>;
}

export interface IKnowledgeTransfer {
  initialize(): Promise<void>;
  extractKnowledge(messages: Message[]): Promise<KnowledgeExtractionResult>;
  updateKnowledgeBase(knowledge: KnowledgeUpdate): Promise<void>;
  transferKnowledge(source: TransferSource, target: TransferTarget): Promise<KnowledgeTransferResult>;
  getKnowledgeBaseStats(): Promise<KnowledgeStats>;
  exportKnowledgeBase(): Promise<KnowledgeExport>;
  reset(): Promise<void>;
}

export interface KnowledgeExtractionResult {
  facts: Fact[];
  relationships: Relationship[];
  confidence: number;
  extractionTime: number;
}

export interface Relationship {
  id: string;
  from: string;
  to: string;
  type: string;
  confidence: number;
}

export interface KnowledgeUpdate {
  facts: Fact[];
  relationships: Relationship[];
  metadata: UpdateMetadata;
}

export interface UpdateMetadata {
  source: string;
  timestamp: Date;
  confidence: number;
}

export interface TransferSource {
  context: Record<string, unknown>;
  requirements: string[];
  constraints: string[];
}

export interface TransferTarget {
  context: Record<string, unknown>;
  capabilities: string[];
  limitations: string[];
}

export interface KnowledgeTransferResult {
  transferredFacts: Fact[];
  adaptedFacts: Fact[];
  confidence: number;
  transferTime: number;
}

export interface KnowledgeExport {
  facts: Fact[];
  relationships: Relationship[];
  metadata: ExportMetadata;
}

export interface ExportMetadata {
  exportedAt: Date;
  totalFacts: number;
  totalRelationships: number;
}

export interface IMemoryStore {
  initialize(): Promise<void>;
  storeShortTermMemory(sessionId: string, data: MemoryData): Promise<void>;
  getShortTermMemory(sessionId: string): Promise<MemoryItem[]>;
  getMemoryStats(): Promise<MemoryStats>;
  storeWorkingMemory(sessionId: string, data: WorkingMemoryData): Promise<void>;
  getWorkingMemory(sessionId: string): Promise<WorkingMemoryData>;
  exportMemoryData(): Promise<MemoryExport>;
  reset(): Promise<void>;
}

export interface MemoryData {
  sessionId: string;
  content: Record<string, unknown>;
  timestamp: Date;
  importance: 'low' | 'medium' | 'high';
  metadata?: MemoryMetadata;
}

export interface MemoryMetadata {
  source: string;
  confidence: number;
  tags: string[];
}

export interface MemoryItem {
  id: string;
  sessionId: string;
  content: Record<string, unknown>;
  timestamp: Date;
  importance: 'low' | 'medium' | 'high';
  metadata?: MemoryMetadata;
}

export interface WorkingMemoryData {
  sessionId: string;
  currentTask?: CurrentTask;
  activeContext: Record<string, unknown>;
  recentInteractions: RecentInteraction[];
  lastUpdated: Date;
}

export interface RecentInteraction {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  importance: number;
}

export interface MemoryExport {
  shortTermMemory: MemoryItem[];
  workingMemory: WorkingMemoryData[];
  metadata: MemoryExportMetadata;
}

export interface MemoryExportMetadata {
  exportedAt: Date;
  totalItems: number;
  totalSessions: number;
}

export interface IRuleForgeIntegration {
  initialize(): Promise<void>;
  extractRulesFromSession(sessionData: SessionData): Promise<RuleExtractionResult>;
  extractRulesFromAllSessions(sessionsData: SessionData[]): Promise<RuleExtractionResult[]>;
  generateYAMLRules(patterns: Pattern[]): Promise<string>;
  injectRulesIntoCode(code: string, patterns: Pattern[]): Promise<RuleInjectionResult>;
  getRuleStats(patterns: Pattern[]): Promise<RuleStats>;
  reset(): Promise<void>;
}

export interface ISchedulerIntegration {
  initialize(): Promise<void>;
  decomposeTask(requirement: string): Promise<TaskDecomposition>;
  scheduleTasks(dag: TaskDAG): Promise<TaskSchedulingResult>;
  getTaskStatus(taskId: string): Promise<TaskStatus>;
  getAllTaskStatus(): Promise<TaskStatus[]>;
  getSchedulerStats(): Promise<SchedulerStats>;
  reset(): Promise<void>;
}

// 错误处理枚举
export enum ErrorCode {
  NOT_INITIALIZED = 'INTEGRATION_NOT_INITIALIZED',
  INVALID_MESSAGE = 'INVALID_MESSAGE_FORMAT',
  MODULE_UNAVAILABLE = 'MODULE_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'OPERATION_TIMEOUT'
}

// 模块枚举
export enum IntegrationModule {
  CONVERSATION_LOGGER = 'conversationLogger',
  HABIT_LEARNER = 'habitLearner',
  KNOWLEDGE_TRANSFER = 'knowledgeTransfer',
  MEMORY_STORE = 'memoryStore',
  RULEFORGE_INTEGRATION = 'ruleForgeIntegration',
  SCHEDULER_INTEGRATION = 'schedulerIntegration',
  MICROSERVICES = 'microservices',
  SERVICE_REGISTRY = 'serviceRegistry',
  PLUGIN_SYSTEM = 'pluginSystem',
  INTEGRATION_SERVICE = 'integrationService',
  CONFIGURATION = 'configuration'
}

// 默认配置
export const DEFAULT_CONFIG: IntegrationConfig = {
  enableMemory: true,
  enableRuleForge: true,
  enableScheduler: true,
  logLevel: 'info',
  cacheEnabled: true,
  retryAttempts: 3
};

// 常量定义
export const MAX_MESSAGE_LENGTH = 5000;
export const DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟