#!/usr/bin/env node

/**
 * NightShift 导入路径修复脚本
 * 修复所有使用 .js 扩展名的 import 语句
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function success(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function info(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

/**
 * 修复单个文件中的 import 语句
 */
function fixFileImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 修复 import 语句中的 .js 扩展名
    const fixedContent = content.replace(/\.js'/g, "'");
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (err) {
    error(`修复文件 ${filePath} 失败: ${err.message}`);
    return false;
  }
}

/**
 * 递归遍历目录并修复所有 TypeScript 文件
 */
function fixDirectoryRecursively(dirPath) {
  let fixedCount = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 递归处理子目录
        fixedCount += fixDirectoryRecursively(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        // 处理 TypeScript 文件
        if (fixFileImports(fullPath)) {
          fixedCount++;
          success(`修复: ${fullPath}`);
        }
      }
    }
  } catch (err) {
    error(`遍历目录 ${dirPath} 失败: ${err.message}`);
  }
  
  return fixedCount;
}

/**
 * 主修复函数
 */
function main() {
  log('🚀 NightShift 导入路径修复脚本', 'cyan');
  log('='.repeat(50));
  
  const srcDir = path.join(__dirname, '..', 'src');
  
  if (!fs.existsSync(srcDir)) {
    error(`源目录不存在: ${srcDir}`);
    process.exit(1);
  }
  
  info(`开始修复目录: ${srcDir}`);
  
  const fixedCount = fixDirectoryRecursively(srcDir);
  
  log('='.repeat(50));
  
  if (fixedCount > 0) {
    success(`🎉 修复完成! 共修复 ${fixedCount} 个文件`);
  } else {
    info('没有需要修复的文件');
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  fixFileImports,
  fixDirectoryRecursively
};