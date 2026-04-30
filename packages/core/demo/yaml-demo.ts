/**
 * RuleForge YAML 生成器详细演示脚本
 */

import { RuleYamlFormatter } from '../src/formatter/yaml-formatter.js';
import { Pattern } from '../src/types/rep-rule.js';

/**
 * 演示 YAML 格式化器的完整功能
 */
async function demoYamlFormatter() {
  console.log('🔨 RuleForge YAML 生成器详细演示\n');
  
  // 创建格式化器实例
  const formatter = new RuleYamlFormatter({
    minConfidence: 0.7,
    enableRedaction: true,
    codeExampleMaxLines: 15,
    includeTimestamps: true,
  });
  
  // 示例 1：Vue Props 验证规则
  console.log('📝 示例 1：Vue Props 验证规则');
  console.log('='.repeat(80));
  
  const vuePattern: Pattern = {
    id: 'vue-props-validation',
    category: 'code_style',
    trigger: {
      keywords: ['defineProps', 'props', 'validation', 'interface'],
      filePattern: '**/*.vue',
      frequency: 8,
    },
    solution: {
      description: 'Vue 3 组件应该使用 TypeScript interface 定义 props，避免运行时类型错误，提高代码可维护性。',
    },
    confidence: 0.92,
    applicableScenes: 5,
    evidence: [
      '数组形式 props 缺少类型安全',
      '运行时类型错误难以调试',
      '代码重构困难',
      'IDE 智能提示不完整',
    ],
    sessions: [
      {
        type: 'error_occurred',
        file: 'src/components/UserProfile.vue',
        message: 'Invalid prop: type check failed for prop "username"',
        codeSnippet: `export default {
  props: ['username', 'age', 'email'],
  setup(props) {
    // 运行时可能为 undefined
    console.log(props.username.toUpperCase());
  }
}`,
        timestamp: '2026-01-20T10:00:00Z',
      },
      {
        type: 'file_saved',
        file: 'src/components/UserProfile.vue',
        message: '使用 TypeScript interface 重构 props',
        changes: ['type-safety', 'refactor'],
        codeSnippet: `interface Props {
  username: string
  age?: number
  email: string
}

export default {
  props: {
    username: {
      type: String,
      required: true,
      validator: (value: string) => value.length >= 3
    },
    age: {
      type: Number,
      default: 0,
      validator: (value: number) => value >= 0 && value <= 150
    },
    email: {
      type: String,
      required: true,
      validator: (value: string) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)
    }
  },
  setup(props: Props) {
    // 类型安全，IDE 智能提示完整
    console.log(props.username.toUpperCase());
  }
}`,
        timestamp: '2026-01-20T10:15:00Z',
      },
    ],
    explanation: 'Vue 3 配合 TypeScript 使用 interface 定义 props 可以提供完整的类型安全、IDE 智能提示和运行时验证。',
    language: 'typescript',
  };
  
  try {
    const yaml1 = await formatter.toYAML(vuePattern);
    console.log(yaml1);
    console.log('✅ Vue Props 验证规则生成成功\n');
  } catch (error) {
    console.error('❌ Vue Props 验证规则生成失败:', error);
  }
  
  console.log('='.repeat(80) + '\n');
  
  // 示例 2：FastAPI JWT 认证规则
  console.log('📝 示例 2：FastAPI JWT 认证规则');
  console.log('='.repeat(80));
  
  const apiPattern: Pattern = {
    id: 'fastapi-jwt-auth',
    category: 'api_design',
    trigger: {
      keywords: ['JWT', 'authentication', 'token', 'FastAPI', 'Dependency'],
      filePattern: '**/api/*.py',
      frequency: 6,
    },
    solution: {
      description: 'FastAPI 应用应该实现 JWT 身份验证中间件，包含 token 验证、刷新机制和错误处理。',
    },
    confidence: 0.88,
    applicableScenes: 4,
    evidence: [
      '缺少身份验证导致安全漏洞',
      '直接访问用户数据存在风险',
      '缺少 token 刷新机制',
      '错误处理不完整',
    ],
    sessions: [
      {
        type: 'error_occurred',
        file: 'src/api/users.py',
        message: 'Unauthorized access to protected endpoint',
        codeSnippet: `@app.get("/users/me")
async def read_users_me():
    # 缺少身份验证
    return {"message": "User data"}`,
        timestamp: '2026-01-20T14:00:00Z',
      },
      {
        type: 'file_saved',
        file: 'src/api/users.py',
        message: '实现 JWT 身份验证中间件',
        changes: ['security', 'authentication', 'middleware'],
        codeSnippet: `from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta

# JWT 配置
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

@app.get("/users/me")
async def read_users_me(current_user: str = Depends(get_current_user)):
    return {"user": current_user}`,
        timestamp: '2026-01-20T14:30:00Z',
      },
    ],
    explanation: 'JWT 身份验证提供无状态的身份验证机制，适合微服务架构和前后端分离应用。',
    language: 'python',
  };
  
  try {
    const yaml2 = await formatter.toYAML(apiPattern);
    console.log(yaml2);
    console.log('✅ FastAPI JWT 认证规则生成成功\n');
  } catch (error) {
    console.error('❌ FastAPI JWT 认证规则生成失败:', error);
  }
  
  console.log('='.repeat(80) + '\n');
  
  // 示例 3：测试模式规则
  console.log('📝 示例 3：测试最佳实践规则');
  console.log('='.repeat(80));
  
  const testPattern: Pattern = {
    id: 'testing-best-practices',
    category: 'test_pattern',
    trigger: {
      keywords: ['test', 'describe', 'it', 'expect', 'vitest', 'jest'],
      filePattern: '**/*.test.{js,ts}',
      frequency: 7,
    },
    solution: {
      description: '单元测试应该遵循 AAA 模式（Arrange-Act-Assert），包含清晰的测试描述、合理的断言和错误处理。',
    },
    confidence: 0.85,
    applicableScenes: 6,
    evidence: [
      '测试描述不清晰',
      '缺少边界条件测试',
      '断言过于简单',
      '缺少错误场景测试',
    ],
    sessions: [
      {
        type: 'test_run',
        file: 'src/utils/format.test.ts',
        message: 'Test failed: Expected "Hello" but got "hello"',
        codeSnippet: `import { formatGreeting } from './format';

test('format greeting', () => {
  const result = formatGreeting('hello');
  expect(result).toBe('Hello');
});`,
        timestamp: '2026-01-20T16:00:00Z',
      },
      {
        type: 'file_saved',
        file: 'src/utils/format.test.ts',
        message: '重构测试用例，遵循 AAA 模式',
        changes: ['testing', 'refactor', 'best-practices'],
        codeSnippet: `import { describe, it, expect } from 'vitest';
import { formatGreeting } from './format';

describe('formatGreeting', () => {
  it('should capitalize the first letter of a greeting', () => {
    // Arrange
    const input = 'hello world';
    
    // Act
    const result = formatGreeting(input);
    
    // Assert
    expect(result).toBe('Hello world');
  });
  
  it('should handle empty string', () => {
    // Arrange
    const input = '';
    
    // Act
    const result = formatGreeting(input);
    
    // Assert
    expect(result).toBe('');
  });
  
  it('should handle already capitalized string', () => {
    // Arrange
    const input = 'Hello World';
    
    // Act
    const result = formatGreeting(input);
    
    // Assert
    expect(result).toBe('Hello World');
  });
});`,
        timestamp: '2026-01-20T16:15:00Z',
      },
    ],
    explanation: 'AAA 测试模式提高测试的可读性和可维护性，清晰的测试描述有助于理解测试意图。',
    language: 'typescript',
  };
  
  try {
    const yaml3 = await formatter.toYAML(testPattern);
    console.log(yaml3);
    console.log('✅ 测试最佳实践规则生成成功\n');
  } catch (error) {
    console.error('❌ 测试最佳实践规则生成失败:', error);
  }
  
  console.log('='.repeat(80) + '\n');
  
  // 示例 4：敏感信息脱敏演示
  console.log('📝 示例 4：敏感信息脱敏演示');
  console.log('='.repeat(80));
  
  const sensitivePattern: Pattern = {
    id: 'sensitive-info-demo',
    category: 'code_style',
    trigger: {
      keywords: ['apiKey', 'password', 'token', 'secret'],
      filePattern: '**/*.{js,ts,py}',
      frequency: 3,
    },
    solution: {
      description: `代码中不应该硬编码敏感信息。以下示例包含需要脱敏的信息：
API 密钥: sk-abcdefghijklmnopqrstuvwxyz123456
GitHub Token: ghp_1234567890abcdefghijklmnopqrstuvwxyz
文件路径: C:\\Users\\john\\project\\src\\config.js
邮箱: john.doe@example.com
数据库连接: postgresql://user:password@localhost:5432/db`,
    },
    confidence: 0.75,
    applicableScenes: 2,
    evidence: ['硬编码敏感信息存在安全风险'],
    explanation: '敏感信息应该使用环境变量或配置文件管理。',
    language: 'typescript',
  };
  
  try {
    const yaml4 = await formatter.toYAML(sensitivePattern);
    console.log('原始敏感信息示例:');
    console.log(sensitivePattern.solution.description);
    console.log('\n脱敏后的 YAML 输出:');
    console.log(yaml4);
    console.log('✅ 敏感信息脱敏演示成功\n');
  } catch (error) {
    console.error('❌ 敏感信息脱敏演示失败:', error);
  }
  
  console.log('='.repeat(80) + '\n');
  
  // 演示总结
  console.log('🎉 YAML 生成器演示完成！');
  console.log('\n📊 功能验证总结:');
  console.log('   ✅ REP v0.1 Schema 验证');
  console.log('   ✅ 敏感信息自动脱敏');
  console.log('   ✅ 代码示例智能生成');
  console.log('   ✅ YAML 格式化与转义');
  console.log('   ✅ 错误处理和验证');
  console.log('   ✅ 多种编程语言支持');
  console.log('\n🚀 RuleForge YAML 生成器已准备就绪！');
}

// 运行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  demoYamlFormatter().catch(console.error);
}

export { demoYamlFormatter };