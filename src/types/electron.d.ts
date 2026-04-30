interface ElectronUpdaterAPI {
  checkForUpdates: () => Promise<unknown>;
  downloadUpdate: () => Promise<unknown>;
  quitAndInstall: () => Promise<void>;
  onStatus: (callback: (data: {
    status: string;
    info?: {
      version?: string;
      releaseNotes?: string | { version: string; note: string }[] | null;
      releaseName?: string | null;
      releaseDate?: string;
    };
    progress?: { percent: number };
    error?: string;
  }) => void) => () => void;
}

interface ElectronTerminalAPI {
  create: (opts: { id: string; cwd: string; cols: number; rows: number }) => Promise<void>;
  write: (id: string, data: string) => void;
  resize: (id: string, cols: number, rows: number) => Promise<void>;
  kill: (id: string) => Promise<void>;
  onData: (callback: (data: { id: string; data: string }) => void) => () => void;
  onExit: (callback: (data: { id: string; code: number }) => void) => () => void;
}

interface ElectronAPI {
  updater?: ElectronUpdaterAPI;
  terminal?: ElectronTerminalAPI;
  fs?: {
    getPathForFile: (file: File) => string;
  };
  dialog?: {
    openFolder: (options?: { defaultPath?: string; title?: string }) => Promise<{ canceled: boolean; filePaths: string[] }>;
  };
  notification?: {
    show: (options: { title: string; body?: string; onClick?: string }) => Promise<void>;
    onClick: (listener: (action: string) => void) => () => void;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
