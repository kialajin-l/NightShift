#!/usr/bin/env node

/**
 * NightShift 快速启动脚本
 * 使用简化配置快速启动开发服务器
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 NightShift 快速启动脚本');
console.log('='.repeat(60));
console.log('');

async function quickStart() {
  try {
    // 1. 备份原始 package.json
    console.log('1. 备份原始配置...');
    if (fs.existsSync('package.json')) {
      fs.copyFileSync('package.json', 'package.json.backup');
    }
    
    // 2. 使用简化配置
    console.log('2. 使用简化配置...');
    if (fs.existsSync('package-simple.json')) {
      fs.copyFileSync('package-simple.json', 'package.json');
    }
    
    // 3. 安装基础依赖
    console.log('3. 安装基础依赖...');
    execSync('npm install', { stdio: 'inherit' });
    
    // 4. 启动开发服务器
    console.log('4. 启动开发服务器...');
    console.log('');
    console.log('💡 开发服务器将在 http://localhost:3000 启动');
    console.log('📊 调试界面地址: http://localhost:3000/debug');
    console.log('');
    
    execSync('npm run dev', { stdio: 'inherit' });
    
  } catch (error) {
    console.error('❌ 快速启动失败:', error.message);
    
    // 恢复备份
    if (fs.existsSync('package.json.backup')) {
      fs.copyFileSync('package.json.backup', 'package.json');
      fs.unlinkSync('package.json.backup');
    }
    
    console.log('');
    console.log('💡 备用方案: 手动安装依赖');
    console.log('   1. 删除 package.json 中的问题依赖');
    console.log('   2. 运行 npm install');
    console.log('   3. 运行 npm run dev');
  }
}

// 运行快速启动
quickStart();