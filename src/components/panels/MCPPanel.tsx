'use client';

import { Plug, Plus, Search, Globe, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MCPItem {
  id: string;
  name: string;
  type: 'local' | 'remote';
  status: 'connected' | 'disconnected' | 'error';
  description: string;
}

const defaultMCPs: MCPItem[] = [
  { id: '1', name: '文件系统', type: 'local', status: 'connected', description: '本地文件系统访问' },
  { id: '2', name: 'GitHub', type: 'remote', status: 'connected', description: 'GitHub API集成' },
  { id: '3', name: '数据库', type: 'local', status: 'disconnected', description: '数据库连接管理' },
  { id: '4', name: '浏览器', type: 'local', status: 'error', description: '浏览器自动化' },
];

export function MCPPanel() {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Plug size={16} className="text-primary" />
          <span className="text-sm font-semibold">MCP 服务</span>
        </div>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Plus size={12} />
          添加服务
        </Button>
      </div>

      {/* Search */}
      <div className="border-b px-4 py-2">
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索MCP服务..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* MCP list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {defaultMCPs.map((mcp) => (
            <div
              key={mcp.id}
              className={cn(
                'rounded-lg border p-4 transition-colors',
                mcp.status === 'connected' ? 'bg-card hover:bg-accent/50' : 'bg-muted/30'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {mcp.type === 'local' ? (
                    <Folder size={16} className="text-muted-foreground" />
                  ) : (
                    <Globe size={16} className="text-muted-foreground" />
                  )}
                  <div>
                    <h4 className="text-sm font-medium">{mcp.name}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">{mcp.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    mcp.status === 'connected' && 'bg-status-success',
                    mcp.status === 'disconnected' && 'bg-muted',
                    mcp.status === 'error' && 'bg-status-error'
                  )} />
                  <span className={cn(
                    'text-xs',
                    mcp.status === 'connected' && 'text-status-success',
                    mcp.status === 'disconnected' && 'text-muted-foreground',
                    mcp.status === 'error' && 'text-status-error'
                  )}>
                    {mcp.status === 'connected' ? '已连接' : mcp.status === 'disconnected' ? '未连接' : '错误'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
