import { describe, it, expect, beforeEach } from 'vitest';
import { PatternRecognizer } from '../dist/recognizer/pattern-recognizer.js';
/**
 * 模式识别器单元测试
 */
describe('PatternRecognizer', () => {
    let recognizer;
    let sampleSession;
    beforeEach(() => {
        recognizer = new PatternRecognizer({
            minConfidence: 0.6,
            minFrequency: 1,
            maxPatterns: 5
        });
        // 创建测试会话数据
        sampleSession = {
            sessionId: 'test-session-001',
            metadata: {
                projectType: 'vue',
                language: 'typescript'
            },
            events: [
                {
                    type: 'file_saved',
                    file: 'src/components/Login.vue',
                    content: `<script setup>
const props = defineProps<{title: string}>()`,
                    timestamp: '2026-01-22T10:00:00Z'
                },
                {
                    type: 'error_occurred',
                    file: 'src/components/Login.vue',
                    message: "Prop 'title' requires a type",
                    timestamp: '2026-01-22T10:01:00Z'
                },
                {
                    type: 'file_saved',
                    file: 'src/components/Login.vue',
                    content: `interface Props { title: string }
const props = defineProps<Props>()`,
                    timestamp: '2026-01-22T10:02:00Z'
                },
                {
                    type: 'test_run',
                    file: 'src/components/Login.test.ts',
                    passed: true,
                    timestamp: '2026-01-22T10:03:00Z'
                },
                {
                    type: 'file_saved',
                    file: 'src/components/UserProfile.vue',
                    content: `<script setup>
import { PropType } from 'vue'

const props = defineProps({
  user: {
    type: Object as PropType<User>,
    required: true
  }
})`,
                    timestamp: '2026-01-22T10:04:00Z'
                },
                {
                    type: 'file_saved',
                    file: 'src/api/users.py',
                    content: `@router.post("/")
def create_user(user: UserCreate):
    return {"message": "created"}`,
                    timestamp: '2026-01-22T10:05:00Z'
                },
                {
                    type: 'file_saved',
                    file: 'src/api/users.py',
                    content: `@router.get("/{user_id}")
def get_user(user_id: int):
    return {"user": {"id": user_id}}`,
                    timestamp: '2026-01-22T10:06:00Z'
                }
            ]
        };
    });
    describe('关键词提取', () => {
        it('应该正确提取 JavaScript/TypeScript 关键词', () => {
            const code = `
        function createUser(name: string) {
          const user = { name: name }
          return user
        }
      `;
            const keywords = PatternRecognizer.extractKeywords(code, 'typescript');
            expect(keywords).toContain('createUser');
            expect(keywords).toContain('name');
            expect(keywords).toContain('user');
            // 应该排除通用关键词
            expect(keywords).not.toContain('function');
            expect(keywords).not.toContain('const');
            expect(keywords).not.toContain('return');
        });
        it('应该正确提取 Python 关键词', () => {
            const code = `
        def create_user(name: str):
            user = {"name": name}
            return user
      `;
            const keywords = PatternRecognizer.extractKeywords(code, 'python');
            expect(keywords).toContain('create_user');
            expect(keywords).toContain('name');
            expect(keywords).toContain('user');
            // 应该排除通用关键词
            expect(keywords).not.toContain('def');
            expect(keywords).not.toContain('return');
        });
        it('应该处理空字符串和无效输入', () => {
            expect(PatternRecognizer.extractKeywords('', 'typescript')).toHaveLength(0);
            expect(PatternRecognizer.extractKeywords('const x = 1', 'typescript')).toHaveLength(0);
        });
    });
    describe('路径规范化', () => {
        it('应该正确规范化路径', () => {
            expect(PatternRecognizer.normalizePath('src/components/Login.vue'))
                .toBe('src/components/login.vue');
            expect(PatternRecognizer.normalizePath('C:\\Users\\project\\src\\api'))
                .toBe('c:/users/project/src/api');
            expect(PatternRecognizer.normalizePath('/home/user/project/'))
                .toBe('home/user/project');
        });
    });
    describe('关键词分析', () => {
        it('应该统计关键词频率和上下文', () => {
            const events = [
                {
                    type: 'file_saved',
                    file: 'test1.js',
                    content: 'function test() { const x = 1 }',
                    timestamp: '2026-01-22T10:00:00Z'
                },
                {
                    type: 'file_saved',
                    file: 'test2.js',
                    content: 'function test() { const y = 2 }',
                    timestamp: '2026-01-22T10:01:00Z'
                }
            ];
            const stats = recognizer.analyzeKeywords(events, {
                minFrequency: 1,
                excludeCommon: true,
                weightByContext: true
            });
            expect(stats.size).toBeGreaterThan(0);
            expect(stats.get('test')).toBeDefined();
            expect(stats.get('test')?.count).toBe(2);
        });
        it('应该根据上下文加权关键词', () => {
            const events = [
                {
                    type: 'error_fixed',
                    file: 'test.js',
                    content: 'fixed the bug',
                    timestamp: '2026-01-22T10:00:00Z'
                },
                {
                    type: 'file_saved',
                    file: 'test.js',
                    content: 'normal code',
                    timestamp: '2026-01-22T10:01:00Z'
                }
            ];
            const stats = recognizer.analyzeKeywords(events, {
                minFrequency: 1,
                excludeCommon: true,
                weightByContext: true
            });
            // 错误修复事件应该有更高的权重
            const fixedStats = stats.get('fixed');
            const normalStats = stats.get('normal');
            if (fixedStats && normalStats) {
                expect(fixedStats.weightedScore).toBeGreaterThan(normalStats.weightedScore);
            }
        });
    });
    describe('事件聚类', () => {
        it('应该按文件模式聚类事件', () => {
            const clusters = recognizer.clusterEvents(sampleSession.events);
            expect(clusters).toBeInstanceOf(Array);
            expect(clusters.length).toBeGreaterThan(0);
            // 应该包含 Vue 组件聚类
            const vueCluster = clusters.find(c => c.category === 'vue-component');
            expect(vueCluster).toBeDefined();
            expect(vueCluster?.events.length).toBeGreaterThan(0);
            // 应该包含测试文件聚类
            const testCluster = clusters.find(c => c.category === 'test-files');
            expect(testCluster).toBeDefined();
        });
        it('应该处理未分类的事件', () => {
            const events = [
                {
                    type: 'file_saved',
                    file: 'unknown.xyz',
                    content: 'some content',
                    timestamp: '2026-01-22T10:00:00Z'
                }
            ];
            const clusters = recognizer.clusterEvents(events);
            const otherCluster = clusters.find(c => c.category === 'other');
            expect(otherCluster).toBeDefined();
            expect(otherCluster?.events).toHaveLength(1);
        });
    });
    describe('模式识别', () => {
        it('应该识别 Vue props 验证模式', async () => {
            const result = await recognizer.recognize(sampleSession);
            expect(result.patterns).toBeInstanceOf(Array);
            expect(result.stats.totalEvents).toBe(sampleSession.events.length);
            // 应该识别到至少一个模式
            expect(result.patterns.length).toBeGreaterThan(0);
            // 检查模式结构
            const pattern = result.patterns[0];
            expect(pattern.id).toMatch(/^[a-z-]+-\w{4}$/);
            expect(pattern.confidence).toBeGreaterThanOrEqual(0.6);
            expect(pattern.trigger.keywords.length).toBeGreaterThan(0);
            expect(pattern.solution.description).toBeDefined();
        });
        it('应该根据置信度阈值过滤模式', async () => {
            const highConfidenceRecognizer = new PatternRecognizer({
                minConfidence: 0.9
            });
            const result = await highConfidenceRecognizer.recognize(sampleSession);
            // 所有模式都应该满足最小置信度
            result.patterns.forEach(pattern => {
                expect(pattern.confidence).toBeGreaterThanOrEqual(0.9);
            });
        });
        it('应该限制返回的模式数量', async () => {
            const limitedRecognizer = new PatternRecognizer({
                maxPatterns: 2
            });
            const result = await limitedRecognizer.recognize(sampleSession);
            expect(result.patterns.length).toBeLessThanOrEqual(2);
        });
    });
    describe('置信度计算', () => {
        it('应该正确计算关键词匹配得分', () => {
            const templateKeywords = ['defineProps', 'PropType'];
            const keywordStats = new Map();
            keywordStats.set('defineProps', { keyword: 'defineProps', count: 3, contexts: ['file_saved'], weightedScore: 3 });
            keywordStats.set('PropType', { keyword: 'PropType', count: 2, contexts: ['file_saved'], weightedScore: 2 });
            const score = recognizer.calculateKeywordScore(templateKeywords, keywordStats);
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(0.4); // 关键词得分权重为0.4
        });
        it('应该处理部分关键词匹配', () => {
            const templateKeywords = ['defineProps', 'PropType', 'nonexistent'];
            const keywordStats = new Map();
            keywordStats.set('defineProps', { keyword: 'defineProps', count: 3, contexts: ['file_saved'], weightedScore: 3 });
            const score = recognizer.calculateKeywordScore(templateKeywords, keywordStats);
            // 部分匹配应该得到部分分数
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThan(0.4);
        });
    });
    describe('文件模式匹配', () => {
        it('应该匹配简单的文件模式', () => {
            const match = recognizer.matchFilePattern('**/*.vue', 'src/components/Login.vue');
            expect(match).toBe(true);
            const noMatch = recognizer.matchFilePattern('**/*.ts', 'src/components/Login.vue');
            expect(noMatch).toBe(false);
        });
        it('应该匹配目录模式', () => {
            const match = recognizer.matchFilePattern('**/api/*.py', 'src/api/users.py');
            expect(match).toBe(true);
        });
        it('应该处理通用模式', () => {
            const match = recognizer.matchFilePattern('**/*', 'any/file/path');
            expect(match).toBe(true);
        });
    });
    describe('性能统计', () => {
        it('应该记录处理时间', async () => {
            const result = await recognizer.recognize(sampleSession);
            expect(result.stats.processingTime).toBeGreaterThan(0);
            expect(result.stats.totalEvents).toBe(sampleSession.events.length);
            expect(result.stats.clusters).toBeGreaterThan(0);
            expect(result.stats.totalKeywords).toBeGreaterThan(0);
        });
    });
    describe('边界情况处理', () => {
        it('应该处理空事件列表', async () => {
            const emptySession = {
                sessionId: 'empty-session',
                metadata: { projectType: 'vue', language: 'typescript' },
                events: []
            };
            const result = await recognizer.recognize(emptySession);
            expect(result.patterns).toHaveLength(0);
            expect(result.stats.totalEvents).toBe(0);
        });
        it('应该处理只有通用关键词的事件', async () => {
            const genericSession = {
                sessionId: 'generic-session',
                metadata: { projectType: 'vue', language: 'typescript' },
                events: [
                    {
                        type: 'file_saved',
                        file: 'test.js',
                        content: 'function test() { const x = 1; return x; }',
                        timestamp: '2026-01-22T10:00:00Z'
                    }
                ]
            };
            const result = await recognizer.recognize(genericSession);
            // 由于只有通用关键词，可能不会识别到模式
            expect(result.patterns.length).toBeLessThanOrEqual(result.stats.totalEvents);
        });
    });
});
