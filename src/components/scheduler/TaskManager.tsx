// NightShift 任务管理器界面

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, X, BarChart3, Filter, Download, Upload } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  description: string;
  agent: string;
  dependencies: string[];
  estimatedTime?: number;
  priority: string;
  status: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface TaskProgress {
  total: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
  progress: number;
  estimatedRemainingTime: number;
}

interface SchedulerStatus {
  isRunning: boolean;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  concurrencyLimit: number;
  memoryUsage: number;
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 加载任务数据
  useEffect(() => {
    loadTasks();
    loadProgress();
    loadStatus();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadTasks();
        loadProgress();
        loadStatus();
      }, 5000); // 每5秒自动刷新
      
      return () => clearInterval(interval);
    }
    return;
  }, [autoRefresh]);

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/scheduler/tasks?action=all');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTasks(result.data || []);
        }
      }
    } catch (error) {
      console.error('加载任务失败:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await fetch('/api/scheduler/tasks?action=progress');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProgress(result.data);
        }
      }
    } catch (error) {
      console.error('加载进度失败:', error);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/scheduler/tasks?action=status');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStatus(result.data);
        }
      }
    } catch (error) {
      console.error('加载状态失败:', error);
    }
  };

  // 开始调度器
  const startScheduler = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scheduler/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'schedule' })
      });
      
      if (response.ok) {
        await loadStatus();
      }
    } catch (error) {
      console.error('启动调度器失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 停止调度器
  const stopScheduler = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scheduler/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel-all' })
      });
      
      if (response.ok) {
        await loadStatus();
      }
    } catch (error) {
      console.error('停止调度器失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 重试失败任务
  const retryFailedTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scheduler/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry-failed' })
      });
      
      if (response.ok) {
        await loadTasks();
        await loadProgress();
      }
    } catch (error) {
      console.error('重试失败任务失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'running': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'failed': 'bg-red-100 text-red-800 border-red-200',
      'blocked': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-red-100 text-red-800 border-red-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 获取 Agent 颜色
  const getAgentColor = (agent: string) => {
    const colors: Record<string, string> = {
      'frontend': 'bg-blue-100 text-blue-800 border-blue-200',
      'backend': 'bg-green-100 text-green-800 border-green-200',
      'test': 'bg-purple-100 text-purple-800 border-purple-200',
      'design': 'bg-pink-100 text-pink-800 border-pink-200',
      'devops': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'documentation': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[agent] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false;
    }
    if (filterAgent !== 'all' && task.agent !== filterAgent) {
      return false;
    }
    return true;
  });

  // 获取唯一的状态和 Agent 列表
  const statusList = [...new Set(tasks.map(t => t.status))];
  const agentList = [...new Set(tasks.map(t => t.agent))];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">任务调度管理器</h1>
            <p className="text-sm text-muted-foreground">多 Agent 任务调度与监控</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startScheduler}
              disabled={isLoading || status?.isRunning}
            >
              <Play size={16} className="mr-2" />
              开始调度
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={stopScheduler}
              disabled={isLoading || !status?.isRunning}
            >
              <Pause size={16} className="mr-2" />
              停止调度
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={retryFailedTasks}
              disabled={isLoading}
            >
              <RotateCcw size={16} className="mr-2" />
              重试失败
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <Pause size={16} /> : <Play size={16} />}
              <span className="ml-2">{autoRefresh ? '暂停刷新' : '自动刷新'}</span>
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        {progress && status && (
          <div className="mt-4 grid grid-cols-6 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{progress.total}</div>
              <div className="text-sm text-blue-600">总任务数</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{progress.completed}</div>
              <div className="text-sm text-green-600">已完成</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
              <div className="text-sm text-red-600">已失败</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{progress.pending}</div>
              <div className="text-sm text-yellow-600">待处理</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{progress.progress}%</div>
              <div className="text-sm text-purple-600">总体进度</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(progress.estimatedRemainingTime / 60)}
              </div>
              <div className="text-sm text-orange-600">剩余时间(分)</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="border-b p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} />
            <span className="text-sm font-medium">筛选条件:</span>
          </div>
          
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">所有状态</option>
            {statusList.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select 
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">所有 Agent</option>
            {agentList.map(agent => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>

          <div className="text-sm text-muted-foreground">
            显示 {filteredTasks.length} / {tasks.length} 个任务
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">加载中...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无任务</h3>
            <p className="text-muted-foreground">
              {tasks.length === 0 
                ? '任务分解后，任务将显示在这里' 
                : '当前筛选条件下没有匹配的任务'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getAgentColor(task.agent)}>
                        {task.agent}
                      </Badge>
                      {task.estimatedTime && (
                        <span className="text-sm text-muted-foreground">
                          预计: {task.estimatedTime}分钟
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium">{task.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(task.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">依赖任务:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {task.dependencies.length > 0 ? (
                        task.dependencies.map((depId, index) => (
                          <span key={index} className="px-2 py-1 bg-secondary rounded text-xs">
                            {depId}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">无依赖</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">标签:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {task.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-secondary rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {task.updatedAt.getTime() !== task.createdAt.getTime() && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    最后更新: {new Date(task.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}