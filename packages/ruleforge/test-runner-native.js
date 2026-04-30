/**
 * 原生 Node.js 测试运行器
 * 完全绕过 Vitest 和 PostCSS 配置问题
 */

import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试结果统计
let passed = 0;
let failed = 0;
let total = 0;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

// 简单的断言库
class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertionError';
  }
}

const assert = {
  equal(actual, expected, message = `Expected ${expected}, but got ${actual}`) {
    if (actual !== expected) {
      throw new AssertionError(message);
    }
  },
  
  notEqual(actual, expected, message = `Expected not ${expected}, but got ${actual}`) {
    if (actual === expected) {
      throw new AssertionError(message);
    }
  },
  
  ok(value, message = 'Expected truthy value') {
    if (!value) {
      throw new AssertionError(message);
    }
  },
  
  throws(fn, message = 'Expected function to throw') {
    try {
      fn();
      throw new AssertionError(message);
    } catch (error) {
      if (error instanceof AssertionError) {
        throw error;
      }
      // 正常抛出，测试通过
    }
  },
  
  doesNotThrow(fn, message = 'Expected function not to throw') {
    try {
      fn();
    } catch (error) {
      throw new AssertionError(message);
    }
  }
};

// 将 Windows 路径转换为 file:// URL
function pathToFileURL(path) {
  if (path.startsWith('file://')) {
    return path;
  }
  return `file:///${path.replace(/\\/g, '/')}`;
}

// 测试运行器
async function runTest(testFile) {
  try {
    const fileURL = pathToFileURL(testFile);
    const testModule = await import(fileURL);
    
    if (typeof testModule.default === 'function') {
      await testModule.default(assert);
    }
    
    passed++;
    log(`✓ ${testFile}`, colors.green);
  } catch (error) {
    failed++;
    log(`✗ ${testFile}`, colors.red);
    log(`  ${error.message}`, colors.red);
    if (error.stack) {
      log(`  ${error.stack.split('\n').slice(1, 3).join('\n  ')}`, colors.yellow);
    }
  }
  
  total++;
}

// 查找测试文件
function findTestFiles() {
  const testFiles = [];
  
  function searchDirectory(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist') {
          searchDirectory(fullPath);
        }
      } else if (entry.name.endsWith('.test.js')) {
        // 只运行 JavaScript 测试文件
        testFiles.push(fullPath);
      }
    }
  }
  
  searchDirectory(join(__dirname, '__tests__'));
  return testFiles;
}

// 主运行函数
async function runAllTests() {
  log('🚀 启动原生 Node.js 测试运行器', colors.blue);
  log('='.repeat(50), colors.blue);
  
  const testFiles = findTestFiles();
  
  if (testFiles.length === 0) {
    log('❌ 未找到测试文件', colors.red);
    process.exit(1);
  }
  
  log(`📁 找到 ${testFiles.length} 个测试文件`, colors.blue);
  
  for (const testFile of testFiles) {
    await runTest(testFile);
  }
  
  // 输出结果
  log('='.repeat(50), colors.blue);
  
  if (failed === 0) {
    log(`🎉 所有测试通过! (${passed}/${total})`, colors.green);
  } else {
    log(`💥 测试失败: ${failed}/${total} 个测试失败`, colors.red);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    log(`❌ 测试运行器错误: ${error.message}`, colors.red);
    process.exit(1);
  });
}

export { runAllTests, assert };