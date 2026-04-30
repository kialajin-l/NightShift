'use client';

import { useState } from 'react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeTab: 'chat' | 'files' | 'agents' | 'rules';
  onTabChange: (tab: 'chat' | 'files' | 'agents' | 'rules') => void;
}

export default function Sidebar({ isCollapsed, onToggle, activeTab, onTabChange }: SidebarProps) {
  const [projects, setProjects] = useState([
    { id: '1', name: '用户管理系统', lastModified: '2小时前' },
    { id: '2', name: '电商平台', lastModified: '1天前' },
    { id: '3', name: '博客系统', lastModified: '3天前' },
  ]);

  const navItems = [
    { id: 'chat' as const, icon: '💬', label: '聊天', count: 12 },
    { id: 'files' as const, icon: '📁', label: '文件', count: 8 },
    { id: 'agents' as const, icon: '🤖', label: '智能体', count: 4 },
    { id: 'rules' as const, icon: '📋', label: '规则', count: 15 },
  ];

  if (isCollapsed) {
    return (
      <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <span className="text-lg">≡</span>
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center py-4 space-y-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={item.label}
            >
              <span className="text-lg">{item.icon}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* 顶部标题和折叠按钮 */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">NS</span>
          </div>
          <div>
            <h1 className="font-semibold text-white">NightShift</h1>
            <p className="text-xs text-gray-400">AI原生编辑器</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
        >
          <span className="text-lg">≡</span>
        </button>
      </div>

      {/* 导航菜单 */}
      <div className="p-4 border-b border-gray-700">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-md transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
              {item.count > 0 && (
                <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* 项目列表 */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-300">最近项目</h3>
          <button className="text-blue-400 hover:text-blue-300 text-sm">
            新建
          </button>
        </div>
        
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-3 bg-gray-700 rounded-md hover:bg-gray-600 cursor-pointer transition-colors"
            >
              <div className="font-medium text-white">{project.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                修改于 {project.lastModified}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部状态 */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-400">状态</div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-400">在线</span>
          </div>
        </div>
      </div>
    </div>
  );
}