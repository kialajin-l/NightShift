/**
 * 增强的TaskPlanPanel - 集成任务管理、规则提取和知识链功能
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import { Task, TaskOutput } from '../../packages/agents/src/types/agent';
import { MemoryStore } from '../../lib/memory-store';
import { TaskRuleBridge } from '../../lib/task-rule-bridge';
// import { RuleExtractor } from '../../packages/ruleforge/src/rule-extractor';
// import { YAMLValidator } from '../../packages/ruleforge/src/yaml-validator';

type Task = any;
type TaskOutput = any;
const RuleExtractor = class { constructor() {} };
const YAMLValidator = class { constructor() {} };

interface TaskPlanPanelProps {
  tasks?: Task[];
  onTaskSelect?: (task: Task) => void;
  onTaskUpdate?: (task: Task) => void;
  onRuleExtraction?: (rules: any[]) => void;
  className?: string;
}

interface PanelState {
  activeTab: 'tasks' | 'rules' | 'knowledge' | 'analytics';
  selectedTask?: Task;
  searchQuery: string;
  filterStatus: 'all' | 'pending' | 'in_progress' | 'completed' | 'failed';
  viewMode: 'list' | 'grid' | 'timeline';
}

interface AnalyticsData {
  taskStats: {
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    pending: number;
  };
  ruleStats: {
    total: number;
    valid: number;
    invalid: number;
    avgConfidence: number;
  };
  knowledgeStats: {
    totalMemories: number;
    memoryTypes: Record<string, number>;
    graphSize: number;
  };
}

export const TaskPlanPanel: React.FC<TaskPlanPanelProps> = ({
  tasks = [],
  onTaskSelect,
  onTaskUpdate,
  onRuleExtraction,
  className = ''
}) => {
  const [state, setState] = useState<PanelState>({
    activeTab: 'tasks',
    searchQuery: '',
    filterStatus: 'all',
    viewMode: 'list'
  });

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    taskStats: { total: 0, completed: 0, failed: 0, inProgress: 0, pending: 0 },
    ruleStats: { total: 0, valid: 0, invalid: 0, avgConfidence: 0 },
    knowledgeStats: { totalMemories: 0, memoryTypes: {}, graphSize: 0 }
  });

  const [memoryStore] = useState(() => new MemoryStore());
  const [taskRuleBridge] = useState(() => new TaskRuleBridge());
  const [ruleExtractor] = useState(() => new RuleExtractor());
  const [yamlValidator] = useState(() => new YAMLValidator());

  // 初始化数据
  useEffect(() => {
    loadAnalyticsData();
    setupEventListeners();
  }, []);

  // 更新任务统计
  useEffect(() => {
    updateTaskStats();
  }, [tasks]);

  /**
   * 设置事件监听器
   */
  const setupEventListeners = useCallback(() => {
    // 监听任务完成事件
    const handleTaskCompleted = (event: CustomEvent) => {
      console.log('任务完成:', event.detail);
      updateTaskStats();
      
      // 自动触发规则提取
      if (state.activeTab === 'rules') {
        extractRulesFromCompletedTask(event.detail);
      }
    };

    // 监听规则提取事件
    const handleRuleExtracted = (event: CustomEvent) => {
      console.log('规则提取完成:', event.detail);
      updateRuleStats();
      
      if (onRuleExtraction) {
        onRuleExtraction(event.detail.rules);
      }
    };

    // 注册事件监听器
    window.addEventListener('task-completed', handleTaskCompleted as EventListener);
    window.addEventListener('rule-extracted', handleRuleExtracted as EventListener);

    return () => {
      window.removeEventListener('task-completed', handleTaskCompleted as EventListener);
      window.removeEventListener('rule-extracted', handleRuleExtracted as EventListener);
    };
  }, [state.activeTab, onRuleExtraction]);

  /**
   * 加载分析数据
   */
  const loadAnalyticsData = async () => {
    updateTaskStats();
    updateRuleStats();
    updateKnowledgeStats();
  };

  /**
   * 更新任务统计
   */
  const updateTaskStats = () => {
    const taskStats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      pending: tasks.filter(t => t.status === 'pending').length
    };

    setAnalytics(prev => ({
      ...prev,
      taskStats
    }));
  };

  /**
   * 更新规则统计
   */
  const updateRuleStats = async () => {
    // 这里应该从RuleExtractor获取实际数据
    const ruleStats = {
      total: 0,
      valid: 0,
      invalid: 0,
      avgConfidence: 0
    };

    setAnalytics(prev => ({
      ...prev,
      ruleStats
    }));
  };

  /**
   * 更新知识统计
   */
  const updateKnowledgeStats = async () => {
    const stats = memoryStore.getStatistics();
    
    setAnalytics(prev => ({
      ...prev,
      knowledgeStats: {
        totalMemories: stats.totalMemories,
        memoryTypes: stats.memoryTypes,
        graphSize: stats.knowledgeGraphSize
      }
    }));
  };

  /**
   * 从完成的任务中提取规则
   */
  const extractRulesFromCompletedTask = async (taskData: any) => {
    try {
      const result = await taskRuleBridge.manualExtract([taskData.task], [taskData.output]);
      console.log('规则提取结果:', result);
    } catch (error) {
      console.error('规则提取失败:', error);
    }
  };

  /**
   * 处理任务选择
   */
  const handleTaskSelect = (task: Task) => {
    setState(prev => ({ ...prev, selectedTask: task }));
    
    if (onTaskSelect) {
      onTaskSelect(task);
    }
  };

  /**
   * 处理任务状态更新
   */
  const handleTaskStatusUpdate = (task: Task, newStatus: Task['status']) => {
    const updatedTask = { ...task, status: newStatus };
    
    if (onTaskUpdate) {
      onTaskUpdate(updatedTask);
    }
  };

  /**
   * 手动触发规则提取
   */
  const handleManualRuleExtraction = async () => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    if (completedTasks.length === 0) {
      alert('没有已完成的任务可用于规则提取');
      return;
    }

    try {
      // 这里应该获取实际的输出数据
      const result = await taskRuleBridge.manualExtract(completedTasks, []);
      console.log('手动规则提取结果:', result);
      
      // 触发规则提取事件
      window.dispatchEvent(new CustomEvent('rule-extracted', {
        detail: result
      }));
    } catch (error) {
      console.error('手动规则提取失败:', error);
      alert('规则提取失败，请查看控制台获取详细信息');
    }
  };

  /**
   * 构建知识链
   */
  const handleBuildKnowledgeChain = async () => {
    if (!state.selectedTask) {
      alert('请先选择一个任务');
      return;
    }

    try {
      const chain = await memoryStore.buildKnowledgeChain(state.selectedTask.name);
      console.log('知识链:', chain);
      
      // 显示知识链结果
      alert(`构建了包含 ${chain.length} 个相关记忆的知识链`);
    } catch (error) {
      console.error('知识链构建失败:', error);
      alert('知识链构建失败');
    }
  };

  /**
   * 过滤任务
   */
  const filteredTasks = tasks.filter(task => {
    // 状态过滤
    if (state.filterStatus !== 'all' && task.status !== state.filterStatus) {
      return false;
    }
    
    // 搜索过滤
    if (state.searchQuery && !task.name.toLowerCase().includes(state.searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  /**
   * 渲染任务列表
   */
  const renderTaskList = () => (
    <div className="task-list">
      <div className="task-list-header">
        <h3>任务列表 ({filteredTasks.length})</h3>
        <div className="task-controls">
          <input
            type="text"
            placeholder="搜索任务..."
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="search-input"
          />
          <select
            value={state.filterStatus}
            onChange={(e) => setState(prev => ({ ...prev, filterStatus: e.target.value as any }))}
            className="filter-select"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
          </select>
        </div>
      </div>
      
      <div className="tasks">
        {filteredTasks.map(task => (
          <div
            key={task.id}
            className={`task-item ${task.status} ${state.selectedTask?.id === task.id ? 'selected' : ''}`}
            onClick={() => handleTaskSelect(task)}
          >
            <div className="task-header">
              <span className="task-name">{task.name}</span>
              <span className={`task-status ${task.status}`}>
                {getStatusText(task.status)}
              </span>
            </div>
            <div className="task-details">
              <span className="task-type">{task.type}</span>
              <span className="task-priority">优先级: {task.priority}</span>
            </div>
            {task.description && (
              <div className="task-description">{task.description}</div>
            )}
            <div className="task-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTaskStatusUpdate(task, 'in_progress');
                }}
                disabled={task.status !== 'pending'}
              >
                开始
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTaskStatusUpdate(task, 'completed');
                }}
                disabled={task.status !== 'in_progress'}
              >
                完成
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /**
   * 渲染规则面板
   */
  const renderRulesPanel = () => (
    <div className="rules-panel">
      <div className="panel-header">
        <h3>规则管理</h3>
        <div className="panel-actions">
          <button onClick={handleManualRuleExtraction} className="primary">
            提取规则
          </button>
          <button onClick={updateRuleStats} className="secondary">
            刷新统计
          </button>
        </div>
      </div>
      
      <div className="rules-stats">
        <div className="stat-item">
          <span className="stat-value">{analytics.ruleStats.total}</span>
          <span className="stat-label">总规则数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{analytics.ruleStats.valid}</span>
          <span className="stat-label">有效规则</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{analytics.ruleStats.avgConfidence.toFixed(2)}</span>
          <span className="stat-label">平均置信度</span>
        </div>
      </div>
      
      <div className="rules-content">
        <p>规则提取功能已集成，系统会自动从完成的任务中提取开发规则。</p>
        <p>点击"提取规则"按钮可以手动触发规则提取过程。</p>
      </div>
    </div>
  );

  /**
   * 渲染知识面板
   */
  const renderKnowledgePanel = () => (
    <div className="knowledge-panel">
      <div className="panel-header">
        <h3>知识链管理</h3>
        <div className="panel-actions">
          <button onClick={handleBuildKnowledgeChain} className="primary">
            构建知识链
          </button>
          <button onClick={updateKnowledgeStats} className="secondary">
            刷新统计
          </button>
        </div>
      </div>
      
      <div className="knowledge-stats">
        <div className="stat-item">
          <span className="stat-value">{analytics.knowledgeStats.totalMemories}</span>
          <span className="stat-label">总记忆数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{analytics.knowledgeStats.graphSize}</span>
          <span className="stat-label">知识图谱节点</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{Object.keys(analytics.knowledgeStats.memoryTypes).length}</span>
          <span className="stat-label">记忆类型</span>
        </div>
      </div>
      
      <div className="knowledge-content">
        <p>知识链功能已集成，系统会自动记录任务执行过程中的经验和模式。</p>
        <p>选择任务后点击"构建知识链"可以查看相关的知识网络。</p>
      </div>
    </div>
  );

  /**
   * 渲染分析面板
   */
  const renderAnalyticsPanel = () => (
    <div className="analytics-panel">
      <div className="panel-header">
        <h3>系统分析</h3>
        <button onClick={loadAnalyticsData} className="secondary">
          刷新数据
        </button>
      </div>
      
      <div className="analytics-grid">
        <div className="analytics-section">
          <h4>任务统计</h4>
          <div className="stats">
            <div className="stat">
              <span>总任务数: {analytics.taskStats.total}</span>
            </div>
            <div className="stat">
              <span>已完成: {analytics.taskStats.completed}</span>
            </div>
            <div className="stat">
              <span>进行中: {analytics.taskStats.inProgress}</span>
            </div>
            <div className="stat">
              <span>失败: {analytics.taskStats.failed}</span>
            </div>
            <div className="stat">
              <span>待处理: {analytics.taskStats.pending}</span>
            </div>
          </div>
        </div>
        
        <div className="analytics-section">
          <h4>规则统计</h4>
          <div className="stats">
            <div className="stat">
              <span>总规则数: {analytics.ruleStats.total}</span>
            </div>
            <div className="stat">
              <span>有效规则: {analytics.ruleStats.valid}</span>
            </div>
            <div className="stat">
              <span>平均置信度: {analytics.ruleStats.avgConfidence.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="analytics-section">
          <h4>知识统计</h4>
          <div className="stats">
            <div className="stat">
              <span>总记忆数: {analytics.knowledgeStats.totalMemories}</span>
            </div>
            <div className="stat">
              <span>知识图谱节点: {analytics.knowledgeStats.graphSize}</span>
            </div>
            <div className="stat">
              <span>记忆类型: {Object.keys(analytics.knowledgeStats.memoryTypes).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * 获取状态文本
   */
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成',
      failed: '失败'
    };
    return statusMap[status] || status;
  };

  return (
    <div className={`task-plan-panel ${className}`}>
      <div className="panel-tabs">
        <button
          className={state.activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'tasks' }))}
        >
          任务管理
        </button>
        <button
          className={state.activeTab === 'rules' ? 'active' : ''}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'rules' }))}
        >
          规则提取
        </button>
        <button
          className={state.activeTab === 'knowledge' ? 'active' : ''}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'knowledge' }))}
        >
          知识链
        </button>
        <button
          className={state.activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'analytics' }))}
        >
          系统分析
        </button>
      </div>
      
      <div className="panel-content">
        {state.activeTab === 'tasks' && renderTaskList()}
        {state.activeTab === 'rules' && renderRulesPanel()}
        {state.activeTab === 'knowledge' && renderKnowledgePanel()}
        {state.activeTab === 'analytics' && renderAnalyticsPanel()}
      </div>
    </div>
  );
};

