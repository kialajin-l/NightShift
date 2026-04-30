'use client';

import { Sparkles, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SkillItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const defaultSkills: SkillItem[] = [
  { id: '1', name: '代码生成', description: '根据需求自动生成代码', enabled: true },
  { id: '2', name: '代码审查', description: '自动检查代码质量和规范', enabled: true },
  { id: '3', name: '单元测试', description: '自动生成单元测试用例', enabled: false },
  { id: '4', name: '文档生成', description: '自动生成代码文档', enabled: true },
  { id: '5', name: '性能优化', description: '分析并优化代码性能', enabled: false },
];

export function SkillsPanel() {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="text-sm font-semibold">Skills</span>
        </div>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Plus size={12} />
          添加技能
        </Button>
      </div>

      {/* Search */}
      <div className="border-b px-4 py-2">
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索技能..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Skills list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {defaultSkills.map((skill) => (
            <div
              key={skill.id}
              className={cn(
                'rounded-lg border p-4 transition-colors',
                skill.enabled ? 'bg-card hover:bg-accent/50' : 'bg-muted/30 opacity-60'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">{skill.name}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{skill.description}</p>
                </div>
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  skill.enabled ? 'bg-status-success' : 'bg-muted'
                )} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
