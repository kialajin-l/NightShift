'use client';

import { Radio, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BridgeItem {
  id: string;
  name: string;
  type: 'ssh' | 'http' | 'websocket' | 'database';
  status: 'connected' | 'disconnected';
  host: string;
  description: string;
}

const defaultBridges: BridgeItem[] = [
  { id: '1', name: '开发服务器', type: 'ssh', status: 'connected', host: '192.168.1.100', description: '远程开发环境' },
  { id: '2', name: 'API 网关', type: 'http', status: 'connected', host: 'api.example.com', description: '后端API服务' },
  { id: '3', name: '实时通知', type: 'websocket', status: 'disconnected', host: 'ws.example.com', description: 'WebSocket通知服务' },
  { id: '4', name: 'PostgreSQL', type: 'database', status: 'connected', host: 'db.example.com:5432', description: '主数据库' },
];

export function BridgePanel() {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-primary" />
          <span className="text-sm font-semibold">远程桥接</span>
        </div>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Plus size={12} />
          添加桥接
        </Button>
      </div>

      {/* Search */}
      <div className="border-b px-4 py-2">
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索桥接..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Bridge list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {defaultBridges.map((bridge) => (
            <div
              key={bridge.id}
              className={cn(
                'rounded-lg border p-4 transition-colors',
                bridge.status === 'connected' ? 'bg-card hover:bg-accent/50' : 'bg-muted/30'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">{bridge.name}</h4>
                    <span className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
                      bridge.type === 'ssh' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                      bridge.type === 'http' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                      bridge.type === 'websocket' && 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
                      bridge.type === 'database' && 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                    )}>
                      {bridge.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{bridge.description}</p>
                  <code className="mt-1 block text-xs font-mono text-muted-foreground">{bridge.host}</code>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    bridge.status === 'connected' ? 'bg-status-success' : 'bg-muted'
                  )} />
                  <span className={cn(
                    'text-xs',
                    bridge.status === 'connected' ? 'text-status-success' : 'text-muted-foreground'
                  )}>
                    {bridge.status === 'connected' ? '已连接' : '未连接'}
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