export default TaskPlanPanel;

// 样式组件（实际项目中应该使用CSS模块或styled-components）
const styles = `
.task-plan-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.panel-tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
}

.panel-tabs button {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.2s;
}

.panel-tabs button.active {
  background: #007acc;
  color: white;
}

.panel-tabs button:hover:not(.active) {
  background: #f0f0f0;
}

.panel-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.task-list-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 16px;
}

.task-controls {
  display: flex;
  gap: 8px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.tasks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  border-color: #007acc;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.task-item.selected {
  border-color: #007acc;
  background: #f0f8ff;
}

.task-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 8px;
}

.task-name {
  font-weight: 600;
  font-size: 14px;
}

.task-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.task-status.pending { background: #fff3cd; color: #856404; }
.task-status.in_progress { background: #d1ecf1; color: #0c5460; }
.task-status.completed { background: #d4edda; color: #155724; }
.task-status.failed { background: #f8d7da; color: #721c24; }

.task-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.task-description {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.task-actions {
  display: flex;
  gap: 4px;
}

.task-actions button {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  background: white;
  cursor: pointer;
  font-size: 11px;
}

.task-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.panel-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

button.primary {
  background: #007acc;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button.secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.rules-stats, .knowledge-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #007acc;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.analytics-section {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.analytics-section h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat {
  display: flex;
  justify-content: between;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat:last-child {
  border-bottom: none;
}
`;

// 注入样式（实际项目中应该使用CSS模块）
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}