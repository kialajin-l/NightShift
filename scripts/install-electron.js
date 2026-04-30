#!/usr/bin/env node

/**
 * NightShift Electron 安装脚本
 * 解决网络连接问题和依赖安装问题
 */

const { execSync } = require('child_process');
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

function warn(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

/**
 * 检查是否已安装依赖
 */
function checkDependencies() {
  const dependencies = ['concurrently', 'wait-on', 'electron', 'electron-builder', 'electron-is-dev'];
  
  for (const dep of dependencies) {
    try {
      require.resolve(dep);
      success(`依赖 ${dep} 已安装`);
    } catch (err) {
      warn(`依赖 ${dep} 未安装`);
      return false;
    }
  }
  
  return true;
}

/**
 * 使用淘宝镜像安装依赖
 */
function installWithTaobaoMirror() {
  log('使用淘宝镜像安装依赖...', 'cyan');
  
  try {
    // 设置淘宝镜像
    execSync('npm config set registry https://registry.npmmirror.com', { stdio: 'inherit' });
    
    // 安装基础依赖
    execSync('npm install concurrently@8.0.0 wait-on@7.0.0 --save-dev', { stdio: 'inherit' });
    
    success('基础依赖安装完成');
    return true;
  } catch (err) {
    error('使用淘宝镜像安装失败');
    return false;
  }
}

/**
 * 手动下载Electron
 */
function downloadElectronManually() {
  log('手动下载Electron...', 'cyan');
  
  try {
    // 创建临时目录
    const tempDir = path.join(__dirname, '..', 'temp-electron');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // 下载Electron二进制文件
    const electronVersion = '28.0.0';
    const platform = process.platform;
    const arch = process.arch;
    
    let downloadUrl = '';
    
    if (platform === 'win32') {
      downloadUrl = `https://npmmirror.com/mirrors/electron/${electronVersion}/electron-v${electronVersion}-win32-${arch}.zip`;
    } else if (platform === 'darwin') {
      downloadUrl = `https://npmmirror.com/mirrors/electron/${electronVersion}/electron-v${electronVersion}-darwin-${arch}.zip`;
    } else if (platform === 'linux') {
      downloadUrl = `https://npmmirror.com/mirrors/electron/${electronVersion}/electron-v${electronVersion}-linux-${arch}.zip`;
    }
    
    if (downloadUrl) {
      info(`下载Electron: ${downloadUrl}`);
      
      // 使用curl或wget下载（需要系统支持）
      try {
        execSync(`curl -L -o electron.zip "${downloadUrl}"`, { stdio: 'inherit', cwd: tempDir });
      } catch (curlErr) {
        try {
          execSync(`wget -O electron.zip "${downloadUrl}"`, { stdio: 'inherit', cwd: tempDir });
        } catch (wgetErr) {
          warn('无法使用curl或wget下载，请手动下载Electron');
          return false;
        }
      }
      
      success('Electron下载完成');
      return true;
    } else {
      error('不支持的平台');
      return false;
    }
  } catch (err) {
    error(`手动下载Electron失败: ${err.message}`);
    return false;
  }
}

/**
 * 安装Electron相关依赖
 */
function installElectronDeps() {
  log('安装Electron相关依赖...', 'cyan');
  
  try {
    // 尝试使用不同的安装方法
    const methods = [
      // 方法1: 使用淘宝镜像
      () => {
        execSync('npm config set registry https://registry.npmmirror.com', { stdio: 'inherit' });
        execSync('npm install electron@28.0.0 electron-builder@24.0.0 electron-is-dev@2.0.0 --save-dev', { stdio: 'inherit' });
      },
      
      // 方法2: 使用官方源但设置超时
      () => {
        execSync('npm config set registry https://registry.npmjs.org', { stdio: 'inherit' });
        execSync('npm install electron@28.0.0 electron-builder@24.0.0 electron-is-dev@2.0.0 --save-dev --fetch-timeout 600000', { stdio: 'inherit' });
      },
      
      // 方法3: 分别安装
      () => {
        execSync('npm install electron@28.0.0 --save-dev --fetch-timeout 300000', { stdio: 'inherit' });
        execSync('npm install electron-builder@24.0.0 --save-dev', { stdio: 'inherit' });
        execSync('npm install electron-is-dev@2.0.0 --save-dev', { stdio: 'inherit' });
      }
    ];
    
    for (let i = 0; i < methods.length; i++) {
      try {
        info(`尝试安装方法 ${i + 1}...`);
        methods[i]();
        success('Electron依赖安装成功');
        return true;
      } catch (err) {
        warn(`安装方法 ${i + 1} 失败: ${err.message}`);
        if (i === methods.length - 1) {
          error('所有安装方法都失败了');
          return false;
        }
      }
    }
  } catch (err) {
    error(`安装Electron依赖失败: ${err.message}`);
    return false;
  }
}

/**
 * 创建简化的打包脚本（不依赖Electron）
 */
function createSimpleBuildScript() {
  log('创建简化的打包脚本...', 'cyan');
  
  const scriptContent = `#!/usr/bin/env node

/**
 * NightShift 简化打包脚本
 * 用于在没有Electron的情况下进行基础构建测试
 */

const { execSync } = require('child_process');

console.log('🚀 NightShift 简化构建开始');

try {
  // 构建Next.js应用
  console.log('📦 构建Next.js应用...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // 检查构建输出
  console.log('✅ Next.js应用构建完成');
  console.log('📁 构建输出位于: dist/');
  
  console.log('🎉 简化构建完成！');
  console.log('💡 提示: Electron依赖安装失败，但基础构建已完成');
  console.log('💡 您可以手动下载Electron或使用其他安装方法');
  
} catch (err) {
  console.error('❌ 构建失败:', err.message);
  process.exit(1);
}
`;
  
  const scriptPath = path.join(__dirname, '..', 'scripts', 'build-simple.js');
  fs.writeFileSync(scriptPath, scriptContent);
  fs.chmodSync(scriptPath, '755');
  
  // 更新package.json脚本
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.scripts['build:simple'] = 'node scripts/build-simple.js';
  packageJson.scripts['dev:simple'] = 'npm run dev';
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  
  success('简化打包脚本创建完成');
}

/**
 * 主安装函数
 */
async function main() {
  log('🚀 NightShift Electron 安装脚本', 'cyan');
  log('='.repeat(50));
  
  try {
    // 1. 检查依赖
    info('检查依赖状态...');
    const depsInstalled = checkDependencies();
    
    if (depsInstalled) {
      success('所有依赖已安装！');
      return;
    }
    
    // 2. 安装基础依赖
    info('安装基础依赖...');
    const baseDepsSuccess = installWithTaobaoMirror();
    
    if (!baseDepsSuccess) {
      warn('基础依赖安装失败，继续尝试安装Electron...');
    }
    
    // 3. 安装Electron依赖
    info('安装Electron依赖...');
    const electronSuccess = installElectronDeps();
    
    if (!electronSuccess) {
      warn('Electron依赖安装失败，创建简化构建脚本...');
      
      // 4. 创建简化构建脚本
      createSimpleBuildScript();
      
      info('💡 建议:');
      info('1. 手动下载Electron: https://electronjs.org/');
      info('2. 使用VPN或代理解决网络问题');
      info('3. 使用简化构建脚本进行基础测试');
    } else {
      success('🎉 所有依赖安装完成！');
    }
    
    log('='.repeat(50));
    
  } catch (err) {
    error(`安装过程出错: ${err.message}`);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(err => {
    error(`安装失败: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkDependencies,
  installWithTaobaoMirror,
  installElectronDeps
};