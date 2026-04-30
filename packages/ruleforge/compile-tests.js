/**
 * 编译 TypeScript 测试文件
 */

import { execSync } from 'child_process';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

// 编译单个测试文件
function compileTestFile(tsFile) {
  try {
    const jsFile = tsFile.replace('.ts', '.js');
    
    // 使用 TypeScript 编译器编译
    execSync(`npx tsc ${tsFile} --outDir ${join(__dirname, '__tests__')} --module esnext --target es2020`, {
      stdio: 'pipe'
    });
    
    log(`✓ ${tsFile} → ${jsFile}`, colors.green);
    return true;
  } catch (error) {
    log(`✗ ${tsFile} 编译失败`, colors.red);
    log(`  ${error.message}`, colors.red);
    return false;
  }
}

// 查找所有 TypeScript 测试文件
function findTypeScriptTestFiles() {
  const tsFiles = [];
  
  function searchDirectory(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist') {
          searchDirectory(fullPath);
        }
      } else if (entry.name.endsWith('.test.ts')) {
        tsFiles.push(fullPath);
      }
    }
  }
  
  searchDirectory(join(__dirname, '__tests__'));
  return tsFiles;
}

// 主函数
async function compileAllTests() {
  log('🔨 编译 TypeScript 测试文件', colors.blue);
  log('='.repeat(50), colors.blue);
  
  const tsFiles = findTypeScriptTestFiles();
  
  if (tsFiles.length === 0) {
    log('ℹ️ 未找到 TypeScript 测试文件', colors.blue);
    return true;
  }
  
  log(`📁 找到 ${tsFiles.length} 个 TypeScript 测试文件`, colors.blue);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const tsFile of tsFiles) {
    if (compileTestFile(tsFile)) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  log('='.repeat(50), colors.blue);
  
  if (failCount === 0) {
    log(`🎉 所有测试文件编译成功! (${successCount}/${tsFiles.length})`, colors.green);
    return true;
  } else {
    log(`💥 编译失败: ${failCount}/${tsFiles.length} 个文件编译失败`, colors.red);
    return false;
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  compileAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`❌ 编译过程错误: ${error.message}`, colors.red);
    process.exit(1);
  });
}

export { compileAllTests };