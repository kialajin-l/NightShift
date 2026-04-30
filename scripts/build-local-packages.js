#!/usr/bin/env node

/**
 * 构建本地包依赖的脚本
 * 解决 workspace:* 依赖问题
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const packages = [
  'packages/core',
  'packages/agents', 
  'packages/ruleforge'
];

console.log('🔧 开始构建本地包依赖...');

// 检查包目录是否存在
const missingPackages = packages.filter(pkg => !fs.existsSync(pkg));
if (missingPackages.length > 0) {
  console.error('❌ 缺少包目录:', missingPackages.join(', '));
  process.exit(1);
}

// 构建每个包
packages.forEach(pkgPath => {
  console.log(`📦 构建 ${pkgPath}...`);
  
  try {
    // 检查 package.json
    const packageJsonPath = path.join(pkgPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log(`   ⚠️  跳过: ${pkgPath} 缺少 package.json`);
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // 检查构建脚本
    if (!packageJson.scripts || !packageJson.scripts.build) {
      console.log(`   ⚠️  跳过: ${pkgPath} 缺少构建脚本`);
      return;
    }

    // 执行构建
    execSync('npm run build', { 
      cwd: pkgPath, 
      stdio: 'inherit' 
    });
    
    console.log(`   ✅ ${pkgPath} 构建成功`);
    
  } catch (error) {
    console.error(`   ❌ ${pkgPath} 构建失败:`, error.message);
  }
});

console.log('🎉 本地包构建完成！');
console.log('');
console.log('💡 下一步:');
console.log('   1. 运行 npm install 安装主包依赖');
console.log('   2. 运行 npm run dev 启动开发服务器');
console.log('   3. 访问 http://localhost:3000/debug 测试调试界面');