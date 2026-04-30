#!/usr/bin/env tsx

/**
 * RuleForge 模式识别演示脚本
 * 
 * 用法：
 * npx tsx demo/recognize-patterns.ts --log ./test-data/sample-session.jsonl --min-conf 0.7
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { PatternRecognizer } from '../src/recognizer/pattern-recognizer';
import { ParsedSession } from '../src/types/pattern';

/**
 * 命令行参数解析
 */
interface CliArgs {
  log?: string;
  minConf?: number;
  help?: boolean;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {};
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg === '--log' && process.argv[i + 1]) {
      args.log = process.argv[++i];
    } else if (arg === '--min-conf' && process.argv[i + 1]) {
      args.minConf = parseFloat(process.argv[++i]);
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }
  
  return args;
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
RuleForge 模式识别演示脚本

用法：
  npx tsx demo/recognize-patterns.ts [选项]

选项：
  --log <文件路径>     指定日志文件路径（JSONL 格式）
  --min-conf <数值>    最小置信度阈值（默认：0.7）
  --help, -h          显示此帮助信息

示例：
  npx tsx demo/recognize-patterns.ts --log ./test-data/sample-session.jsonl --min-conf 0.7
  `);
}

/**
 * 加载测试数据
 */
function loadTestData(): ParsedSession {
  // 如果没有指定日志文件，使用内置测试数据
  return {
    sessionId: 'demo-session-001',
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
      },
      {
        type: 'file_saved',
        file: 'src/api/users.py',
        content: `@router.put("/{user_id}")
def update_user(user_id: int, user: UserUpdate):
    return {"message": "updated"}`,
        timestamp: '2026-01-22T10:07:00Z'
      },
      {
        type: 'file_saved',
        file: 'src/api/users.py',
        content: `@router.delete("/{user_id}")
def delete_user(user_id: int):
    return {"message": "deleted"}`,
        timestamp: '2026-01-22T10:08:00Z'
      },
      {
        type: 'file_saved',
        file: 'src/components/Login.test.ts',
        content: `import { describe, it, expect } from 'vitest'

describe('Login Component', () => {
  it('should render correctly', () => {
    expect(true).toBe(true)
  })
})`,
        timestamp: '2026-01-22T10:09:00Z'
      },
      {
        type: 'file_saved',
        file: 'src/components/UserProfile.test.ts',
        content: `import { describe, it, expect } from 'vitest'

describe('UserProfile Component', () => {
  it('should handle user data', () => {
    expect(user).toBeDefined()
    expect(user.name).toBe('John')
  })
})`,
        timestamp: '2026-01-22T10:10:00Z'
      }
    ]
  };
}

/**
 * 从 JSONL 文件加载会话数据
 */
function loadSessionFromFile(filePath: string): ParsedSession {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const events = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    return {
      sessionId: `file-${Date.now()}`,
      metadata: {
        projectType: 'vue',
        language: 'typescript'
      },
      events
    };
  } catch (error) {
    console.error('❌ 加载日志文件失败:', error);
    process.exit(1);
  }
}

/**
 * 格式化置信度显示
 */
function formatConfidence(confidence: number): string {
  const percentage = (confidence * 100).toFixed(1);
  if (confidence >= 0.9) return `🟢 ${percentage}%`;
  if (confidence >= 0.7) return `🟡 ${percentage}%`;
  if (confidence >= 0.5) return `🟠 ${percentage}%`;
  return `🔴 ${percentage}%`;
}

/**
 * 显示识别结果
 */
function displayResults(result: any): void {
  console.log('\n🔍 RuleForge 模式识别结果\n');
  
  // 显示统计信息
  console.log('📊 统计信息:');
  console.log(`   事件总数: ${result.stats.totalEvents}`);
  console.log(`   关键词数量: ${result.stats.totalKeywords}`);
  console.log(`   聚类数量: ${result.stats.clusters}`);
  console.log(`   处理时间: ${result.stats.processingTime}ms\n`);
  
  // 显示识别到的模式
  if (result.patterns.length === 0) {
    console.log('❌ 未识别到任何模式');
    return;
  }
  
  console.log(`✅ 识别到 ${result.patterns.length} 个候选模式：\n`);
  
  result.patterns.forEach((pattern: any, index: number) => {
    console.log(`${index + 1}. ${pattern.id} (${formatConfidence(pattern.confidence)})`);
    console.log(`   类别: ${pattern.category}`);
    console.log(`   触发: ${pattern.trigger.keywords.slice(0, 3).join(', ')} (出现 ${pattern.trigger.frequency} 次)`);
    console.log(`   文件: ${pattern.trigger.filePattern}`);
    console.log(`   适用场景: ${pattern.applicableScenes} 个`);
    console.log(`   解决方案: ${pattern.solution.description}`);
    
    if (pattern.solution.codeExample) {
      console.log(`   代码示例:`);
      console.log(`     语言: ${pattern.solution.codeExample.language}`);
      console.log(`     前: ${pattern.solution.codeExample.before.split('\n')[0]}...`);
      console.log(`     后: ${pattern.solution.codeExample.after.split('\n')[0]}...`);
    }
    
    console.log('');
  });
  
  // 显示置信度分布
  console.log('📈 置信度分布:');
  const confidenceRanges = {
    '0.9-1.0': result.patterns.filter((p: any) => p.confidence >= 0.9).length,
    '0.7-0.9': result.patterns.filter((p: any) => p.confidence >= 0.7 && p.confidence < 0.9).length,
    '0.5-0.7': result.patterns.filter((p: any) => p.confidence >= 0.5 && p.confidence < 0.7).length,
    '0.0-0.5': result.patterns.filter((p: any) => p.confidence < 0.5).length
  };
  
  Object.entries(confidenceRanges).forEach(([range, count]) => {
    if (count > 0) {
      console.log(`   ${range}: ${count} 个模式`);
    }
  });
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = parseArgs();
  
  if (args.help) {
    showHelp();
    return;
  }
  
  console.log('🚀 启动 RuleForge 模式识别引擎...\n');
  
  // 加载会话数据
  let session: ParsedSession;
  if (args.log) {
    console.log(`📂 从文件加载会话数据: ${args.log}`);
    session = loadSessionFromFile(args.log);
  } else {
    console.log('📝 使用内置测试数据');
    session = loadTestData();
  }
  
  // 创建识别器
  const recognizer = new PatternRecognizer({
    minConfidence: args.minConf || 0.7,
    minFrequency: 2,
    maxPatterns: 10
  });
  
  console.log(`🔧 配置: 最小置信度 ${args.minConf || 0.7}, 最大模式数 10\n`);
  
  // 执行模式识别
  console.log('🔍 开始分析会话数据...');
  const startTime = Date.now();
  
  try {
    const result = await recognizer.recognize(session);
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ 分析完成 (${processingTime}ms)\n`);
    
    // 显示结果
    displayResults(result);
    
  } catch (error) {
    console.error('❌ 模式识别失败:', error);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 演示脚本执行失败:', error);
    process.exit(1);
  });
}