// NightShift Agent 状态面板组件

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, Pause, RotateCcw, X, BarChart3, Filter, Download, Upload, 
  Cpu, Monitor, Server, TestTube, Palette, Zap, Clock, AlertCircle,
  CheckCircle, Circle, Activity, Database, Network, CpuIcon
} from 'lucide-react';

interface AgentStatus {
  id: string;
  name: string;
  role: 'scheduler' | 'frontend' | 'backend' | 'tester' | 'design' | 'devops';
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentTask: string | null;
  progress: number;
  model: string;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  startTime: Date | null;
  estimatedCompletion: Date | null;
  performance: {
    responseTime: number; // 毫秒
    successRate: number; // 0-100
    errorCount: number;
  };
  resources: {
    cpu: number; // 0-100
    memory: number; // MB
    network: number; // KB/s
  };
}

interface AgentStatusPanelProps {
  agents: AgentStatus[];
  onAgentSelect: (agent: AgentStatus) => void;
  onAgentStop: (agentId: string) => void;
  onAgentRestart: (agentId: string) => void;
  onAgentConfigure: (agentId: string) => void;
}

export function AgentStatusPanel({
  agents,
  onAgentSelect,
  onAgentStop,
  onAgentRestart,
  onAgentConfigure
}: AgentStatusPanelProps) {
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('role');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 计算总体统计
  const agentStats = {
    total: agents.length,
    running: agents.filter(a => a.status === 'running').length,
    idle: agents.filter(a => a.status === 'idle').length,
    completed: agents.filter(a => a.status === 'completed').length,
    failed: agents.filter(a => a.status === 'failed').length
  };

  // 计算性能指标
  const performanceStats = {
    avgResponseTime: agents.length > 0 
      ? Math.round(agents.reduce((sum, agent) => sum + agent.performance.responseTime, 0) / agents.length)
      : 0,
    avgSuccessRate: agents.length > 0 
      ? Math.round(agents.reduce((sum, agent) => sum + agent.performance.successRate, 0) / agents.length)
      : 0,
    totalErrors: agents.reduce((sum, agent) => sum + agent.performance.errorCount, 0)
  };

  // 获取角色图标
  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ReactNode> = {
      'scheduler': <Cpu size={20} className="text-purple-500" />,
      'frontend': <Monitor size={20} className="text-blue-500" />,
      'backend': <Server size={20} className="text-green-500" />,
      'tester': <TestTube size={20} className="text-orange-500" />,
      'design': <Palette size={20} className="text-pink-500" />,
      'devops': <Database size={20} className="text-indigo-500" />
    };
    return icons[role] || <CpuIcon size={20} className="text-gray-500" />;
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      'idle': <Circle size={16} className="text-gray-500" />,
      'running': <Activity size={16} className="text-blue-500 animate-pulse" />,
      'completed': <CheckCircle size={16} className="text-green-500" />,
      'failed': <AlertCircle size={16} className="text-red-500" />
    };
    return icons[status] || <Circle size={16} className="text-gray-500" />;
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'idle': 'bg-gray-100 text-gray-800 border-gray-200',
      'running': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'failed': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 获取角色颜色
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'scheduler': 'bg-purple-100 text-purple-800 border-purple-200',
      'frontend': 'bg-blue-100 text-blue-800 border-blue-200',
      'backend': 'bg-green-100 text-green-800 border-green-200',
      'tester': 'bg-orange-100 text-orange-800 border-orange-200',
      'design': 'bg-pink-100 text-pink-800 border-pink-200',
      'devops': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 格式化时间
  const formatTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString();
  };

  // 格式化持续时间
  const formatDuration = (startTime: Date | null) => {
    if (!startTime) return 'N/A';
    const duration = Date.now() - startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // 过滤和排序 Agent
  const filteredAndSortedAgents = agents
    .filter(agent => {
      if (filterRole !== 'all' && agent.role !== filterRole) return false;
      if (filterStatus !== 'all' && agent.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'role':
          const roleOrder = { 
            scheduler: 0, frontend: 1, backend: 2, tester: 3, design: 4, devops: 5 
          };
          return roleOrder[a.role] - roleOrder[b.role];
        case 'status':
          const statusOrder = { running: 0, idle: 1, completed: 2, failed: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'performance':
          return b.performance.successRate - a.performance.successRate;
        default:
          return 0;
      }
    });

  // 获取唯一的角色和状态列表
  const roleList = [...new Set(agents.map(a => a.role))];
  const statusList = [...new Set(agents.map(a => a.status))];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Agent 状态面板</h1>
            <p className="text-sm text-muted-foreground">多 Agent 系统实时监控</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <Pause size={16} /> : <Activity size={16} />}
              <span className="ml-2">{autoRefresh ? '暂停刷新' : '自动刷新'}</span>
            </Button>
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              导出报告
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{agentStats.total}</div>
            <div className="text-sm text-blue-600">总 Agent 数</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{agentStats.running}</div>
            <div className="text-sm text-green-600">运行中</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{agentStats.idle}</div>
            <div className="text-sm text-yellow-600">空闲</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{agentStats.failed}</div>
            <div className="text-sm text-red-600">失败</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{performanceStats.avgResponseTime}ms</div>
            <div className="text-sm text-purple-600">平均响应</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{performanceStats.avgSuccessRate}%</div>
            <div className="text-sm text-orange-600">成功率</div>
          </div>
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
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">所有角色</option>
            {roleList.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="role">按角色排序</option>
            <option value="status">按状态排序</option>
            <option value="performance">按性能排序</option>
          </select>

          <div className="text-sm text-muted-foreground">
            显示 {filteredAndSortedAgents.length} / {agents.length} 个 Agent
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredAndSortedAgents.length === 0 ? (
          <div className="text-center py-12">
            <Cpu size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无 Agent</h3>
            <p className="text-muted-foreground">Agent 启动后将显示在这里</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedAgents.map((agent) => (
              <div 
                key={agent.id}
                className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onAgentSelect(agent)}
              >
                {/* Agent Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(agent.role)}
                    <div>
                      <h4 className="font-medium">{agent.name}</h4>
                      <p className="text-xs text-muted-foreground">{agent.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(agent.status)}
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="mb-3">
                  <Badge className={getRoleColor(agent.role)}>
                    {agent.role}
                  </Badge>
                </div>

                {/* Current Task */}
                {agent.currentTask && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={14} className="text-blue-500" />
                      <span className="text-sm font-medium">当前任务</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {agent.currentTask}
                    </p>
                  </div>
                )}

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">进度</span>
                    <span className="text-xs text-muted-foreground">{agent.progress}%</span>
                  </div>
                  <Progress value={agent.progress} className="h-1" />
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-purple-500" />
                    <span>{agent.performance.responseTime}ms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle size={12} className="text-green-500" />
                    <span>{agent.performance.successRate}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle size={12} className="text-red-500" />
                    <span>{agent.performance.errorCount} 错误</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Network size={12} className="text-blue-500" />
                    <span>{agent.resources.network} KB/s</span>
                  </div>
                </div>

                {/* Resource Usage */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">CPU: {agent.resources.cpu}%</span>
                    <span className="text-xs text-muted-foreground">内存: {agent.resources.memory}MB</span>
                  </div>
                  <Progress value={agent.resources.cpu} className="h-1" />
                </div>

                {/* Token Usage */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">Token 使用</span>
                    <span className="text-xs text-muted-foreground">{agent.tokenUsage.total}</span>
                  </div>
                  <div className="flex gap-1">
                    <div 
                      className="h-1 bg-blue-500 rounded" 
                      style={{ width: `${(agent.tokenUsage.input / agent.tokenUsage.total) * 100}%` }}
                      title={`输入: ${agent.tokenUsage.input}`}
                    />
                    <div 
                      className="h-1 bg-green-500 rounded" 
                      style={{ width: `${(agent.tokenUsage.output / agent.tokenUsage.total) * 100}%` }}
                      title={`输出: ${agent.tokenUsage.output}`}
                    />
                  </div>
                </div>

                {/* Time Information */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <div>启动时间</div>
                    <div>{formatTime(agent.startTime)}</div>
                  </div>
                  <div>
                    <div>运行时长</div>
                    <div>{formatDuration(agent.startTime)}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  {agent.status === 'running' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAgentStop(agent.id);
                      }}
                    >
                      <Pause size={14} />
                    </Button>
                  )}
                  
                  {agent.status === 'failed' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAgentRestart(agent.id);
                      }}
                    >
                      <RotateCcw size={14} />
                    </Button>
                  )}

                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAgentConfigure(agent.id);
                    }}
                  >
                    配置
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}