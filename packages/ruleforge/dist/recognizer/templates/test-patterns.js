/**
 * 测试相关模式模板
 */
export const testPatterns = [
    {
        id: 'test-assertion-style',
        category: 'test_pattern',
        keywords: ['expect', 'toBe', 'toEqual', 'toContain', 'toThrow', 'describe', 'it', 'test'],
        filePattern: '**/*.test.*',
        condition: (events) => {
            // 检查测试断言使用模式
            const testEvents = events.filter(e => e.type === 'test_run' ||
                (e.type === 'file_saved' && e.file?.includes('.test.')));
            const assertionEvents = events.filter(e => e.type === 'file_saved' &&
                (e.content?.includes('expect(') || e.content?.includes('.toBe(')));
            return testEvents.length >= 3 && assertionEvents.length >= 5;
        },
        minConfidence: 0.8,
        solution: {
            description: '测试断言风格模式',
            codeExample: {
                before: `// 简单的断言
if (result !== expected) {
  throw new Error('Test failed')
}`,
                after: `// 使用 Jest/Vitest 断言
describe('MyComponent', () => {
  it('should render correctly', () => {
    const result = renderComponent()
    expect(result).toBeDefined()
    expect(result.text()).toContain('Hello')
  })
})`,
                language: 'javascript'
            }
        }
    },
    {
        id: 'test-mocking-pattern',
        category: 'test_pattern',
        keywords: ['jest.mock', 'vi.mock', 'mockReturnValue', 'mockResolvedValue', 'spyOn'],
        filePattern: '**/*.test.*',
        condition: (events) => {
            // 检查模拟使用模式
            const mockEvents = events.filter(e => e.type === 'file_saved' &&
                (e.content?.includes('mock') || e.content?.includes('spyOn')));
            const testRunEvents = events.filter(e => e.type === 'test_run');
            return mockEvents.length >= 2 && testRunEvents.length >= 3;
        },
        minConfidence: 0.7,
        solution: {
            description: '测试模拟模式',
            codeExample: {
                before: `// 直接调用真实依赖
const result = api.fetchData()`,
                after: `// 使用模拟
import { vi } from 'vitest'

vi.mock('./api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'test' })
}))

const result = await api.fetchData()
expect(result.data).toBe('test')`,
                language: 'javascript'
            }
        }
    },
    {
        id: 'test-setup-teardown',
        category: 'test_pattern',
        keywords: ['beforeEach', 'afterEach', 'beforeAll', 'afterAll', 'setup', 'teardown'],
        filePattern: '**/*.test.*',
        condition: (events) => {
            // 检查测试设置和清理模式
            const setupEvents = events.filter(e => e.type === 'file_saved' &&
                (e.content?.includes('beforeEach') || e.content?.includes('beforeAll')));
            const teardownEvents = events.filter(e => e.type === 'file_saved' &&
                (e.content?.includes('afterEach') || e.content?.includes('afterAll')));
            return setupEvents.length >= 2 && teardownEvents.length >= 1;
        },
        minConfidence: 0.65,
        solution: {
            description: '测试设置和清理模式',
            codeExample: {
                before: `// 重复的设置代码
describe('MyComponent', () => {
  it('test1', () => {
    const container = document.createElement('div')
    // ...
  })
  
  it('test2', () => {
    const container = document.createElement('div')
    // ...
  })
})`,
                after: `// 使用 beforeEach 和 afterEach
describe('MyComponent', () => {
  let container: HTMLDivElement
  
  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })
  
  afterEach(() => {
    document.body.removeChild(container)
  })
  
  it('test1', () => {
    // 使用 container
  })
  
  it('test2', () => {
    // 使用 container
  })
})`,
                language: 'javascript'
            }
        }
    }
];
