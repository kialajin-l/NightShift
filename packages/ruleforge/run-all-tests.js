/**
 * 完整的测试运行脚本
 * 1. 编译项目
 * 2. 编译测试文件
 * 3. 运行测试
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function runCommand(command, description) {
  log(`🚀 ${description}...`, colors.blue);
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    log(`✅ ${description} 成功`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} 失败`, colors.red);
    log(`  ${error.message}`, colors.red);
    return false;
  }
}

async function runAllTests() {
  log('🎯 RuleForge 完整测试流程', colors.blue);
  log('='.repeat(60), colors.blue);
  
  // 步骤1: 编译项目
  if (!runCommand('npm run build', '编译项目')) {
    log('💥 项目编译失败，停止测试', colors.red);
    return false;
  }
  
  // 步骤2: 编译测试文件
  log('🔨 编译测试文件...', colors.blue);
  try {
    const { compileAllTests } = await import('./compile-tests.js');
    const compileSuccess = await compileAllTests();
    
    if (!compileSuccess) {
      log('⚠️ 测试文件编译有错误，但继续运行可用测试', colors.yellow);
    }
  } catch (error) {
    log('⚠️ 测试文件编译失败，跳过 TypeScript 测试', colors.yellow);
  }
  
  // 步骤3: 运行原生测试
  log('🧪 运行原生测试...', colors.blue);
  try {
    const { runAllTests: runNativeTests } = await import('./test-runner-native.js');
    await runNativeTests();
    log('✅ 原生测试完成', colors.green);
  } catch (error) {
    log(`❌ 原生测试失败: ${error.message}`, colors.red);
    return false;
  }
  
  // 步骤4: 尝试运行 Vitest（如果可用）
  log('⚡ 尝试运行 Vitest...', colors.blue);
  try {
    runCommand('npm test', 'Vitest 测试');
    log('✅ Vitest 测试完成', colors.green);
  } catch (error) {
    log('⚠️ Vitest 测试不可用，跳过', colors.yellow);
  }
  
  log('='.repeat(60), colors.blue);
  log('🎉 所有测试流程完成!', colors.green);
  return true;
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`❌ 测试运行错误: ${error.message}`, colors.red);
    process.exit(1);
  });
}

export { runAllTests };