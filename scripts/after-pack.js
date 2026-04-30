const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = async function afterPack(context) {
  const appOutDir = context.appOutDir;
  const arch = context.arch;
  const archName = arch === 3 ? 'arm64' : arch === 1 ? 'x64' : arch === 0 ? 'ia32' : String(arch);
  const platform = context.packager.platform.name;

  const electronVersion =
    context.electronVersion ||
    context.packager?.config?.electronVersion ||
    require(path.join(process.cwd(), 'node_modules', 'electron', 'package.json')).version;

  console.log(`[afterPack] Electron ${electronVersion}, arch=${archName}, platform=${platform}`);

  const projectDir = process.cwd();
  console.log('[afterPack] Rebuilding better-sqlite3 for Electron ABI...');

  try {
    const rebuildCmd = `npx electron-rebuild -f -o better-sqlite3 -v ${electronVersion} -a ${archName}`;
    console.log(`[afterPack] Running: ${rebuildCmd}`);
    execSync(rebuildCmd, {
      cwd: projectDir,
      stdio: 'inherit',
      timeout: 120000,
    });
    console.log('[afterPack] Rebuild completed successfully');
  } catch (err) {
    console.error('[afterPack] Failed to rebuild better-sqlite3:', err.message);
    try {
      const { rebuild } = require('@electron/rebuild');
      await rebuild({
        buildPath: projectDir,
        electronVersion: electronVersion,
        arch: archName,
        onlyModules: ['better-sqlite3'],
        force: true,
      });
      console.log('[afterPack] Rebuild via @electron/rebuild API succeeded');
    } catch (err2) {
      console.error('[afterPack] @electron/rebuild API also failed:', err2.message);
      throw new Error('Cannot rebuild better-sqlite3 for Electron ABI');
    }
  }

  const rebuiltSource = path.join(
    projectDir, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'
  );

  if (!fs.existsSync(rebuiltSource)) {
    throw new Error(`[afterPack] Rebuilt better_sqlite3.node not found at ${rebuiltSource}`);
  }

  const sourceStats = fs.statSync(rebuiltSource);
  console.log(`[afterPack] Rebuilt .node file: ${rebuiltSource} (${sourceStats.size} bytes)`);

  const searchRoots = [
    path.join(appOutDir, 'NightShift.app', 'Contents', 'Resources', 'standalone'),
    path.join(appOutDir, 'Contents', 'Resources', 'standalone'),
    path.join(appOutDir, 'resources', 'standalone'),
  ];

  let replaced = 0;

  function walkAndReplace(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkAndReplace(fullPath);
      } else if (entry.name === 'better_sqlite3.node') {
        const beforeSize = fs.statSync(fullPath).size;
        fs.copyFileSync(rebuiltSource, fullPath);
        const afterSize = fs.statSync(fullPath).size;
        console.log(`[afterPack] Replaced ${fullPath} (${beforeSize} -> ${afterSize} bytes)`);
        replaced++;
      }
    }
  }

  for (const root of searchRoots) {
    walkAndReplace(root);
  }

  if (replaced > 0) {
    console.log(`[afterPack] Replaced ${replaced} better_sqlite3.node file(s)`);
  } else {
    console.warn('[afterPack] WARNING: No better_sqlite3.node files found in standalone resources!');
  }
};
