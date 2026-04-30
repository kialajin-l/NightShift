'use client';

import { Image, Search, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface GalleryItem {
  id: string;
  name: string;
  type: 'template' | 'snippet' | 'component';
  thumbnail: string;
  description: string;
  tags: string[];
}

const defaultGallery: GalleryItem[] = [
  { id: '1', name: 'React 登录页面', type: 'template', thumbnail: '', description: '完整的用户登录界面模板', tags: ['React', 'UI'] },
  { id: '2', name: 'API 路由模板', type: 'snippet', thumbnail: '', description: 'Next.js API路由标准模板', tags: ['Next.js', 'API'] },
  { id: '3', name: '数据表格组件', type: 'component', thumbnail: '', description: '可排序、可筛选的数据表格', tags: ['React', '组件'] },
  { id: '4', name: '用户管理系统', type: 'template', thumbnail: '', description: '完整的用户管理后台模板', tags: ['全栈', '管理'] },
  { id: '5', name: '图表组件库', type: 'component', thumbnail: '', description: '常用数据可视化组件', tags: ['图表', 'UI'] },
  { id: '6', name: '认证中间件', type: 'snippet', thumbnail: '', description: 'JWT认证中间件实现', tags: ['安全', '中间件'] },
];

export function GalleryPanel() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Image size={16} className="text-primary" />
          <span className="text-sm font-semibold">素材库</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', viewMode === 'grid' && 'bg-accent')}
            onClick={() => setViewMode('grid')}
          >
            <Grid size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', viewMode === 'list' && 'bg-accent')}
            onClick={() => setViewMode('list')}
          >
            <List size={14} />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="border-b px-4 py-2">
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索素材..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Gallery content */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {defaultGallery.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <div className="mb-3 flex h-20 items-center justify-center rounded bg-muted">
                  <Image size={24} className="text-muted-foreground/50" />
                </div>
                <h4 className="text-sm font-medium">{item.name}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {defaultGallery.map((item) => (
              <div
                key={item.id}
                className="group flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <Image size={16} className="text-muted-foreground/50" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <div className="flex gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
