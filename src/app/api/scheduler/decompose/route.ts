// 任务调度 API 路由 - 任务分解

import { NextRequest, NextResponse } from 'next/server';
import { schedulerAgent } from '@/lib/scheduler-agent';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requirement, action = 'decompose' } = body;

    if (!requirement) {
      return NextResponse.json({
        success: false,
        error: 'requirement is required'
      }, { status: 400 });
    }

    let result;
    
    if (action === 'decompose') {
      // 分解用户需求为任务列表
      result = await schedulerAgent.decomposeRequirement(requirement);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action'
      }, { status: 400 });
    }

    const response: APIResponse<any> = {
      success: true,
      data: result,
      message: '任务分解完成'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('任务分解失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '任务分解失败'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'status') {
      // 获取调度器状态
      const status = schedulerAgent.getStatus();
      
      const response: APIResponse<any> = {
        success: true,
        data: status
      };
      
      return NextResponse.json(response);
    }

    // 默认返回调度器状态
    const status = schedulerAgent.getStatus();
    
    const response: APIResponse<any> = {
      success: true,
      data: status
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('调度器 API 请求失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'API 请求失败'
    }, { status: 500 });
  }
}