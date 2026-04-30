import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic'; // 静态导出模式下不能使用

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userInput, files } = body;

    console.log('[NightShift Workflow] Starting workflow execution');
    console.log(`Session: ${sessionId}`);
    console.log(`Input: ${userInput}`);
    console.log(`Files: ${files?.length || 0}`);

    if (!sessionId || !userInput) {
      return new Response(JSON.stringify({ 
        error: 'sessionId and userInput are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mock workflow response
    const response = {
      success: true,
      tasks: [
        { id: '1', name: '需求分析', description: '分析用户需求并制定技术方案', status: 'completed' },
        { id: '2', name: '代码生成', description: '根据方案生成代码实现', status: 'in_progress' },
        { id: '3', name: '测试验证', description: '验证代码功能正确性', status: 'pending' },
      ],
      generatedFiles: [
        { path: 'src/components/ChatView.tsx', status: 'created' },
        { path: 'src/components/MessageList.tsx', status: 'created' },
      ],
      extractedRules: [],
      totalTime: 1500,
      errors: []
    };

    console.log('[NightShift Workflow] Workflow completed successfully');
    console.log(`Tasks generated: ${response.tasks.length}`);
    console.log(`Files generated: ${response.generatedFiles.length}`);
    console.log(`Total time: ${response.totalTime}ms`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[NightShift Workflow] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    const errorResponse = {
      success: false,
      tasks: [],
      generatedFiles: [],
      extractedRules: [],
      totalTime: 0,
      errors: [errorMessage]
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}