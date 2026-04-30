// 工具函数集合

// 简单的任务接口定义（用于工具函数）
interface SimpleTask {
  id: string;
  status: string;
  estimatedTime?: number;
}

interface WorkflowResult {
  success: boolean;
  tasks?: any[];
  generatedFiles?: any[];
  extractedRules?: any[];
  errors?: any[];
  totalTime?: number;
  data?: any;
  error?: string;
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 格式化时间
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 格式化日期
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 计算任务进度
 */
export function calculateTaskProgress(tasks: SimpleTask[]): {
  total: number;
  completed: number;
  progress: number;
} {
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === 'completed').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { total, completed, progress };
}

/**
 * 估算任务完成时间
 */
export function estimateCompletionTime(tasks: SimpleTask[]): number {
  return tasks
    .filter(task => task.status !== 'completed')
    .reduce((total, task) => total + (task.estimatedTime || 0), 0);
}

/**
 * 验证文件类型
 */
export function isValidFileType(file: File, allowedTypes: string[] = ['text/plain', 'application/json']): boolean {
  return allowedTypes.includes(file.type) || file.name.endsWith('.txt') || file.name.endsWith('.json');
}

/**
 * 读取文件内容
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, type: string = 'text/plain'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 本地存储操作
 */
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
};

/**
 * 错误处理
 */
export class NightShiftError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NightShiftError';
  }
}

/**
 * 安全执行异步函数
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<{ data?: T; error?: Error }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(errorMessage || 'Execution failed:', err);
    return { error: err };
  }
}

/**
 * 验证工作流结果
 */
export function validateWorkflowResult(result: WorkflowResult): boolean {
  return (
    result.success !== undefined &&
    Array.isArray(result.tasks) &&
    Array.isArray(result.generatedFiles) &&
    Array.isArray(result.extractedRules) &&
    Array.isArray(result.errors) &&
    typeof result.totalTime === 'number'
  );
}

/**
 * 生成任务依赖图
 */
export function generateTaskDependencyGraph(tasks: SimpleTask[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  
  tasks.forEach(task => {
    graph.set(task.id, (task as any).dependencies || []);
  });
  
  return graph;
}

/**
 * 检查循环依赖
 */
export function hasCircularDependency(tasks: SimpleTask[]): boolean {
  const graph = generateTaskDependencyGraph(tasks);
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const dependencies = graph.get(nodeId) || [];
    for (const depId of dependencies) {
      if (dfs(depId)) return true;
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
  
  for (const taskId of graph.keys()) {
    if (dfs(taskId)) return true;
  }
  
  return false;
}