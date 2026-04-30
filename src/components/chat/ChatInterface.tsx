'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'success' | 'error';
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: '你好！我是 NightShift AI助手，可以帮助你进行代码开发、任务分解和智能编程。请告诉我你想要实现什么功能？',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // 模拟 AI 响应
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateResponse(inputText),
        timestamp: new Date(),
        status: 'success',
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const generateResponse = (userInput: string): string => {
    const responses = [
      `我已经分析了你的需求"${userInput}"。让我为你制定开发计划：\n\n1. **任务分解**：将需求拆分为可执行的小任务\n2. **技术选型**：选择合适的框架和工具\n3. **代码生成**：自动生成高质量的代码\n4. **测试验证**：确保功能正确性`,      
      `针对"${userInput}"，我建议采用以下技术栈：\n- **前端**：React/Vue3 + TypeScript\n- **后端**：Node.js/FastAPI\n- **数据库**：PostgreSQL/MongoDB\n- **部署**：Docker + Vercel`,      
      `正在处理你的需求"${userInput}"...\n\n我已经识别出以下关键功能点：\n✅ 用户认证系统\n✅ 数据管理界面\n✅ API接口设计\n✅ 响应式布局\n\n开始生成代码...`,
      `基于"${userInput}"，我为你创建了一个完整的项目结构：\n\n📁 项目结构：\n├── src/\n│   ├── components/\n│   ├── pages/\n│   ├── api/\n│   └── utils/\n├── public/\n└── docs/\n\n需要我继续实现具体功能吗？`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* 聊天头部 */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">AI</span>
          </div>
          <div>
            <h2 className="font-semibold text-white">NightShift AI助手</h2>
            <p className="text-sm text-gray-400">多Agent智能编程系统</p>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-3xl rounded-lg p-4 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 rounded-lg p-4 max-w-3xl">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>NightShift 正在思考...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入你的开发需求...（例如：创建一个用户登录页面）"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <span>发送</span>
            <span>🚀</span>
          </button>
        </div>
        
        <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
          <div className="flex space-x-4">
            <button className="hover:text-gray-300 transition-colors">📁 上传文件</button>
            <button className="hover:text-gray-300 transition-colors">🔧 工具调用</button>
            <button className="hover:text-gray-300 transition-colors">⚡ 快速模板</button>
          </div>
          <div>按 Enter 发送，Shift + Enter 换行</div>
        </div>
      </div>
    </div>
  );
}