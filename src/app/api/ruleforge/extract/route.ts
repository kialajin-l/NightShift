// RuleForge 规则提取 API 路由

import { NextRequest, NextResponse } from 'next/server';
import { ruleForgeBridge } from '@/lib/ruleforge-bridge';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, action = 'extract' } = body;

    if (!sessionId && action !== 'batch') {
      return NextResponse.json({
        success: false,
        error: 'sessionId is required for single session extraction'
      }, { status: 400 });
    }

    let result;
    
    if (action === 'batch') {
      // 批量提取所有会话的规则
      result = await ruleForgeBridge.extractRulesFromAllSessions();
    } else {
      // 提取单个会话的规则
      result = await ruleForgeBridge.extractRulesFromSession(sessionId);
    }

    const response: APIResponse<any> = {
      success: true,
      data: result,
      message: action === 'batch' ? '批量规则提取完成' : '会话规则提取完成'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('RuleForge 规则提取失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '规则提取失败'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      // 获取规则统计信息
      const stats = await ruleForgeBridge.getRuleStats();
      
      const response: APIResponse<any> = {
        success: true,
        data: stats
      };
      
      return NextResponse.json(response);
    } else if (action === 'status') {
      // 获取桥接服务状态
      const status = ruleForgeBridge.getStatus();
      
      const response: APIResponse<any> = {
        success: true,
        data: status
      };
      
      return NextResponse.json(response);
    } else if (action === 'high-confidence') {
      // 获取高置信度规则
      const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.8');
      const rules = await ruleForgeBridge.getHighConfidenceRules(minConfidence);
      
      const response: APIResponse<any> = {
        success: true,
        data: rules
      };
      
      return NextResponse.json(response);
    }

    // 默认返回桥接服务状态
    const status = ruleForgeBridge.getStatus();
    
    const response: APIResponse<any> = {
      success: true,
      data: status
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('RuleForge API 请求失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'API 请求失败'
    }, { status: 500 });
  }
}