#!/usr/bin/env node

/**
 * 修复 package.json BOM 字符问题
 */

import fs from 'fs';

console.log('🔧 修复 package.json BOM 字符问题');
console.log('='.repeat(60));

async function fixBOM() {
  try {
    // 读取原始文件
    const filePath = 'package.json';
    if (!fs.existsSync(filePath)) {
      console.error('❌ package.json 文件不存在');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否有 BOM 字符
    const hasBOM = content.charCodeAt(0) === 0xFEFF;
    console.log(`📄 文件状态: ${hasBOM ? '检测到 BOM 字符' : '无 BOM 字符'}`);
    
    // 移除 BOM 字符
    let cleanContent = content;
    if (hasBOM) {
      cleanContent = content.slice(1);
      console.log('✅ 已移除 BOM 字符');
    }
    
    // 验证 JSON 格式
    try {
      JSON.parse(cleanContent);
      console.log('✅ JSON 格式验证通过');
    } catch (error) {
      console.error('❌ JSON 格式验证失败:', error.message);
      return;
    }
    
    // 写入清理后的文件
    fs.writeFileSync(filePath, cleanContent, 'utf8');
    console.log('✅ 文件已重新写入');
    
    // 验证修复
    const finalContent = fs.readFileSync(filePath, 'utf8');
    const finalHasBOM = finalContent.charCodeAt(0) === 0xFEFF;
    
    if (!finalHasBOM) {
      console.log('🎉 BOM 字符修复完成！');
      console.log('');
      console.log('💡 下一步:');
      console.log('   运行 npm install 安装依赖');
      console.log('   运行 npm run dev 启动开发服务器');
    } else {
      console.error('❌ BOM 字符仍然存在');
    }
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  }
}

// 运行修复
fixBOM();