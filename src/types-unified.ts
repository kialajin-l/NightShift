// ==========================================
// NightShift 统一类型定义
// 整合了 CodePilot 核心类型和 NightShift 自定义类型
// ==========================================

// 从 CodePilot 类型导入
import type {
  ToolUseInfo,
  ToolResultInfo,
  PermissionRequestEvent,
  TokenUsage,
  StreamEvent,
  StreamEventListener,
  SkillLockFile,
  SessionStreamSnapshot,
  ClaudeStreamOptions,
  MCPServerConfig,
  PluginInfo,
} from './types-codepilot';
import type {
  RateLimitInfo,
  ContextUsageSnapshot,
} from './hooks/useSSEStream';

// 从 CodePilot 类型重新导出
export type { ToolUseInfo, ToolResultInfo, PermissionRequestEvent, TokenUsage, RateLimitInfo, ContextUsageSnapshot, StreamEvent, StreamEventListener, SkillLockFile, SessionStreamSnapshot, ClaudeStreamOptions, MCPServerConfig, PluginInfo };

// 从 CodePilot 类型导出
export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  model: string;
  system_prompt: string;
  working_directory: string;
  sdk_session_id: string;
  project_name: string;
  status: 'active' | 'archived';
  mode?: 'code' | 'plan' | 'ask';
  needs_approval?: boolean;
  provider_name: string;
  provider_id: string;
  sdk_cwd: string;
  runtime_status: string;
  runtime_updated_at: string;
  runtime_error: string;
  permission_profile?: 'default' | 'full_access';
  context_summary?: string;
  context_summary_updated_at?: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  token_usage: string | null;
  is_heartbeat_ack?: number;
  _rowid?: number;
  timestamp?: Date; // NightShift 兼容
  files?: FileAttachment[]; // NightShift 兼容
  isError?: boolean; // NightShift 兼容
}

export interface FileAttachment {
  id: string;
  name: string;
  path?: string;
  content?: string;
  size: number;
  type: string;
  filePath?: string;
  data: string; // NightShift 兼容
}

export interface TaskItem {
  id: string;
  session_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description: string | null;
  source: 'user' | 'sdk';
  created_at: string;
  updated_at: string;
}

// NightShift 扩展任务类型
export interface Task extends TaskItem {
  name: string;
  description: string;
  type: 'frontend' | 'backend' | 'test' | 'documentation';
  priority: 'low' | 'medium' | 'high';
  estimatedTime?: number;
  dependencies?: string[];
  agent?: string;
  model?: string;
}

export interface ProjectInfo {
  path: string;
  name: string;
  files_count: number;
  last_modified: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  size?: number;
  extension?: string;
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

export interface ModelProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'ollama' | 'deepseek' | 'custom';
  baseUrl?: string;
  apiKey?: string;
  models: string[];
  isEnabled: boolean;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
  projectPath?: string;
}

export interface NightShiftConfig {
  providers: ModelProvider[];
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  enableAutoSave: boolean;
  enableTaskTracking: boolean;
  enableRuleExtraction: boolean;
}

export interface SendMessageRequest {
  sessionId: string;
  content: string;
  files?: FileAttachment[];
  model?: string;
  providerId?: string;
  session_id?: string; // CodePilot 兼容
  mode?: 'code' | 'plan' | 'ask'; // CodePilot 兼容
}

export interface WorkflowRequest {
  sessionId: string;
  userInput: string;
  files?: FileAttachment[];
}

export interface WorkflowResponse {
  success: boolean;
  tasks: Task[];
  generatedFiles: GeneratedFile[];
  extractedRules: Rule[];
  totalTime: number;
  errors: string[];
}

export interface GeneratedFile {
  type: 'frontend' | 'backend' | 'config';
  name: string;
  content: string;
  path: string;
}

export interface Rule {
  id: string;
  category: string;
  description: string;
  confidence: number;
  pattern: {
    trigger: string;
    solution: string;
  };
}

export interface UsageStats {
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  byProvider: Record<string, ProviderUsage>;
  byModel: Record<string, ModelUsage>;
  byDate: Record<string, DailyUsage>;
}

export interface ProviderUsage {
  providerId: string;
  tokens: number;
  cost: number;
  requests: number;
}

export interface ModelUsage {
  modelName: string;
  tokens: number;
  cost: number;
  requests: number;
}

export interface DailyUsage {
  date: string;
  tokens: number;
  cost: number;
  requests: number;
}

// Media content block
export interface MediaBlock {
  type: 'image' | 'audio' | 'video';
  data?: string;
  mimeType: string;
  localPath?: string;
  mediaId?: string;
}

export type MessageContentBlock =
  | { type: 'text'; text: string }
  | { type: 'thinking'; thinking: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean; media?: MediaBlock[] }
  | { type: 'code'; language: string; code: string };

export interface Setting {
  id: number;
  key: string;
  value: string;
}

export interface ApiProvider {
  id: string;
  name: string;
  type: string;
  baseUrl?: string;
  apiKey?: string;
  models?: string[];
  isDefault?: boolean;
  isActive?: boolean;
  // Legacy snake_case properties - make required for types-codepilot compatibility
  base_url: string;
  provider_type: string;
  api_key: string;
  extra_env: string;
  role_models_json: string;
  env_overrides_json: string;
  headers_json: string;
  protocol: string;
  options_json: string;
  notes: string;
  sort_order: number;
  // Required properties for types-codepilot compatibility
  is_active: number;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export type SkillKind = 'agent_skill' | 'slash_command' | 'sdk_command' | 'codepilot_command';

export type PopoverMode = 'file' | 'skill' | 'cli' | null;

export interface CommandBadge {
  command: string;
  label: string;
  description: string;
  kind: SkillKind;
  installedSource?: 'agents' | 'claude';
}

export interface CliToolItem {
  id: string;
  name: string;
  version: string | null;
  summary: string;
}

export interface MentionRef {
  type?: 'file' | 'directory';
  path: string;
  label?: string;
  nodeType?: string;
  display?: string;
  sourceRange?: { start: number; end: number };
}

// ==========================================
// Scheduled Tasks
// ==========================================

export interface ScheduledTask {
  id: string;
  name: string;
  prompt: string;
  schedule_type: 'cron' | 'interval' | 'once';
  schedule_value: string;
  next_run: string;
  last_run?: string;
  last_status?: 'success' | 'error' | 'skipped' | 'running';
  last_error?: string;
  last_result?: string;
  consecutive_errors: number;
  status: 'active' | 'paused' | 'completed' | 'disabled';
  priority: 'low' | 'normal' | 'urgent';
  notify_on_complete: number;
  session_id?: string;
  working_directory?: string;
  permanent: number;
  created_at: string;
  updated_at: string;
}
