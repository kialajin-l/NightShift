// ==========================================
// NightShift 统一类型定义
// 整合了 CodePilot 核心类型和 NightShift 自定义类型
// ==========================================

import { Message, Session, Task, GeneratedFile, Rule, ChatSession } from "../types-unified";
export * from "../types-unified";

// Re-export types-codepilot types needed by hooks
export type { PopoverItem, ProviderModelGroup, SSEEvent, SSEEventType, CliBadge, GitBranch, GitLogEntry, GitStatus, GitWorktree, PlannerItem, JobProgressEvent, MediaJob, MediaJobItem, PlannerOutput, MarketplaceSkill, SetupCardStatus, ProviderOptions, WorkspaceInspectResult } from "../types-codepilot";

export interface GitChangedFile {
  path: string;
  status: string;
  staged?: boolean;
}

export interface CustomCliTool {
  id: string;
  name: string;
  command: string;
  args?: string[];
  version?: string;
  binPath?: string;
}

export type CliToolPlatform = 'win32' | 'darwin' | 'linux';

export interface CliToolDefinition {
  id: string;
  name: string;
  description?: string;
  summaryZh?: string;
  summaryEn?: string;
  categories?: string[];
  installMethods?: Array<{ method: string; command?: string; platforms?: CliToolPlatform[] }>;
  postInstallCommands?: string[];
  setupType?: string;
  agentFriendly?: boolean;
  supportsJson?: boolean;
  supportsSchema?: boolean;
  supportsDryRun?: boolean;
  contextFriendly?: boolean;
  detailIntro?: { zh: string; en: string };
  useCases?: { zh: string[]; en: string[] };
  guideSteps?: { zh: string[]; en: string[] };
  examplePrompts?: Array<{ label: string; prompt?: string; promptZh?: string; promptEn?: string }>;
  homepage?: string;
  repoUrl?: string;
  officialDocsUrl?: string;
}

export interface CliToolRuntimeInfo {
  id: string;
  status: string;
  version?: string;
  binPath?: string;
}

export interface CliToolStructuredDesc {
  useCases: { zh: string[]; en: string[] };
  guideSteps: { zh: string[]; en: string[] };
  examplePrompts: Array<{ label: string; prompt: string }>;
  agentCompat?: Record<string, boolean>;
  intro?: { zh: string; en: string };
}

export interface GitCommitDetail {
  sha: string;
  message: string;
  author: string;
  authorName?: string;
  authorEmail?: string;
  date: string;
  timestamp?: string;
  files: string[];
  stats?: { additions: number; deletions: number; total: number };
  diff?: string;
}

// NightShift 特有的扩展类型
export interface WorkflowResult {
  success: boolean;
  tasks: TaskItem[];
  generatedFiles: GeneratedFile[];
  extractedRules: Rule[];
  totalTime: number;
  errors: string[];
}

export interface AIProviderConfig {
  id: string;
  name: string;
  type: 'ollama' | 'openrouter' | 'openai' | 'anthropic' | 'custom';
  baseUrl: string;
  models: string[];
  isActive: boolean;
  isDefault?: boolean;
  apiKey?: string;
  headers?: Record<string, string>;
}

export interface ModelOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface Conversation {
  id: string;
  sessionId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modifiedAt: Date;
}

export interface DirectoryInfo {
  path: string;
  files: FileInfo[];
  directories: FileInfo[];
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (params: unknown) => Promise<unknown>;
}

export interface Agent {
  id: string;
  name: string;
  role: 'scheduler' | 'frontend' | 'backend' | 'test' | 'documentation';
  description: string;
  tools: AgentTool[];
  model: string;
  isActive: boolean;
}

export interface MCPConnection {
  id: string;
  name: string;
  type: 'server' | 'client';
  url: string;
  isConnected: boolean;
  lastActivity: Date;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  parameters: Record<string, unknown>;
  execute: (params: unknown) => Promise<unknown>;
}

export interface MCPServer {
  id: string;
  name: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  enabled?: boolean;
  type?: 'sse' | 'http';
  url?: string;
  headers?: Record<string, string>;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  fonts: {
    primary: string;
    mono: string;
  };
  isDark: boolean;
}

