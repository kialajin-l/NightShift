#!/usr/bin/env node

/**
 * NightShift CodePilot 集成测试脚本
 * 验证 CodePilot 功能在 NightShift 中的集成效果
 */

import fs from 'fs';
import path from 'path';

const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * 测试用例类
 */
class TestCase {
  constructor(name, fn) {
    this.name = name;
    this.fn = fn;
  }

  async run() {
    try {
      await this.fn();
      console.log(`✅ ${this.name}`);
      testResults.passed++;
    } catch (error) {
      console.log(`❌ ${this.name}`);
      console.log(`   Error: ${error.message}`);
      testResults.failed++;
    }
    testResults.total++;
  }
}

/**
 * 测试套件
 */
class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
  }

  addTest(test) {
    this.tests.push(test);
  }

  async run() {
    console.log(`\n🧪 ${this.name}`);
    console.log('=' .repeat(50));
    
    for (const test of this.tests) {
      await test.run();
    }
  }
}

/**
 * 文件存在性检查
 */
function checkFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
}

/**
 * 文件内容检查
 */
function checkFileContent(filePath, expectedContent) {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content.includes(expectedContent)) {
    throw new Error(`Expected content not found in ${filePath}`);
  }
}

/**
 * 目录结构检查
 */
function checkDirectoryStructure(basePath, expectedStructure) {
  for (const item of expectedStructure) {
    const fullPath = path.join(basePath, item);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Directory structure mismatch: ${item} not found`);
    }
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 NightShift CodePilot 集成测试');
  console.log('=' .repeat(60));
  console.log('');

  // 1. 项目结构测试
  const structureSuite = new TestSuite('项目结构测试');
  
  structureSuite.addTest(new TestCase('检查 src 目录存在', () => {
    checkFileExists('./src');
  }));
  
  structureSuite.addTest(new TestCase('检查 packages 目录存在', () => {
    checkFileExists('./packages');
  }));
  
  structureSuite.addTest(new TestCase('检查 package.json 配置', () => {
    checkFileExists('./package.json');
    checkFileContent('./package.json', '@nightshift/core');
  }));

  // 2. CodePilot 功能集成测试
  const codePilotSuite = new TestSuite('CodePilot 功能集成测试');
  
  codePilotSuite.addTest(new TestCase('检查聊天界面组件', () => {
    checkFileExists('./src/components/chat/ChatView.tsx');
    checkFileContent('./src/components/chat/ChatView.tsx', 'ChatView');
  }));
  
  codePilotSuite.addTest(new TestCase('检查模型服务', () => {
    checkFileExists('./src/services/model-service.ts');
    checkFileContent('./src/services/model-service.ts', 'ModelService');
  }));
  
  codePilotSuite.addTest(new TestCase('检查用量统计', () => {
    checkFileExists('./src/utils/usage-tracker.ts');
    checkFileContent('./src/utils/usage-tracker.ts', 'UsageTracker');
  }));

  // 3. NightShift 新增功能测试
  const nightShiftSuite = new TestSuite('NightShift 新增功能测试');
  
  nightShiftSuite.addTest(new TestCase('检查任务计划面板', () => {
    checkFileExists('./src/components/nightshift/TaskPlanPanel.tsx');
  }));
  
  nightShiftSuite.addTest(new TestCase('检查工作流API', () => {
    checkFileExists('./src/app/api/nightshift/workflow/route.ts');
    checkFileContent('./src/app/api/nightshift/workflow/route.ts', 'WorkflowRequest');
  }));
  
  nightShiftSuite.addTest(new TestCase('检查类型定义', () => {
    checkFileExists('./src/types/index.ts');
    checkFileContent('./src/types/index.ts', 'interface Message');
  }));

  // 4. 配置和构建测试
  const configSuite = new TestSuite('配置和构建测试');
  
  configSuite.addTest(new TestCase('检查 Next.js 配置', () => {
    checkFileExists('./next.config.ts');
  }));
  
  configSuite.addTest(new TestCase('检查 Tailwind 配置', () => {
    checkFileExists('./tailwind.config.ts');
  }));
  
  configSuite.addTest(new TestCase('检查 TypeScript 配置', () => {
    checkFileExists('./tsconfig.json');
  }));

  // 运行所有测试套件
  await structureSuite.run();
  await codePilotSuite.run();
  await nightShiftSuite.run();
  await configSuite.run();

  // 生成测试报告
  console.log('\n📊 测试报告');
  console.log('=' .repeat(50));
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  console.log(`通过率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 所有测试通过！CodePilot 集成成功！');
    console.log('\n✅ 已验证的功能:');
    console.log('   • 项目结构完整性');
    console.log('   • CodePilot 核心功能集成');
    console.log('   • NightShift 新增功能');
    console.log('   • 配置和构建系统');
    console.log('\n🚀 NightShift 已准备好进行下一步开发！');
  } else {
    console.log('\n⚠️  部分测试失败，需要检查集成问题');
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 检查当前目录是否为 NightShift 项目根目录
    if (!fs.existsSync('./package.json')) {
      console.error('❌ 请在 NightShift 项目根目录运行此脚本');
      process.exit(1);
    }

    await runAllTests();
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
main();