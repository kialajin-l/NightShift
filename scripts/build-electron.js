const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  const buildPatch = path.join(ROOT, '_build_patch.js').replace(/\\/g, '/');
  const defaultNodeOptions = `--max-old-space-size=20480 --require ${JSON.stringify(buildPatch)}`;
  const nodeOptions = process.env.NODE_OPTIONS || defaultNodeOptions;
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production', NODE_OPTIONS: nodeOptions } });
}

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`  cleaned: ${path.relative(ROOT, dir)}`);
  }
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function buildElectronCode() {
  const distDir = path.join(ROOT, 'electron-dist');
  rmrf(distDir);
  mkdirp(distDir);

  fs.copyFileSync(
    path.join(ROOT, 'electron', 'main.js'),
    path.join(distDir, 'main.js')
  );
  fs.copyFileSync(
    path.join(ROOT, 'electron', 'preload.js'),
    path.join(distDir, 'preload.js')
  );
  console.log('  copied electron files to electron-dist/');
}

function assertStandaloneBuild() {
  const required = [
    path.join(ROOT, '.next', 'BUILD_ID'),
    path.join(ROOT, '.next', 'standalone', 'server.js'),
    path.join(ROOT, '.next', 'static'),
  ];

  const missing = required.filter((item) => !fs.existsSync(item));
  if (missing.length > 0) {
    throw new Error(`Next standalone build is incomplete. Missing: ${missing.map((item) => path.relative(ROOT, item)).join(', ')}`);
  }
}

try {
  console.log('\n=== Step 1: Ensure next.config.js exists ===');
  const configJs = path.join(ROOT, 'next.config.js');
  if (!fs.existsSync(configJs)) {
    const tempConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      '@lobehub/ui': false,
      'antd': false,
      'antd-style': false,
    };
    return config;
  },
};
module.exports = nextConfig;`;
    fs.writeFileSync(configJs, tempConfig);
    console.log('  created next.config.js');
  } else {
    console.log('  next.config.js already exists');
  }

  console.log('\n=== Step 2: Build Next.js standalone app ===');
  rmrf(path.join(ROOT, '.next'));
  run('npx next build');
  assertStandaloneBuild();

  console.log('\n=== Step 3: Build Electron code ===');
  buildElectronCode();

  console.log('\n=== Step 4: Prepare optional resources ===');
  mkdirp(path.join(ROOT, 'themes'));

  console.log('\n=== Step 5: electron-builder ===');
  const builderArgs = process.argv.slice(2).join(' ');
  run(`npx electron-builder --win ${builderArgs}`);

  console.log('\n✅ Build complete!');
} catch (err) {
  console.error('\n❌ Build failed:', err.message);
  process.exit(1);
}