export interface RuntimeConfig {
  type: 'native' | 'sdk';
  version: string;
  capabilities: string[];
  isAvailable: boolean;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EventBus {
  on(event: string, callback: (data: unknown) => void): void;
  off(event: string, callback: (data: unknown) => void): void;
  emit(event: string, data?: unknown): void;
}

export interface FileUtils {
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<void>;
  listDirectory(dirPath: string): Promise<DirectoryInfo>;
  fileExists(filePath: string): Promise<boolean>;
  createDirectory(dirPath: string): Promise<void>;
  deletePath(path: string): Promise<void>;
}

export interface ConversationRegistry {
  createSession(title: string, description?: string): Session;
  getCurrentSession(): Session | null;
  addMessageToCurrentSession(message: Message): void;
  getConversation(sessionId: string): Conversation | null;
  getAllSessions(): Session[];
  deleteSession(sessionId: string): void;
  switchSession(sessionId: string): void;
}

export interface AIProviderService {
  getModels(providerId?: string): Promise<string[]>;
  sendMessage(providerId: string, model: string, messages: unknown[]): Promise<unknown>;
  getActiveProviders(): AIProviderConfig[];
  setDefaultProvider(providerId: string): void;
}

// Taxonomy types (from types-codepilot, needed by workspace-taxonomy.ts)
export interface TaxonomyCategory {
  id: string;
  label: string;
  paths: string[];
  role: string;
  confidence: number;
  source: 'user' | 'learned' | 'default';
  description: string;
  createdBy: string;
}

export interface TaxonomyFile {
  version: number;
  categories: TaxonomyCategory[];
  evolutionRules: {
    allowAutoCreateCategory: boolean;
    allowAutoArchive: boolean;
    requireConfirmationForMoves: boolean;
  };
}

// SearchResult type (from types-codepilot, needed by workspace-retrieval.ts)
export interface SearchResult {
  path: string;
  heading: string;
  snippet: string;
  score: number;
  source: 'title' | 'heading' | 'tag' | 'content';
  filePath?: string;
  content?: string;
}

// ==========================================
// Workspace Index Types (from types-codepilot)
// ==========================================

export interface AssistantWorkspaceConfig {
  workspaceType: string;
  organizationStyle: 'project' | 'time' | 'topic' | 'mixed';
  captureDefault: string;
  archivePolicy: {
    completedTaskArchiveAfterDays: number;
    closedProjectArchive: boolean;
    dailyMemoryRetentionDays: number;
  };
  ignore: string[];
  index: {
    maxFileSizeKB: number;
    chunkSize: number;
    chunkOverlap: number;
    maxDepth: number;
    includeExtensions: string[];
  };
}

export interface AssistantWorkspaceState {
  onboardingComplete: boolean;
  lastHeartbeatDate: string | null;
  lastHeartbeatText?: string;
  lastHeartbeatSentAt?: string;
  hookTriggeredSessionId?: string;
  hookTriggeredAt?: string;
  heartbeatEnabled: boolean;
  schemaVersion: number;
  buddy?: {
    emoji: string;
    buddyName?: string;
    species?: string;
    rarity?: string;
    peakStat?: string;
  };
  lastCheckInDate?: string | null;
  dailyCheckInEnabled?: boolean;
}

export interface AssistantWorkspaceFiles {
  claude: string;
  soul: string;
  user: string;
  memory: string;
}

export interface AssistantWorkspaceFilesV2 {
  claude: string;
  soul: string;
  user: string;
  memory: string;
  daily: string[];
  rootDir?: string;
  heartbeatMd?: string;
}

export interface ManifestEntry {
  noteId: string;
  path: string;
  title: string;
  aliases: string[];
  tags: string[];
  headings: string[];
  mtime: number;
  size: number;
  hash: string;
  summary: string;
  categoryIds: string[];
}

export interface ChunkEntry {
  chunkId: string;
  noteId: string;
  path: string;
  heading: string;
  text: string;
  startLine: number;
  endLine: number;
}

export interface HotsetFile {
  pinned: string[];
  frequent: Array<{ path: string; count: number; lastAccessed: number }>;
  lastUpdated: number;
}

// ==========================================
// API Route Types
// ==========================================

export interface ErrorResponse {
  error: string;
  details?: string;
  code?: string | number;
}

export interface MessagesResponse {
  messages: Message[];
  hasMore?: boolean;
}

export interface CreateSessionRequest {
  title: string;
  description?: string;
  working_directory?: string;
  model?: string;
  system_prompt?: string;
  mode?: string;
  provider_id?: string;
  permission_profile?: string;
}

export interface SessionsResponse {
  sessions: ChatSession[];
}

export interface SessionResponse {
  session: ChatSession;
}

export interface FileTreeResponse {
  path: string;
  name: string;
  type: 'file' | 'directory';
  root?: string;
  children?: FileTreeResponse[];
  tree?: FileTreeResponse[];
}
export interface FilePreview {
  path: string;
  content: string;
  language: string;
  line_count: number;
  line_count_exact: boolean;
  truncated: boolean;
  bytes_read: number;
  bytes_total: number;
}

export interface FilePreviewResponse {
  preview: FilePreview;
}

export type MentionNodeType = string;

export interface UpdateMediaJobItemsRequest {
  items: any[];
}

export interface PlanMediaJobRequest {
  prompt: string;
  style?: string;
  stylePrompt?: string;
  sessionId?: string;
  docContent?: string;
  docPaths?: string[];
  count?: number;
}

export interface PermissionDecision {
  behavior: 'allow' | 'deny';
  updatedPermissions?: unknown[];
  updatedInput?: string;
  message?: string;
}

export interface PermissionResponseRequest {
  permissionRequestId: string;
  decision: PermissionDecision | string;
  id?: string;
  approved?: boolean;
}

// Re-export DashboardWidget from types-codepilot (authoritative definition)
export type { DashboardWidget, DashboardDataSource, DashboardConfig, DashboardSettings } from "../types-codepilot/dashboard";

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

// Inline ApiProvider (types-codepilot excluded from root tsconfig)
export interface ApiProvider {
  id: string;
  name: string;
  provider_type: string;
  protocol: string;
  base_url: string;
  api_key: string;
  is_active: number;
  sort_order: number;
  extra_env: string;
  headers_json: string;
  env_overrides_json: string;
  role_models_json: string;
  options_json: string;
  notes: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface ProviderResponse {
  provider: ApiProvider;
}

export interface CreateProviderRequest {
  name: string;
  type: string;
  provider_type?: string;
  baseUrl: string;
  base_url?: string;
  apiKey?: string;
  api_key?: string;
  models?: string[];
  protocol?: string;
  config?: Record<string, any>;
  is_active?: boolean;
  sort_order?: number;
  extra_env?: Record<string, string>;
  headers_json?: Record<string, string>;
}

export interface UpdateProviderRequest {
  name?: string;
  baseUrl?: string;
  base_url?: string;
  apiKey?: string;
  api_key?: string;
  models?: string[];
  protocol?: string;
  provider_type?: string;
  config?: Record<string, any>;
  is_active?: boolean;
  sort_order?: number;
  extra_env?: Record<string, string>;
  headers_json?: Record<string, string>;
}

export interface TasksResponse {
  tasks: TaskItem[];
}

export interface TaskResponse {
  task: TaskItem;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: string;
  session_id?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
}

export interface PluginsResponse {
  plugins: any[];
}

export interface MCPConfigResponse {
  servers: MCPServer[];
}

export interface CreateMediaJobRequest {
  prompt: string;
  style?: string;
  stylePrompt?: string;
  sessionId?: string;
  docContent?: string;
  docPaths?: string[];
  count?: number;
  items?: any[];
  batchConfig?: any;
}

export interface UpdateMediaJobItemsRequest {
  items: any[];
}

export interface ReferenceImage {
  id: string;
  url: string;
  name: string;
  data?: string;
  mimeType?: string;
  localPath?: string;
}


export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  source?: string;
  session_id?: string;
  name?: string;
  type?: string;
  priority?: string;
  created_at?: string;
  updated_at?: string;
}

export function isImageFile(filename: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(filename);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Selective re-exports from types-codepilot (non-duplicate types)
export type {
  AddMCPServerRequest,
  BatchConfig,
  ChatSession,
  ClaudeStreamOptions,
  CliToolAgentCompat,
  CliToolCategory,
  CliToolExamplePrompt,
  CliToolInstallMethod,
  CliToolItem,
  CliToolStatus,
  CommandBadge,
  ConversationHistoryItem,
  CreateSkillRequest,
  FileAttachment,
  FilePreviewRequest,
  FileTreeNode,
  FileTreeRequest,
  IconComponent,
  InstallMethod,
  JobProgressEventType,
  MCPConfig,
  MCPServerConfig,
  MediaBlock,
  MediaContextEvent,
  MediaJobItemStatus,
  MediaJobListResponse,
  MediaJobResponse,
  MediaJobStatus,
  MentionRef,
  Message,
  MessageContentBlock,
  PermissionRequestEvent,
  PermissionSuggestion,
  PluginInfo,
  PopoverMode,
  ProjectInfo,
  ProviderModel,
  ProvidersResponse,
  ScheduledTask,
  SendMessageRequest,
  SessionStreamSnapshot,
  Setting,
  SettingsMap,
  SettingsResponse,
  SetupState,
  SkillDefinition,
  SkillKind,
  SkillLockEntry,
  SkillLockFile,
  SkillResponse,
  SkillsResponse,
  StreamEvent,
  StreamEventListener,
  StreamPhase,
  TaskStatus,
  TokenUsage,
  ToolResultInfo,
  ToolUseInfo,
  UpdateMCPConfigRequest,
  UpdateSettingsRequest,
  UpdateSkillRequest,
  WeixinAccount,
  WeixinContextTokenRecord,
  } from '@/types-codepilot';
export {
  SETTING_KEYS,
  isMediaFile,
  isVideoFile,
  parseMessageContent,
  } from '@/types-codepilot';
