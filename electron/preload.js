// NightShift Electron 预加载脚本

const { contextBridge, ipcRenderer } = require('electron');

const isDev = !!process.defaultApp;

/**
 * 向渲染进程暴露安全的API
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作API
  fileSystem: {
    /**
     * 保存文件
     */
    saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),
    
    /**
     * 读取文件
     */
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    
    /**
     * 选择文件
     */
    selectFile: (options) => ipcRenderer.invoke('select-file', options),
    
    /**
     * 选择文件夹
     */
    selectFolder: (options) => ipcRenderer.invoke('select-folder', options)
  },

  // 对话框API
  dialog: {
    /**
     * 显示消息框
     */
    showMessage: (options) => ipcRenderer.invoke('show-message', options)
  },

  // 系统API
  system: {
    /**
     * 打开外部链接
     */
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    
    /**
     * 获取应用信息
     */
    getAppInfo: () => ipcRenderer.invoke('get-app-info')
  },

  // 菜单事件监听
  menu: {
    /**
     * 监听新建项目菜单事件
     */
    onNewProject: (callback) => ipcRenderer.on('menu-new-project', callback),
    
    /**
     * 监听打开项目菜单事件
     */
    onOpenProject: (callback) => ipcRenderer.on('menu-open-project', callback),
    
    /**
     * 移除菜单事件监听器
     */
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
  },

  // 平台信息
  platform: process.platform,
  
  // 版本信息
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

/**
 * 向渲染进程暴露开发工具标志
 */
contextBridge.exposeInMainWorld('isDev', isDev);

/**
 * 日志工具
 */
contextBridge.exposeInMainWorld('logger', {
  info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
  error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
  debug: (message, ...args) => {
    if (isDev) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
});
