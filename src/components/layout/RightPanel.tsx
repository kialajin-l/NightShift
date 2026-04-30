'use client';

import { useState } from 'react';

interface RightPanelProps {
  activeTab: 'chat' | 'files' | 'agents' | 'rules';
}

export default function RightPanel({ activeTab }: RightPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-800 border-l border-gray-700 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-md hover:bg-gray-600 transition-colors mb-4"
        >
          <span className="text-lg">▶</span>
        </button>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="text-gray-400 text-sm rotate-90 whitespace-nowrap">
            {getPanelTitle(activeTab)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* 面板头部 */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-white">{getPanelTitle(activeTab)}</h3>
        <button
          onClick={() => setIsCollapsed(true)}
          className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
        >
          <span className="text-lg">◀</span>
        </button>
      </div>

      {/* 面板内容 */}
      <div className="flex-1 overflow-y-auto">
        {renderPanelContent(activeTab)}
      </div>
    </div>
  );
}

function getPanelTitle(tab: string): string {
  const titles = {
    chat: '聊天助手',
    files: '文件管理',
    agents: '智能体管理',
    rules: '规则引擎',
  };
  return titles[tab as keyof typeof titles] || '面板';
}

function renderPanelContent(activeTab: string) {
  switch (activeTab) {
    case 'files':
      return <FilesPanel />;
    case 'agents':
      return <AgentsPanel />;
    case 'rules':
      return <RulesPanel />;
    default:
      return <ChatPanel />;
  }
}

function ChatPanel() {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-white mb-2">会话统计</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">消息数量</span>
            <span className="text-white">24</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">任务完成</span>
            <span className="text-green-400">8/10</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">代码生成</span>
            <span className="text-blue-400">15 文件</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-white mb-2">快速操作</h4>
        <div className="space-y-2">
          <button className="w-full text-left p-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors">
            📋 复制会话记录
          </button>
          <button className="w-full text-left p-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors">
            💾 导出项目文件
          </button>
          <button className="w-full text-left p-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors">
            🔄 重新生成代码
          </button>
        </div>
      </div>
    </div>
  );
}

function FilesPanel() {
  const [files] = useState([
    { name: 'LoginForm.vue', type: 'vue', size: '2.1KB', modified: '2分钟前' },
    { name: 'auth.py', type: 'python', size: '3.5KB', modified: '5分钟前' },
    { name: 'user.model.ts', type: 'typescript', size: '1.2KB', modified: '10分钟前' },
    { name: 'database.sql', type: 'sql', size: '5.8KB', modified: '1小时前' },
  ]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-white">项目文件</h4>
        <button className="text-blue-400 hover:text-blue-300 text-sm">
          新建文件
        </button>
      </div>

      <div className="space-y-2">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getFileIcon(file.type)}</span>
              <div>
                <div className="text-white text-sm">{file.name}</div>
                <div className="text-gray-400 text-xs">{file.size} • {file.modified}</div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-white">···</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentsPanel() {
  const [agents] = useState([
    { name: '前端开发助手', status: 'online', tasks: 3, type: 'frontend' },
    { name: '后端API助手', status: 'online', tasks: 2, type: 'backend' },
    { name: '数据库设计助手', status: 'idle', tasks: 0, type: 'database' },
    { name: '测试验证助手', status: 'busy', tasks: 5, type: 'testing' },
  ]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-white">智能体状态</h4>
        <button className="text-blue-400 hover:text-blue-300 text-sm">
          启动所有
        </button>
      </div>

      <div className="space-y-3">
        {agents.map((agent, index) => (
          <div
            key={index}
            className="p-3 bg-gray-700 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getAgentIcon(agent.type)}</span>
                <span className="text-white text-sm font-medium">{agent.name}</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                agent.status === 'online' ? 'bg-green-500' :
                agent.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
              }`}></div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>任务: {agent.tasks}</span>
              <span className={`${
                agent.status === 'online' ? 'text-green-400' :
                agent.status === 'busy' ? 'text-yellow-400' : 'text-gray-400'
              }`}>
                {agent.status === 'online' ? '在线' :
                 agent.status === 'busy' ? '忙碌' : '空闲'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RulesPanel() {
  const [rules] = useState([
    { name: '用户登录模式', confidence: 0.87, triggers: 12, type: 'authentication' },
    { name: '表单验证规则', confidence: 0.92, triggers: 8, type: 'validation' },
    { name: 'API设计规范', confidence: 0.78, triggers: 15, type: 'api' },
    { name: '数据库优化', confidence: 0.85, triggers: 6, type: 'database' },
  ]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-white">提取的规则</h4>
        <button className="text-blue-400 hover:text-blue-300 text-sm">
          分析新规则
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div
            key={index}
            className="p-3 bg-gray-700 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">{rule.name}</span>
              <span className="text-blue-400 text-xs">
                {(rule.confidence * 100).toFixed(0)}%
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>触发: {rule.triggers} 次</span>
              <span>{getRuleTypeLabel(rule.type)}</span>
            </div>
            
            <div className="mt-2 w-full bg-gray-600 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full"
                style={{ width: `${rule.confidence * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getFileIcon(type: string): string {
  const icons: Record<string, string> = {
    vue: '🟢',
    python: '🐍',
    typescript: '🔷',
    sql: '🗃️',
    default: '📄',
  };
  return icons[type] || icons.default;
}

function getAgentIcon(type: string): string {
  const icons: Record<string, string> = {
    frontend: '🎨',
    backend: '⚙️',
    database: '🗄️',
    testing: '🧪',
    default: '🤖',
  };
  return icons[type] || icons.default;
}

function getRuleTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    authentication: '认证',
    validation: '验证',
    api: 'API',
    database: '数据库',
    default: '通用',
  };
  return labels[type] || labels.default;
}