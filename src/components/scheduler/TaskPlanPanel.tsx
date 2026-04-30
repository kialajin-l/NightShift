// NightShift 任务计划面板组件

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, Pause, RotateCcw, X, BarChart3, Filter, Download, Upload, 
  ChevronDown, ChevronRight, GripVertical, MoreVertical, Clock, 
  AlertCircle, CheckCircle, Circle
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  dependencies: string[];
  assignedAgent: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  estimatedTime?: number; // 分钟
  actualTime?: number; // 分钟
}

interface TaskPlanPanelProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
  onTaskReorder: (taskId: string, newIndex: number) => void;
  onTaskStart: (taskId: string) => void;
  onTaskStop: (taskId: string) => void;
  onTaskRetry: (taskId: string) => void;
  onTaskSkip: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}

export function TaskPlanPanel({
  tasks,
  onTaskSelect,
  onTaskReorder,
  onTaskStart,
  onTaskStop,
  onTaskRetry,
  onTaskSkip,
  onTaskDelete
}: TaskPlanPanelProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // 计算总体进度
  const overallProgress = tasks.length > 0 
    ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
    : 0;

  // 计算任务统计
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    running: tasks.filter(t => t.status === 'running').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    failed: tasks.filter(t => t.status === 'failed').length
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'running': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'failed': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 获取 Agent 颜色
  const getAgentColor = (agent: string) => {
    const colors: Record<string, string> = {
      'scheduler': 'bg-purple-100 text-purple-800 border-purple-200',
      'frontend': 'bg-blue-100 text-blue-800 border-blue-200',
      'backend': 'bg-green-100 text-green-800 border-green-200',
      'tester': 'bg-orange-100 text-orange-800 border-orange-200',
      'design': 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[agent] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      'pending': <Circle size={16} className="text-yellow-500" />,
      'running': <Play size={16} className="text-blue-500" />,
      'completed': <CheckCircle size={16} className="text-green-500" />,
      'failed': <AlertCircle size={16} className="text-red-500" />
    };
    return icons[status] || <Circle size={16} className="text-gray-500" />;
  };

  // 切换任务展开状态
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  // 处理拖拽放置
  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (draggedTaskId && draggedTaskId !== targetTaskId) {
      const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
      const targetIndex = tasks.findIndex(t => t.id === targetTaskId);
      if (draggedIndex !== -1 && targetIndex !== -1) {
        onTaskReorder(draggedTaskId, targetIndex);
      }
    }
    setDraggedTaskId(null);
  };

  // 过滤和排序任务
  const filteredAndSortedTasks = tasks
    .filter(task => {
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterAgent !== 'all' && task.assignedAgent !== filterAgent) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'status':
          const statusOrder = { running: 0, pending: 1, completed: 2, failed: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'created':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

  // 获取唯一的状态、优先级和 Agent 列表
  const statusList = [...new Set(tasks.map(t => t.status))];
  const priorityList = [...new Set(tasks.map(t => t.priority))];
  const agentList = [...new Set(tasks.map(t => t.assignedAgent))];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">任务计划面板</h1>
            <p className="text-sm text-muted-foreground">任务依赖管理和进度追踪</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              导出计划
            </Button>
            <Button variant="outline" size="sm">
              <Upload size={16} className="mr-2" />
              导入计划
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{taskStats.total}</div>
            <div className="text-sm text-blue-600">总任务数</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
            <div className="text-sm text-green-600">已完成</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{taskStats.pending}</div>
            <div className="text-sm text-yellow-600">待处理</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{taskStats.failed}</div>
            <div className="text-sm text-red-600">已失败</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{overallProgress}%</div>
            <div className="text-sm text-purple-600">总体进度</div>
          </div>
        </div>

        {/* 总体进度条 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">总体进度</span>
            <span className="text-sm text-muted-foreground">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
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
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">所有优先级</option>
            {priorityList.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
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

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="priority">按优先级排序</option>
            <option value="status">按状态排序</option>
            <option value="created">按创建时间排序</option>
          </select>

          <div className="text-sm text-muted-foreground">
            显示 {filteredAndSortedTasks.length} / {tasks.length} 个任务
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无任务</h3>
            <p className="text-muted-foreground">任务分解后，任务将显示在这里</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedTasks.map((task) => (
              <div 
                key={task.id}
                className={`border rounded-lg p-4 bg-card transition-all duration-200 ${
                  draggedTaskId === task.id ? 'opacity-50 bg-blue-50' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, task.id)}
              >
                <div className="flex items-start justify-between">
                  {/* 左侧：任务信息和操作 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <GripVertical 
                        size={16} 
                        className="text-muted-foreground cursor-move" 
                        aria-label="拖拽调整顺序"
                      />
                      
                      <button 
                        onClick={() => toggleTaskExpansion(task.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {expandedTasks.has(task.id) ? 
                          <ChevronDown size={16} /> : 
                          <ChevronRight size={16} />
                        }
                      </button>

                      {getStatusIcon(task.status)}
                      
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      
                      <Badge className={getAgentColor(task.assignedAgent)}>
                        {task.assignedAgent}
                      </Badge>

                      {task.estimatedTime && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock size={14} />
                          <span>预计: {task.estimatedTime}分钟</span>
                        </div>
                      )}
                    </div>

                    <div className="ml-6">
                      <h4 
                        className="font-medium cursor-pointer hover:text-blue-600"
                        onClick={() => onTaskSelect(task)}
                      >
                        {task.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>

                      {/* 任务进度 */}
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-muted-foreground">进度</span>
                          <span className="text-xs text-muted-foreground">{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-1" />
                      </div>

                      {/* 依赖关系 */}
                      {task.dependencies.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-muted-foreground">依赖:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {task.dependencies.map((depId, index) => (
                              <span key={index} className="px-2 py-1 bg-secondary rounded text-xs">
                                {depId}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 展开后的详细信息 */}
                      {expandedTasks.has(task.id) && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">创建时间:</span>
                              <div className="text-muted-foreground">
                                {new Date(task.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">更新时间:</span>
                              <div className="text-muted-foreground">
                                {new Date(task.updatedAt).toLocaleString()}
                              </div>
                            </div>
                            {task.actualTime && (
                              <div>
                                <span className="font-medium">实际用时:</span>
                                <div className="text-muted-foreground">
                                  {task.actualTime} 分钟
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右侧：操作按钮 */}
                  <div className="flex items-center gap-1 ml-4">
                    {task.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onTaskStart(task.id)}
                      >
                        <Play size={14} />
                      </Button>
                    )}
                    
                    {task.status === 'running' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onTaskStop(task.id)}
                      >
                        <Pause size={14} />
                      </Button>
                    )}
                    
                    {task.status === 'failed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onTaskRetry(task.id)}
                      >
                        <RotateCcw size={14} />
                      </Button>
                    )}

                    <div className="relative">
                      <Button size="sm" variant="ghost">
                        <MoreVertical size={14} />
                      </Button>
                      <div className="absolute right-0 top-full mt-1 bg-white border rounded shadow-lg z-10 opacity-0 hover:opacity-100 transition-opacity">
                        <button 
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                          onClick={() => onTaskSkip(task.id)}
                        >
                          跳过
                        </button>
                        <button 
                          className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                          onClick={() => onTaskDelete(task.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}