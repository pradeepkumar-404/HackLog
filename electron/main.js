const { app, BrowserWindow, shell, dialog, screen, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');
const http = require('http');

const isDev = process.env.NODE_ENV === 'development';

let backendProcess = null;
let mainWindow = null;

const DEFAULT_ZOOM_FACTOR = 1.2;

// Check if backend is already running
async function isBackendRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Get backend paths
function getBackendPaths() {
  if (isDev) {
    const backendDir = path.join(__dirname, '../backend');
    return {
      serverScript: path.join(backendDir, 'server.js'),
      backendDir: backendDir,
      dbPath: path.join(backendDir, 'database.sqlite'),
    };
  } else {
    let backendDir = path.join(process.resourcesPath, 'backend');
    
    if (!fs.existsSync(path.join(backendDir, 'server.js'))) {
      const altPaths = [
        path.join(__dirname, '..', 'backend'),
        path.join(app.getAppPath(), 'backend'),
      ];
      for (const p of altPaths) {
        if (fs.existsSync(path.join(p, 'server.js'))) {
          backendDir = p;
          break;
        }
      }
    }
    
    return {
      serverScript: path.join(backendDir, 'server.js'),
      backendDir: backendDir,
      dbPath: path.join(app.getPath('userData'), 'database.sqlite'),
    };
  }
}

// Start backend server
async function startBackend() {
  const isRunning = await isBackendRunning();
  
  if (isRunning) {
    console.log('[Backend] Already running on port 5000');
    loadFrontend();
    return;
  }

  console.log('[Backend] Starting...');
  const { serverScript, backendDir, dbPath } = getBackendPaths();

  console.log('[Backend] Script:', serverScript);
  console.log('[Backend] Directory:', backendDir);
  console.log('[Backend] Database:', dbPath);

  if (!isDev && !fs.existsSync(app.getPath('userData'))) {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
  }

  if (!fs.existsSync(serverScript)) {
    console.error('[Backend] Script not found:', serverScript);
    dialog.showErrorBox('Error', 'Backend server script not found.');
    app.quit();
    return;
  }

  const env = {
    ...process.env,
    PORT: '5000',
    DB_STORAGE: dbPath,
    NODE_ENV: 'production',
  };

  try {
    backendProcess = fork(serverScript, [], {
      env,
      cwd: backendDir,
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      silent: false,
    });
  } catch (error) {
    console.error('[Backend] Failed to fork:', error);
    dialog.showErrorBox('Backend Error', `Failed to start: ${error.message}`);
    app.quit();
    return;
  }

  let hasStarted = false;
  let startupTimeout;

  backendProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`[Backend] ${output}`);
    
    if (!hasStarted && (output.includes('running') || output.includes('🚀'))) {
      hasStarted = true;
      clearTimeout(startupTimeout);
      console.log('[Backend] Ready, loading frontend...');
      setTimeout(() => loadFrontend(), 1000);
    }
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`[Backend] Exited with code ${code}`);
    backendProcess = null;
    if (!hasStarted && code !== 0 && code !== null) {
      dialog.showErrorBox('Backend Error', `Backend crashed (code ${code}).`);
    }
  });

  backendProcess.on('error', (err) => {
    console.error('[Backend] Error:', err);
    backendProcess = null;
  });

  startupTimeout = setTimeout(() => {
    if (!hasStarted) {
      console.log('[Backend] Timeout - checking...');
      isBackendRunning().then((running) => {
        if (running) {
          console.log('[Backend] Running, loading frontend');
          loadFrontend();
        } else {
          console.error('[Backend] Failed to start');
        }
      });
    }
  }, 15000);
}

// Load the frontend
function loadFrontend() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.error('[Frontend] Window is null');
    return;
  }
  
  console.log('[Frontend] Loading...');
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5001');
  } else {
    // IN PRODUCTION: Load from backend server (which serves frontend files)
    mainWindow.loadURL('http://localhost:5000');
  }
  
  mainWindow.webContents.once('did-finish-load', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('[Frontend] Loaded successfully');
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();
    }
  });
  
  mainWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Frontend] Failed:', errorCode, errorDescription);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });
}

// Create menu
function createMenu() {
  const { Menu } = require('electron');
  
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload', accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.reload()
        },
        { type: 'separator' },
        {
          label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus',
          click: () => mainWindow?.webContents.setZoomFactor(mainWindow.webContents.getZoomFactor() + 0.1)
        },
        {
          label: 'Zoom Out', accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow?.webContents.setZoomFactor(mainWindow.webContents.getZoomFactor() - 0.1)
        },
        {
          label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.setZoomFactor(DEFAULT_ZOOM_FACTOR)
        },
        { type: 'separator' },
        {
          label: 'Toggle DevTools', accelerator: 'F12',
          click: () => mainWindow?.webContents.toggleDevTools()
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' }, { type: 'separator' },
        { role: 'services' }, { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
        { type: 'separator' }, { role: 'quit' }
      ]
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width, height,
    minWidth: 1024, minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      zoomFactor: DEFAULT_ZOOM_FACTOR,
    },
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0d10',
  });

  mainWindow.maximize();
  
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(DEFAULT_ZOOM_FACTOR);
  });

  // IPC handlers
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow) mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  });
  ipcMain.on('window-close', () => mainWindow?.close());
  ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);

  mainWindow.on('maximize', () => mainWindow?.webContents.send('window-state-changed', { isMaximized: true }));
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window-state-changed', { isMaximized: false }));

  // Loading screen
  const loadingHtml = `<!DOCTYPE html><html><head><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0d10;color:#e5e7eb;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column}
    .spinner{width:56px;height:56px;border:4px solid #1f2937;border-top-color:#22c55e;border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:20px}
    @keyframes spin{to{transform:rotate(360deg)}}
    h1{font-size:28px;color:#22c55e;margin-bottom:8px}
    p{color:#6b7280;font-size:14px}
  </style></head><body>
    <div class="spinner"></div>
    <h1>HackLog</h1>
    <p>Starting...</p>
  </body></html>`;
  
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(loadingHtml));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
  
  createMenu();
}

// App lifecycle
app.whenReady().then(async () => {
  app.setName('HackLog');
  createWindow();
  await startBackend();
});

app.on('window-all-closed', () => {
  cleanupBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

app.on('before-quit', () => cleanupBackend());

function cleanupBackend() {
  if (backendProcess && !backendProcess.killed) {
    try {
      backendProcess.kill('SIGTERM');
      setTimeout(() => {
        if (backendProcess && !backendProcess.killed) backendProcess.kill('SIGKILL');
      }, 2000);
    } catch (e) {}
  }
}

process.on('SIGINT', () => { cleanupBackend(); app.quit(); });
process.on('SIGTERM', () => { cleanupBackend(); app.quit(); });
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (error.code === 'ENOENT') {
    dialog.showErrorBox('Startup Error', error.message);
    app.quit();
  }
});