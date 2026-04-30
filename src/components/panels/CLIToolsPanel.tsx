'use client';

import { Terminal, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CLITool {
  id: string;
  name: string;
  command: string;
  description: string;
  category: string;
}

const defaultTools: CLITool[] = [
  { id: '1', name: 'Git 提交', command: 'git commit -m', description: '快速提交代码变更', category: '版本控制' },
  { id: '2', name: 'NPM 安装', command: 'npm install', description: '安装项目依赖', category: '包管理' },
  { id: '3', name: '构建项目', command: 'npm run build', description: '构建生产版本', category: '构建' },
  { id: '4', name: '运行测试', command: 'npm test', description: '运行单元测试', category: '测试' },
  { id: '5', name: '代码格式化', command: 'npm run lint -- --fix', description: '自动修复代码格式', category: '代码质量' },
  { id: '6', name: '类型检查', command: 'npm run typecheck', description: 'TypeScript类型检查', category: '代码质量' },
];

export function CLIToolsPanel() {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-primary" />
          <span className="text-sm font-semibold">CLI 工具</span>
        </div>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Plus size={12} />
          添加工具
        </Button>
      </div>

      {/* Search */}
      <div className="border-b px-4 py-2">
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索工具..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Tools list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {['版本控制', '包管理', '构建', '测试', '代码质量'].map((category) => {
            const tools = defaultTools.filter((t) => t.category === category);
            if (tools.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{category}</h3>
                <div className="space-y-2">
                  {tools.map((tool) => (
                    <div
                      key={tool.id}
                      className="group rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">{tool.name}</h4>
                          <p className="mt-0.5 text-xs text-muted-foreground">{tool.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          运行
                        </Button>
                      </div>
                      <code className="mt-2 block rounded bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
                        {tool.command}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
