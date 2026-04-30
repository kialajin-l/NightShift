// NightShift 任务管理页面

'use client';

import { TaskManager } from '@/components/scheduler/TaskManager';

export default function TasksPage() {
  return (
    <div className="h-screen flex flex-col">
      <TaskManager />
    </div>
  );
}