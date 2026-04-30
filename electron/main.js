const { app, BrowserWindow, Menu, ipcMain, dialog, shell, utilityProcess } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');

let mainWindow = null;
let serverProcess = null;
let serverPort = null;

const isDev = !app.isPackaged;

const STABLE_PORTS = [47831, 47832, 47833, 47834, 47835, 47836, 47837, 47838];

const LOADING_HTML = `data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #0a0a0a; color: #a0a0a0;
    -webkit-app-region: drag;
  }
  .container { text-align: center; }
  .spinner {
    width: 28px; height: 28px; margin: 0 auto 14px;
    border: 2.5px solid rgba(255,255,255,0.1);
    border-top-color: rgba(255,255,255,0.5);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  p { font-size: 13px; opacity: 0.7; }
</style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p>NightShift 启动中...</p>
  </div>
</body>
</html>`)}`;

function getIconPath() {
  if (isDev) {
    return path.join(__dirname, 'assets', 'icon.png');
  }
  return path.join(process.resourcesPath, 'icon.png');
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
  });
}

function getStandaloneDir() {
  if (isDev) {
    return path.join(__dirname, '..');
  }
  return path.join(process.resourcesPath, 'standalone');
}

function sanitizedProcessEnv() {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('__NEXT_PRIVATE_') && value !== undefined) {
      env[key] = value;
    }
  }
  return env;
}

function startStandaloneServer(port) {
  const standaloneDir = getStandaloneDir();
  const serverPath = path.join(standaloneDir, 'server.js');

  console.log(`[server] Standalone dir: ${standaloneDir}`);
  console.log(`[server] process.resourcesPath: ${process.resourcesPath}`);
  console.log(`[server] __dirname: ${__dirname}`);
  console.log(`[server] Starting on port ${port}`);

  if (!fs.existsSync(serverPath)) {
    throw new Error(`Standalone server not found at ${serverPath}. Run npm run electron:build after a successful next build.`);
  }

  const child = utilityProcess.fork(serverPath, [], {
    cwd: standaloneDir,
    env: {
      ...sanitizedProcessEnv(),
      NODE_ENV: 'production',
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
    },
    serviceName: 'nightshift-next-server',
    stdio: 'pipe',
  });

  child.stdout?.on('data', (data) => console.log(`[server] ${data.toString().trim()}`));
  child.stderr?.on('data', (data) => console.error(`[server:err] ${data.toString().trim()}`));
  child.once('exit', (code) => {
    console.log(`[server] Exited with code ${code}`);
    serverProcess = null;
  });

  return child;
}

function waitForHealth(port, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const check = () => {
      if (Date.now() - started > timeout) {
        reject(new Error(`Server did not return /api/health within ${timeout}ms`));
        return;
      }

      const req = net.createConnection({ host: '127.0.0.1', port }, () => {
        req.write('GET /api/health HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n');
      });

      let response = '';
      req.on('data', (chunk) => {
        response += chunk.toString();
      });
      req.on('end', () => {
        if (/^HTTP\/1\.[01] 200\b/.test(response)) {
          resolve(port);
        } else {
          setTimeout(check, 500);
        }
      });
      req.on('error', () => setTimeout(check, 500));
      req.setTimeout(1000, () => {
        req.destroy();
        setTimeout(check, 500);
      });
    };

    check();
  });
}

async function startServerOnStablePort() {
  for (const candidate of STABLE_PORTS) {
    if (!(await isPortFree(candidate))) {
      console.log(`[port] ${candidate} is in use, trying next`);
      continue;
    }

    console.log(`[port] Trying stable port ${candidate}...`);
    serverProcess = startStandaloneServer(candidate);
    try {
      await waitForHealth(candidate);
      console.log(`[port] Bound stable port ${candidate}`);
      return candidate;
    } catch (err) {
      console.warn(`[port] Port ${candidate} failed: ${err.message}`);
      killServer();
    }
  }

  throw new Error('All stable ports failed');
}

function killServer() {
  if (!serverProcess) {
    return;
  }

  try {
    serverProcess.kill();
  } catch {
    // already stopped
  } finally {
    serverProcess = null;
  }
}

function createWindow(url) {
  const windowOptions = {
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 600,
    icon: getIconPath(),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  };

  if (process.platform === 'darwin') {
    windowOptions.titleBarStyle = 'hiddenInset';
    windowOptions.vibrancy = 'sidebar';
  } else if (process.platform === 'win32') {
    windowOptions.titleBarStyle = 'hidden';
    windowOptions.titleBarOverlay = {
      color: '#00000000',
      symbolColor: '#888888',
      height: 44,
    };
  }

  mainWindow = new BrowserWindow(windowOptions);

  Menu.setApplicationMenu(null);

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      shell.openExternal(targetUrl);
      return { action: 'deny' };
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    const appOrigin = new URL(mainWindow.webContents.getURL()).origin;
    if (new URL(targetUrl).origin !== appOrigin) {
      event.preventDefault();
      shell.openExternal(targetUrl);
    }
  });

  mainWindow.loadURL(url || LOADING_HTML);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  if (isDev) {
    createWindow('http://localhost:3000');
  } else {
    try {
      serverPort = await startServerOnStablePort();
      const url = `http://127.0.0.1:${serverPort}`;
      createWindow(url);
    } catch (err) {
      console.error('Failed to start server:', err);
      createWindow(LOADING_HTML);
      dialog.showErrorBox(
        'Startup Error',
        `Failed to start the application server:\n${err.message}`
      );
    }
  }
});

app.on('window-all-closed', () => {
  killServer();
  app.quit();
});

app.on('before-quit', () => {
  killServer();
});

app.on('activate', () => {
  if (mainWindow === null) {
    const url = serverPort ? `http://127.0.0.1:${serverPort}` : undefined;
    createWindow(url);
  }
});

ipcMain.handle('get-server-port', () => serverPort);
