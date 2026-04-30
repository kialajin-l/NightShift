#!/usr/bin/env node

/**
 * NightShift 集成系统测试执行脚本
 * 执行完整的测试套件并生成测试报告
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// 测试配置
const TEST_CONFIG = {
  // 测试类型
  testTypes: ['unit', 'integration', 'e2e', 'performance'],
  
  // 测试报告目录
  reportDir: './test-reports',
  
  // 测试超时时间（毫秒）
  timeout: 300000, // 5分钟
  
  // 性能测试配置
  performance: {
    enabled: true,
    warmup: 5000, // 5秒预热
    duration: 30000 // 30秒测试
  }
};

// 测试结果数据结构
class TestResults {
  constructor() {
    this.startTime = new Date();
    this.endTime = null;
    this.results = {
      unit: { passed: 0, failed: 0, total: 0, duration: 0 },
      integration: { passed: 0, failed: 0, total: 0, duration: 0 },
      e2e: { passed: 0, failed: 0, total: 0, duration: 0 },
      performance: { passed: 0, failed: 0, total: 0, duration: 0 }
    };
    this.errors = [];
  }

  addResult(type, result) {
    this.results[type].total++;
    if (result.passed) {
      this.results[type].passed++;
    } else {
      this.results[type].failed++;
    }
    this.results[type].duration += result.duration;
  }

  finalize() {
    this.endTime = new Date();
  }

  getSummary() {
    const totalTests = Object.values(this.results).reduce((sum, r) => sum + r.total, 0);
    const totalPassed = Object.values(this.results).reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = Object.values(this.results).reduce((sum, r) => sum + r.failed, 0);
    const totalDuration = (this.endTime - this.startTime) / 1000;

    return {
      totalTests,
      totalPassed,
      totalFailed,
      successRate: totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(2) : '0.00',
      totalDuration: totalDuration.toFixed(2),
      results: this.results
    };
  }
}

// 测试运行器类
class TestRunner {
  constructor() {
    this.results = new TestResults();
    this.reportDir = TEST_CONFIG.reportDir;
  }

  /**
   * 确保报告目录存在
   */
  ensureReportDir() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * 运行单元测试
   */
  async runUnitTests() {
    console.log('\n🔬 运行单元测试...');
    
    try {
      const startTime = Date.now();
      
      // 使用 Vitest 运行单元测试
      const { stdout, stderr } = await execAsync(
        'npx vitest run src/__tests__/unit --reporter=verbose',
        { 
          timeout: TEST_CONFIG.timeout,
          cwd: process.cwd()
        }
      );
      
      const duration = Date.now() - startTime;
      
      // 解析测试结果（简化版）
      const passed = (stdout.match(/✓/g) || []).length;
      const failed = (stdout.match(/✗/g) || []).length;
      const total = passed + failed;
      
      this.results.addResult('unit', {
        passed: failed === 0,
        duration: duration / 1000
      });
      
      console.log(`✅ 单元测试完成: ${passed} 通过, ${failed} 失败, 总耗时: ${(duration / 1000).toFixed(2)}秒`);
      
      return { passed, failed, total, duration, stdout, stderr };
      
    } catch (error) {
      console.error('❌ 单元测试失败:', error);
      this.results.errors.push(`单元测试失败: ${error.message}`);
      return { passed: 0, failed: 1, total: 1, duration: 0, error: error.message };
    }
  }

  /**
   * 运行集成测试
   */
  async runIntegrationTests() {
    console.log('\n🔗 运行集成测试...');
    
    try {
      const startTime = Date.now();
      
      // 使用 Vitest 运行集成测试
      const { stdout, stderr } = await execAsync(
        'npx vitest run src/__tests__/integration --reporter=verbose',
        { 
          timeout: TEST_CONFIG.timeout,
          cwd: process.cwd()
        }
      );
      
      const duration = Date.now() - startTime;
      
      // 解析测试结果
      const passed = (stdout.match(/✓/g) || []).length;
      const failed = (stdout.match(/✗/g) || []).length;
      const total = passed + failed;
      
      this.results.addResult('integration', {
        passed: failed === 0,
        duration: duration / 1000
      });
      
      console.log(`✅ 集成测试完成: ${passed} 通过, ${failed} 失败, 总耗时: ${(duration / 1000).toFixed(2)}秒`);
      
      return { passed, failed, total, duration, stdout, stderr };
      
    } catch (error) {
      console.error('❌ 集成测试失败:', error);
      this.results.errors.push(`集成测试失败: ${error.message}`);
      return { passed: 0, failed: 1, total: 1, duration: 0, error: error.message };
    }
  }

  /**
   * 运行端到端测试
   */
  async runE2ETests() {
    console.log('\n🌐 运行端到端测试...');
    
    try {
      const startTime = Date.now();
      
      // 使用 Vitest 运行 E2E 测试
      const { stdout, stderr } = await execAsync(
        'npx vitest run src/__tests__/e2e --reporter=verbose',
        { 
          timeout: TEST_CONFIG.timeout,
          cwd: process.cwd()
        }
      );
      
      const duration = Date.now() - startTime;
      
      // 解析测试结果
      const passed = (stdout.match(/✓/g) || []).length;
      const failed = (stdout.match(/✗/g) || []).length;
      const total = passed + failed;
      
      this.results.addResult('e2e', {
        passed: failed === 0,
        duration: duration / 1000
      });
      
      console.log(`✅ 端到端测试完成: ${passed} 通过, ${failed} 失败, 总耗时: ${(duration / 1000).toFixed(2)}秒`);
      
      return { passed, failed, total, duration, stdout, stderr };
      
    } catch (error) {
      console.error('❌ 端到端测试失败:', error);
      this.results.errors.push(`端到端测试失败: ${error.message}`);
      return { passed: 0, failed: 1, total: 1, duration: 0, error: error.message };
    }
  }

  /**
   * 运行性能测试
   */
  async runPerformanceTests() {
    if (!TEST_CONFIG.performance.enabled) {
      console.log('\n⚡ 性能测试已禁用');
      return { passed: 0, failed: 0, total: 0, duration: 0 };
    }
    
    console.log('\n⚡ 运行性能测试...');
    
    try {
      const startTime = Date.now();
      
      // 使用 Vitest 运行性能测试
      const { stdout, stderr } = await execAsync(
        'npx vitest run src/__tests__/performance --reporter=verbose',
        { 
          timeout: TEST_CONFIG.timeout,
          cwd: process.cwd()
        }
      );
      
      const duration = Date.now() - startTime;
      
      // 解析测试结果
      const passed = (stdout.match(/✓/g) || []).length;
      const failed = (stdout.match(/✗/g) || []).length;
      const total = passed + failed;
      
      this.results.addResult('performance', {
        passed: failed === 0,
        duration: duration / 1000
      });
      
      console.log(`✅ 性能测试完成: ${passed} 通过, ${failed} 失败, 总耗时: ${(duration / 1000).toFixed(2)}秒`);
      
      return { passed, failed, total, duration, stdout, stderr };
      
    } catch (error) {
      console.error('❌ 性能测试失败:', error);
      this.results.errors.push(`性能测试失败: ${error.message}`);
      return { passed: 0, failed: 1, total: 1, duration: 0, error: error.message };
    }
  }

  /**
   * 生成 HTML 测试报告
   */
  generateHTMLReport(summary) {
    const reportPath = path.join(this.reportDir, 'test-report.html');
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NightShift 集成系统测试报告</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            padding: 30px; 
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #e0e0e0; 
            padding-bottom: 20px; 
        }
        .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .summary-card { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 6px; 
            text-align: center; 
        }
        .summary-card.success { background: #d4edda; color: #155724; }
        .summary-card.warning { background: #fff3cd; color: #856404; }
        .summary-card.danger { background: #f8d7da; color: #721c24; }
        .test-type { 
            margin-bottom: 20px; 
            border: 1px solid #e0e0e0; 
            border-radius: 6px; 
            padding: 15px; 
        }
        .progress-bar { 
            height: 10px; 
            background: #e0e0e0; 
            border-radius: 5px; 
            margin: 10px 0; 
            overflow: hidden; 
        }
        .progress { 
            height: 100%; 
            background: #28a745; 
            transition: width 0.3s; 
        }
        .timestamp { 
            color: #666; 
            font-size: 0.9em; 
            margin-top: 20px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 NightShift 集成系统测试报告</h1>
            <p>测试执行时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card ${summary.totalFailed === 0 ? 'success' : 'danger'}">
                <h3>总测试数</h3>
                <p style="font-size: 2em; margin: 10px 0;">${summary.totalTests}</p>
            </div>
            <div class="summary-card success">
                <h3>通过</h3>
                <p style="font-size: 2em; margin: 10px 0;">${summary.totalPassed}</p>
            </div>
            <div class="summary-card ${summary.totalFailed > 0 ? 'danger' : 'success'}">
                <h3>失败</h3>
                <p style="font-size: 2em; margin: 10px 0;">${summary.totalFailed}</p>
            </div>
            <div class="summary-card ${parseFloat(summary.successRate) > 80 ? 'success' : parseFloat(summary.successRate) > 60 ? 'warning' : 'danger'}">
                <h3>成功率</h3>
                <p style="font-size: 2em; margin: 10px 0;">${summary.successRate}%</p>
            </div>
        </div>
        
        <h2>详细测试结果</h2>
        ${Object.entries(summary.results).map(([type, result]) => `
            <div class="test-type">
                <h3>${this.getTestTypeName(type)} 测试</h3>
                <p>通过: ${result.passed} | 失败: ${result.failed} | 总计: ${result.total}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${result.total > 0 ? (result.passed / result.total * 100) : 0}%"></div>
                </div>
                <p>耗时: ${result.duration.toFixed(2)} 秒</p>
            </div>
        `).join('')}
        
        <div class="timestamp">
            <p>测试开始: ${this.results.startTime.toLocaleString('zh-CN')}</p>
            <p>测试结束: ${this.results.endTime.toLocaleString('zh-CN')}</p>
            <p>总耗时: ${summary.totalDuration} 秒</p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(reportPath, htmlContent);
    console.log(`📊 HTML 测试报告已生成: ${reportPath}`);
  }

  /**
   * 获取测试类型名称
   */
  getTestTypeName(type) {
    const names = {
      unit: '单元',
      integration: '集成',
      e2e: '端到端',
      performance: '性能'
    };
    return names[type] || type;
  }

  /**
   * 生成 JSON 测试报告
   */
  generateJSONReport(summary) {
    const reportPath = path.join(this.reportDir, 'test-report.json');
    
    const jsonContent = {
      project: 'NightShift 集成系统',
      timestamp: new Date().toISOString(),
      summary: summary,
      details: this.results.results,
      errors: this.results.errors
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(jsonContent, null, 2));
    console.log(`📋 JSON 测试报告已生成: ${reportPath}`);
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始 NightShift 集成系统完整测试套件...\n');
    
    this.ensureReportDir();
    
    // 运行各种类型的测试
    await this.runUnitTests();
    await this.runIntegrationTests();
    await this.runE2ETests();
    await this.runPerformanceTests();
    
    // 完成测试结果收集
    this.results.finalize();
    
    // 生成测试报告
    const summary = this.results.getSummary();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 测试完成摘要');
    console.log('='.repeat(60));
    console.log(`总测试数: ${summary.totalTests}`);
    console.log(`通过: ${summary.totalPassed}`);
    console.log(`失败: ${summary.totalFailed}`);
    console.log(`成功率: ${summary.successRate}%`);
    console.log(`总耗时: ${summary.totalDuration} 秒`);
    
    // 生成报告文件
    this.generateHTMLReport(summary);
    this.generateJSONReport(summary);
    
    // 输出错误信息（如果有）
    if (this.results.errors.length > 0) {
      console.log('\n❌ 测试过程中出现的错误:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 根据测试结果退出
    if (summary.totalFailed > 0) {
      console.log('\n❌ 测试失败！');
      process.exit(1);
    } else {
      console.log('\n✅ 所有测试通过！');
      process.exit(0);
    }
  }
}

// 主执行函数
async function main() {
  const runner = new TestRunner();
  
  try {
    await runner.runAllTests();
  } catch (error) {
    console.error('💥 测试执行过程中发生错误:', error);
    process.exit(1);
  }
}

// 执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { TestRunner, TestResults };