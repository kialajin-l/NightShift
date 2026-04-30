// NightShift WebSocket API 路由

import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * 处理 WebSocket 升级请求
 * 注意：在静态导出模式下，WebSocket 不可用
 */
export async function GET(request: NextRequest) {
  // 在静态导出模式下，WebSocket 不可用
  return NextResponse.json({
    success: false,
    error: 'WebSocket is not available in static export mode',
    message: 'Please run the application in server mode for WebSocket functionality'
  }, { status: 501 });
}