// RuleForge 规则管理页面

'use client';

import { RuleManager } from '@/components/ruleforge/RuleManager';

export default function RulesPage() {
  return (
    <div className="h-screen flex flex-col">
      <RuleManager />
    </div>
  );
}