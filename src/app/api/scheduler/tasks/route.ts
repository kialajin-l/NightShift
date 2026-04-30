// 任务调度 API 路由 - 任务管理

import { NextRequest, NextResponse } from 'next/server';
import { schedulerAgent } from '@/lib/scheduler-agent';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dag, action = 'schedule' } = body;

    if (!dag && action === 'schedule') {
      return NextResponse.json({
        success: false,
        error: 'dag is required for scheduling'
      }, { status: 400 });
    }

    let result;
    
    if (action === 'schedule') {
      // 调度任务执行
      result = await schedulerAgent.scheduleTasks(dag);
    } else if (action === 'retry-failed') {
      // 重试失败的任务
      result = await schedulerAgent.retryFailedTasks();
    } else if (action === 'cancel-all') {
      // 取消所有任务
      result = await schedulerAgent.cancelAllTasks();
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action'
      }, { status: 400 });
    }

    const response: APIResponse<any> = {
      success: true,
      data: result,
      message: `任务${action === 'schedule' ? '调度' : action === 'retry-failed' ? '重试' : '取消'}完成`
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('任务调度失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '任务调度失败'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const taskId = searchParams.get('taskId');

    if (action === 'progress') {
      // 获取任务执行进度
      const progress = await schedulerAgent.getTaskProgress();
      
      const response: APIResponse<any> = {
        success: true,
        data: progress
      };
      
      return NextResponse.json(response);
    } else if (action === 'details' && taskId) {
      // 获取任务详情
      const taskDetails = await schedulerAgent.getTaskDetails(taskId);
      
      const response: APIResponse<any> = {
        success: true,
        data: taskDetails
      };
      
      return NextResponse.json(response);
    } else if (action === 'all') {
      // 获取所有任务
      const allTasks = await schedulerAgent.getAllTasks();
      
      const response: APIResponse<any> = {
        success: true,
        data: allTasks
      };
      
      return NextResponse.json(response);
    } else if (action === 'status') {
      // 获取调度器状态
      const status = await schedulerAgent.getSchedulerStatus();
      
      const response: APIResponse<any> = {
        success: true,
        data: status
      };
      
      return NextResponse.json(response);
    } else if (action === 'report') {
      // 生成执行报告
      const report = await schedulerAgent.generateExecutionReport();
      
      const response: APIResponse<any> = {
        success: true,
        data: report
      };
      
      return NextResponse.json(response);
    }

    // 默认返回所有任务
    const allTasks = await schedulerAgent.getAllTasks();
    
    const response: APIResponse<any> = {
      success: true,
      data: allTasks
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('任务管理 API 请求失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'API 请求失败'
    }, { status: 500 });
  }
}