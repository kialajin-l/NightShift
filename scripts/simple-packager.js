const fs = require('fs');
const path = require('path');

console.log('🚀 开始打包NightShift应用...');

// 检查out目录是否存在（静态导出目录）
const outDir = path.join(__dirname, '..', 'out');
if (!fs.existsSync(outDir)) {
  console.error('❌ out目录不存在，请先运行npm run build');
  process.exit(1);
}

// 创建输出目录
const outputDir = path.join(__dirname, '..', 'dist-electron');
if (fs.existsSync(outputDir)) {
  console.log('🗑️  清理旧的输出目录...');
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

// 复制electron目录
console.log('📁 复制Electron配置文件...');
const electronDir = path.join(__dirname, '..', 'electron');
if (fs.existsSync(electronDir)) {
  const copyRecursiveSync = (src, dest) => {
    if (fs.existsSync(src)) {
      const stats = fs.statSync(src);
      if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach(childItemName => {
          copyRecursiveSync(
            path.join(src, childItemName),
            path.join(dest, childItemName)
          );
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    }
  };
  copyRecursiveSync(electronDir, path.join(outputDir, 'electron'));
}

// 复制out目录（静态导出文件）
console.log('📁 复制静态文件...');
const copyRecursiveSync = (src, dest) => {
  if (fs.existsSync(src)) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }
      fs.readdirSync(src).forEach(childItemName => {
        copyRecursiveSync(
          path.join(src, childItemName),
          path.join(dest, childItemName)
        );
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
};

copyRecursiveSync(outDir, path.join(outputDir, 'out'));

// 复制package.json
console.log('📁 复制package.json...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  // 修改main入口
  packageJson.main = 'electron/main.js';
  // 移除开发依赖
  delete packageJson.devDependencies;
  delete packageJson.scripts;
  delete packageJson.workspaces;
  fs.writeFileSync(
    path.join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

console.log('\n✅ 打包完成！');
console.log(`📂 输出目录: ${outputDir}`);
console.log('\n🎯 使用方法:');
console.log('1. 安装Electron: npm install -g electron');
console.log('2. 运行应用: cd dist-electron && electron .');
console.log('3. 或使用npx: cd dist-electron && npx electron .');