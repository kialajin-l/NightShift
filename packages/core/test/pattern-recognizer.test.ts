import { describe, it, expect, beforeEach } from 'vitest';
import { PatternRecognizer } from '../src/pattern-recognizer';
import { SessionLog } from '../src/types';

// 模拟会话日志数据
const mockSessionLogs: SessionLog[] = [
  {
    id: '1',
    userInput: '帮我做个登录页面，需要邮箱和密码',
    aiResponse: '好的，我来帮你创建一个登录页面...',
    timestamp: new Date(),
    generatedFiles: [
      {
        path: 'src/components/LoginForm.tsx',
        content: 'import React from \'react\';\nexport function LoginForm() { return <div>登录表单</div>; }',
        language: 'typescript',
        size: 100
      }
    ]
  },
  {
    id: '2',
    userInput: '需要用户注册功能，包含表单验证',
    aiResponse: '我来创建用户注册功能...',
    timestamp: new Date(),
    generatedFiles: [
      {
        path: 'src/components/RegisterForm.tsx',
        content: 'import React from \'react\';\nexport function RegisterForm() { return <div>注册表单</div>; }',
        language: 'typescript',
        size: 120
      }
    ]
  },
  {
    id: '3',
    userInput: '实现登录API接口',
    aiResponse: '创建登录API...',
    timestamp: new Date(),
    generatedFiles: [
      {
        path: 'src/api/auth.ts',
        content: 'export async function login() { return { success: true }; }',
        language: 'typescript',
        size: 80
      }
    ]
  },
  {
    id: '4',
    userInput: '登录页面样式需要优化',
    aiResponse: '优化登录页面样式...',
    timestamp: new Date(),
    generatedFiles: [
      {
        path: 'src/components/LoginForm.tsx',
        content: '// 优化后的登录组件',
        language: 'typescript',
        size: 150
      }
    ],
    errors: ['样式加载失败']
  }
];

describe('PatternRecognizer', () => {
  let recognizer: PatternRecognizer;

  beforeEach(() => {
    recognizer = new PatternRecognizer();
  });

  describe('基础功能', () => {
    it('应该正确初始化', () => {
      expect(recognizer).toBeDefined();
      expect(recognizer.getSessionCount()).toBe(0);
    });

    it('应该能够添加会话日志', () => {
      recognizer.addSessionLog(mockSessionLogs[0]);
      expect(recognizer.getSessionCount()).toBe(1);
    });

    it('应该能够批量添加会话日志', () => {
      recognizer.addSessionLogs(mockSessionLogs);
      expect(recognizer.getSessionCount()).toBe(4);
    });

    it('应该能够清空会话日志', () => {
      recognizer.addSessionLogs(mockSessionLogs);
      recognizer.clearSessionLogs();
      expect(recognizer.getSessionCount()).toBe(0);
    });
  });

  describe('模式识别', () => {
    beforeEach(() => {
      recognizer.addSessionLogs(mockSessionLogs);
    });

    it('应该识别关键词模式', () => {
      const result = recognizer.recognizePatterns();
      
      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.totalSessions).toBe(4);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('应该识别文件类型模式', () => {
      const result = recognizer.recognizePatterns();
      const filePatterns = result.patterns.filter(p => p.type === 'file_type');
      
      expect(filePatterns.length).toBeGreaterThan(0);
      expect(filePatterns[0].metadata.fileType).toBe('TypeScript');
    });

    it('应该识别错误模式', () => {
      const result = recognizer.recognizePatterns();
      const errorPatterns = result.patterns.filter(p => p.type === 'error');
      
      expect(errorPatterns.length).toBeGreaterThan(0);
      expect(errorPatterns[0].metadata.errorType).toBeDefined();
    });

    it('应该生成规则候选', () => {
      const result = recognizer.recognizePatterns();
      
      expect(result.candidates.length).toBeGreaterThan(0);
      result.candidates.forEach(candidate => {
        expect(candidate.id).toBeDefined();
        expect(candidate.name).toBeDefined();
        expect(candidate.confidence).toBeGreaterThan(0);
        expect(candidate.frequency).toBeGreaterThan(0);
      });
    });

    it('应该根据置信度过滤规则', () => {
      recognizer.setMinConfidence(0.8);
      const result = recognizer.recognizePatterns();
      
      result.candidates.forEach(candidate => {
        expect(candidate.confidence).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('应该根据出现次数过滤规则', () => {
      recognizer.setMinOccurrences(2);
      const result = recognizer.recognizePatterns();
      
      result.candidates.forEach(candidate => {
        expect(candidate.frequency).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('边界情况', () => {
    it('空会话日志应该返回空结果', () => {
      const result = recognizer.recognizePatterns();
      
      expect(result.patterns).toHaveLength(0);
      expect(result.candidates).toHaveLength(0);
      expect(result.confidence).toBe(0);
      expect(result.totalSessions).toBe(0);
    });

    it('单次会话应该能够识别模式', () => {
      recognizer.addSessionLog(mockSessionLogs[0]);
      const result = recognizer.recognizePatterns();
      
      expect(result.totalSessions).toBe(1);
      expect(result.patterns.length).toBeGreaterThan(0);
    });

    it('应该处理没有生成文件的情况', () => {
      const logWithoutFiles: SessionLog = {
        id: '5',
        userInput: '简单的代码问题',
        aiResponse: '解决方案',
        timestamp: new Date()
      };
      
      recognizer.addSessionLog(logWithoutFiles);
      const result = recognizer.recognizePatterns();
      
      expect(result.patterns.length).toBeGreaterThan(0);
    });
  });

  describe('性能测试', () => {
    it('应该能够处理大量会话日志', () => {
      const largeLogs: SessionLog[] = [];
      for (let i = 0; i < 100; i++) {
        largeLogs.push({
          id: `large-${i}`,
          userInput: `用户输入 ${i}`,
          aiResponse: `AI响应 ${i}`,
          timestamp: new Date(),
          generatedFiles: [
            {
              path: `src/file${i}.ts`,
              content: `// 文件内容 ${i}`,
              language: 'typescript',
              size: 100
            }
          ]
        });
      }
      
      recognizer.addSessionLogs(largeLogs);
      
      const startTime = performance.now();
      const result = recognizer.recognizePatterns();
      const endTime = performance.now();
      
      expect(result.totalSessions).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });
  });
});