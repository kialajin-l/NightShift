// RuleForge 规则注入 API 路由

import { NextRequest, NextResponse } from 'next/server';
import { ruleInjector } from '@/lib/rule-injector';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      code, 
      language = 'typescript', 
      fileType = 'ts', 
      userIntent = '', 
      projectType = 'vue' 
    } = body;

    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'code is required'
      }, { status: 400 });
    }

    // 使用规则注入器生成优化代码
    const result = await ruleInjector.generateCode({
      language: language as any,
      fileType,
      existingCode: code,
      userIntent,
      projectType: projectType as any
    });

    const response: APIResponse<any> = {
      success: true,
      data: result,
      message: '规则注入完成'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('RuleForge 规则注入失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '规则注入失败'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'status') {
      // 获取注入器状态
      const status = ruleInjector.getStatus();
      
      const response: APIResponse<any> = {
        success: true,
        data: status
      };
      
      return NextResponse.json(response);
    } else if (action === 'reset') {
      // 重置注入器状态
      ruleInjector.reset();
      
      const response: APIResponse<any> = {
        success: true,
        message: '注入器状态已重置'
      };
      
      return NextResponse.json(response);
    }

    // 默认返回注入器状态
    const status = ruleInjector.getStatus();
    
    const response: APIResponse<any> = {
      success: true,
      data: status
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('RuleForge 注入器 API 请求失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'API 请求失败'
    }, { status: 500 });
  }
}