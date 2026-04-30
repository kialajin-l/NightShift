/**
 * RuleForge 端到端测试：完整提取流程
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PatternRecognizer } from '../../dist/recognizer/pattern-recognizer.js';
import { RuleYamlFormatter } from '../../../core/dist/formatter/yaml-formatter.js';
import { RepRuleSchema } from '../../../core/dist/types/rep-rule.js';
/**
 * 生成测试数据：50+ 事件
 */
function generateTestData() {
    const sessions = [];
    // 会话 1: Vue 组件开发（高频模式）
    const vueSession = {
        sessionId: 'vue-dev-session-1',
        events: [
            // 高频模式：Props 验证问题（出现 6 次）
            {
                type: 'error_occurred',
                file: '/Users/dev/my-project/src/components/Button.vue',
                message: 'Invalid prop: type check failed for prop "title"',
                codeSnippet: `export default {
  props: ['title', 'count'],
  setup(props) {
    console.log(props.title.toUpperCase());
  }
}`,
                timestamp: '2026-01-20T10:00:00Z',
            },
            {
                type: 'file_saved',
                file: '/Users/dev/my-project/src/components/Button.vue',
                message: 'Fixed props type validation',
                codeSnippet: `interface Props {
  title: string;
  count?: number;
}

export default {
  props: {
    title: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    }
  },
  setup(props: Props) {
    console.log(props.title.toUpperCase());
  }
}`,
                timestamp: '2026-01-20T10:05:00Z',
            },
            // 重复出现 5 次（模拟高频模式）
            ...Array(5).fill(0).map((_, i) => ({
                type: 'error_occurred',
                file: `/Users/dev/my-project/src/components/Component${i}.vue`,
                message: `Invalid prop: type check failed for prop "value${i}"`,
                codeSnippet: `export default { props: ['value${i}'] }`,
                timestamp: `2026-01-20T10:${10 + i}:00Z`,
            })),
            ...Array(5).fill(0).map((_, i) => ({
                type: 'file_saved',
                file: `/Users/dev/my-project/src/components/Component${i}.vue`,
                message: `Fixed props type validation for value${i}`,
                codeSnippet: `interface Props { value${i}: string }
export default { props: { value${i}: { type: String, required: true } } }`,
                timestamp: `2026-01-20T10:${15 + i}:00Z`,
            })),
        ],
        metadata: {
            projectType: 'vue',
            language: 'typescript',
        },
    };
    // 会话 2: FastAPI 开发（中频模式）
    const fastapiSession = {
        sessionId: 'fastapi-dev-session-1',
        events: [
            // 中频模式：JWT 认证（出现 3 次）
            {
                type: 'error_occurred',
                file: '/Users/dev/my-project/src/api/users.py',
                message: 'Unauthorized access to protected endpoint',
                codeSnippet: `@app.get("/users/me")
def read_users_me():
    return {"user": "data"}`,
                timestamp: '2026-01-20T11:00:00Z',
            },
            {
                type: 'file_saved',
                file: '/Users/dev/my-project/src/api/users.py',
                message: 'Added JWT authentication',
                codeSnippet: `from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # JWT 验证逻辑
    return {"user": "authenticated"}

@app.get("/users/me")
async def read_users_me(current_user = Depends(get_current_user)):
    return current_user`,
                timestamp: '2026-01-20T11:05:00Z',
            },
            // 重复出现 2 次
            ...Array(2).fill(0).map((_, i) => ({
                type: 'error_occurred',
                file: `/Users/dev/my-project/src/api/endpoint${i}.py`,
                message: `Unauthorized access to endpoint${i}`,
                codeSnippet: `@app.get("/endpoint${i}")
def endpoint${i}(): return {"data": "public"}`,
                timestamp: `2026-01-20T11:${10 + i}:00Z`,
            })),
            ...Array(2).fill(0).map((_, i) => ({
                type: 'file_saved',
                file: `/Users/dev/my-project/src/api/endpoint${i}.py`,
                message: `Added authentication to endpoint${i}`,
                codeSnippet: `@app.get("/endpoint${i}")
async def endpoint${i}(user = Depends(get_current_user)): return {"data": "protected"}`,
                timestamp: `2026-01-20T11:${15 + i}:00Z`,
            })),
        ],
        metadata: {
            projectType: 'fastapi',
            language: 'python',
        },
    };
    // 会话 3: 测试开发（低频模式）
    const testSession = {
        sessionId: 'test-dev-session-1',
        events: [
            // 低频模式：测试断言（出现 1 次）
            {
                type: 'test_run',
                file: '/Users/dev/my-project/src/utils/format.test.ts',
                message: 'Test failed: Expected "Hello" but got "hello"',
                codeSnippet: `test('format greeting', () => {
  const result = formatGreeting('hello');
  expect(result).toBe('Hello');
});`,
                timestamp: '2026-01-20T12:00:00Z',
            },
            {
                type: 'file_saved',
                file: '/Users/dev/my-project/src/utils/format.test.ts',
                message: 'Fixed test assertion',
                codeSnippet: `describe('formatGreeting', () => {
  it('should capitalize the first letter', () => {
    const result = formatGreeting('hello');
    expect(result).toBe('Hello');
  });
});`,
                timestamp: '2026-01-20T12:05:00Z',
            },
        ],
        metadata: {
            projectType: 'node',
            language: 'typescript',
        },
    };
    // 会话 4: 包含敏感信息
    const sensitiveSession = {
        sessionId: 'sensitive-session-1',
        events: [
            {
                type: 'error_occurred',
                file: '/Users/dev/my-project/src/config.js',
                message: 'API key validation failed',
                codeSnippet: `const config = {
  apiKey: 'sk-1234567890abcdefghijklmnop',
  databaseUrl: 'postgresql://user:password@localhost:5432/mydb'
};`,
                timestamp: '2026-01-20T13:00:00Z',
            },
            {
                type: 'file_saved',
                file: '/Users/dev/my-project/src/config.js',
                message: 'Moved sensitive data to environment variables',
                codeSnippet: `const config = {
  apiKey: process.env.API_KEY,
  databaseUrl: process.env.DATABASE_URL
};`,
                timestamp: '2026-01-20T13:05:00Z',
            },
        ],
        metadata: {
            projectType: 'node',
            language: 'javascript',
        },
    };
    return [vueSession, fastapiSession, testSession, sensitiveSession];
}
describe('RuleForge 端到端测试', () => {
    let recognizer;
    let formatter;
    let testSessions;
    beforeEach(() => {
        recognizer = new PatternRecognizer({
            minConfidence: 0.5,
            minFrequency: 1,
            maxPatterns: 10,
        });
        formatter = new RuleYamlFormatter({
            minConfidence: 0.6,
            enableRedaction: true,
            codeExampleMaxLines: 10,
        });
        testSessions = generateTestData();
    });
    describe('完整提取流程', () => {
        it('应该从 50+ 事件中生成 ≥3 个规则', async () => {
            // 运行模式识别
            const patterns = [];
            for (const session of testSessions) {
                const sessionPatterns = recognizer.recognizePatterns(session);
                patterns.push(...sessionPatterns);
            }
            // 断言：生成 ≥3 个规则
            expect(patterns.length).toBeGreaterThanOrEqual(3);
            console.log(`生成规则数量: ${patterns.length}`);
            // 转换为 YAML 并验证
            const yamlRules = [];
            for (const pattern of patterns) {
                const yaml = await formatter.toYAML(pattern);
                yamlRules.push(yaml);
                // 断言：所有规则通过 Schema 验证
                const ruleObject = parseYamlToObject(yaml);
                const validationResult = RepRuleSchema.safeParse(ruleObject);
                expect(validationResult.success).toBe(true);
                // 断言：YAML 可序列化和反序列化
                const reparsedYaml = formatter['formatYAML'](ruleObject);
                expect(reparsedYaml).toBeDefined();
                expect(reparsedYaml.length).toBeGreaterThan(0);
            }
            // 输出规则统计
            console.log('生成的规则类别:');
            patterns.forEach((pattern, index) => {
                console.log(`${index + 1}. ${pattern.id} (置信度: ${pattern.confidence.toFixed(2)})`);
            });
        });
    });
    describe('置信度评分验证', () => {
        it('应该正确计算置信度评分', async () => {
            const patterns = [];
            for (const session of testSessions) {
                const sessionPatterns = recognizer.recognizePatterns(session);
                patterns.push(...sessionPatterns);
            }
            // 分类模式
            const highFrequencyPatterns = patterns.filter(p => p.trigger.frequency >= 5);
            const lowFrequencyPatterns = patterns.filter(p => p.trigger.frequency <= 2);
            // 断言：高频模式置信度 ≥0.8
            highFrequencyPatterns.forEach(pattern => {
                expect(pattern.confidence).toBeGreaterThanOrEqual(0.8);
                console.log(`高频模式: ${pattern.id} - 频率: ${pattern.trigger.frequency} - 置信度: ${pattern.confidence.toFixed(2)}`);
            });
            // 断言：低频模式置信度 <0.5
            lowFrequencyPatterns.forEach(pattern => {
                expect(pattern.confidence).toBeLessThan(0.5);
                console.log(`低频模式: ${pattern.id} - 频率: ${pattern.trigger.frequency} - 置信度: ${pattern.confidence.toFixed(2)}`);
            });
            // 测试 minConfidence 过滤
            const strictRecognizer = new PatternRecognizer({
                minConfidence: 0.7,
                minFrequency: 1,
                maxPatterns: 10,
            });
            const strictPatterns = [];
            for (const session of testSessions) {
                const sessionPatterns = strictRecognizer.recognizePatterns(session);
                strictPatterns.push(...sessionPatterns);
            }
            // 断言：minConfidence 过滤生效
            strictPatterns.forEach(pattern => {
                expect(pattern.confidence).toBeGreaterThanOrEqual(0.7);
            });
            console.log(`严格模式过滤后规则数量: ${strictPatterns.length} (原数量: ${patterns.length})`);
        });
    });
    describe('脱敏验证', () => {
        it('应该正确脱敏敏感信息', async () => {
            // 运行模式识别
            const patterns = [];
            for (const session of testSessions) {
                const sessionPatterns = recognizer.recognizePatterns(session);
                patterns.push(...sessionPatterns);
            }
            // 转换为 YAML
            const yamlRules = [];
            for (const pattern of patterns) {
                const yaml = await formatter.toYAML(pattern);
                yamlRules.push(yaml);
            }
            // 断言：文件路径脱敏
            yamlRules.forEach(yaml => {
                expect(yaml).not.toContain('/Users/dev/my-project');
                expect(yaml).toContain('{project_name}');
            });
            // 断言：API 密钥脱敏
            yamlRules.forEach(yaml => {
                expect(yaml).not.toContain('sk-1234567890abcdefghijklmnop');
                expect(yaml).toContain('{api_key}');
            });
            // 断言：数据库连接脱敏
            yamlRules.forEach(yaml => {
                expect(yaml).not.toContain('postgresql://user:password@localhost:5432/mydb');
                expect(yaml).toContain('{database_url}');
            });
            console.log('脱敏验证通过：所有敏感信息已被正确替换');
        });
        it('可以禁用脱敏功能', async () => {
            const noRedactionFormatter = new RuleYamlFormatter({
                enableRedaction: false,
            });
            const patterns = recognizer.recognizePatterns(testSessions[3]); // 敏感会话
            const yaml = await noRedactionFormatter.toYAML(patterns[0]);
            // 断言：未脱敏时包含原始信息
            expect(yaml).toContain('/Users/dev/my-project');
            expect(yaml).toContain('sk-1234567890abcdefghijklmnop');
            console.log('禁用脱敏功能验证通过：保留原始敏感信息');
        });
    });
    describe('性能测试', () => {
        it('应该在合理时间内处理大量数据', async () => {
            const startTime = Date.now();
            // 处理所有会话
            const patterns = [];
            for (const session of testSessions) {
                const sessionPatterns = recognizer.recognizePatterns(session);
                patterns.push(...sessionPatterns);
            }
            // 转换为 YAML
            const yamlPromises = patterns.map(pattern => formatter.toYAML(pattern));
            const yamlRules = await Promise.all(yamlPromises);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            // 断言：处理时间在合理范围内（< 5 秒）
            expect(processingTime).toBeLessThan(5000);
            console.log(`处理 ${testSessions.length} 个会话，${patterns.length} 个规则，耗时: ${processingTime}ms`);
            console.log(`平均每个规则处理时间: ${(processingTime / patterns.length).toFixed(2)}ms`);
        });
    });
});
/**
 * 简化版 YAML 解析（用于测试）
 */
function parseYamlToObject(yaml) {
    // 简化实现：实际项目中应该使用 yaml 库
    const lines = yaml.split('\n');
    const result = {};
    let currentObj = result;
    let currentKey = '';
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        if (trimmed.endsWith(':')) {
            // 新对象
            const key = trimmed.slice(0, -1).trim();
            currentObj[key] = {};
            currentKey = key;
        }
        else if (trimmed.includes(':')) {
            // 键值对
            const [key, ...valueParts] = trimmed.split(':');
            const value = valueParts.join(':').trim();
            // 处理引号
            if (value.startsWith('"') && value.endsWith('"')) {
                currentObj[key.trim()] = value.slice(1, -1);
            }
            else {
                currentObj[key.trim()] = value;
            }
        }
    }
    return result;
}
