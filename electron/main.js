const { app, BrowserWindow, shell, screen, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');
const http = require('http');

const isDev = process.env.NODE_ENV === 'development';
let backendProcess = null;
let mainWindow = null;
const DEFAULT_ZOOM_FACTOR = 1.2;

async function isBackendRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/health', (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

function getBackendPaths() {
  if (isDev) {
    const dir = path.join(__dirname, '../backend');
    return { script: path.join(dir, 'server.js'), cwd: dir, db: path.join(dir, 'database.sqlite') };
  }
  let dir = path.join(process.resourcesPath, 'backend');
  if (!fs.existsSync(path.join(dir, 'server.js'))) {
    dir = path.join(__dirname, '..', 'backend');
  }
  return { script: path.join(dir, 'server.js'), cwd: dir, db: path.join(app.getPath('userData'), 'database.sqlite') };
}

async function startBackend() {
  if (await isBackendRunning()) { loadFrontend(); return; }
  
  const { script, cwd, db } = getBackendPaths();
  if (!isDev && !fs.existsSync(app.getPath('userData'))) fs.mkdirSync(app.getPath('userData'), { recursive: true });
  
  if (!fs.existsSync(script)) { loadFrontend(); return; }

  backendProcess = fork(script, [], {
    env: { ...process.env, PORT: '5000', DB_STORAGE: db, NODE_ENV: 'production' },
    cwd, stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });

  let loaded = false;
  backendProcess.stdout.on('data', (data) => {
    const msg = data.toString().trim();
    console.log('[Backend]', msg);
    if (!loaded && (msg.includes('running') || msg.includes('🚀'))) {
      loaded = true;
      setTimeout(loadFrontend, 1000);
    }
  });
  backendProcess.stderr.on('data', (data) => console.error('[Backend]', data.toString().trim()));
  setTimeout(() => { if (!loaded) loadFrontend(); }, 15000);
}

function loadFrontend() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (isDev) mainWindow.loadURL('http://localhost:5001');
  else mainWindow.loadURL('http://localhost:5000');
  
  mainWindow.webContents.once('did-finish-load', () => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show(); mainWindow.focus();
    }
  });
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width, height, minWidth: 1024, minHeight: 768,
    webPreferences: { 
      nodeIntegration: false, 
      contextIsolation: true, 
      preload: path.join(__dirname, 'preload.js'), 
      zoomFactor: DEFAULT_ZOOM_FACTOR 
    },
    show: false, 
    frame: false, 
    titleBarStyle: 'hidden', 
    backgroundColor: '#0a0d10',
  });
  mainWindow.maximize();
  mainWindow.loadURL('data:text/html,<html><body style="background:#0a0d10;color:#e5e7eb;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh"><div style="text-align:center"><h2 style="color:#22c55e">HackLog</h2><p>Starting...</p></div></body></html>');
  
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => mainWindow && (mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()));
  ipcMain.on('window-close', () => mainWindow?.close());
  ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);
  mainWindow.on('maximize', () => mainWindow?.webContents.send('window-state-changed', { isMaximized: true }));
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window-state-changed', { isMaximized: false }));
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith('http')) shell.openExternal(url); return { action: 'deny' }; });
}

const { Menu } = require('electron');
Menu.setApplicationMenu(Menu.buildFromTemplate([
  { label: 'File', submenu: [{ label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }] },
  { label: 'View', submenu: [{ label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() }, { label: 'DevTools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() }] }
]));

app.whenReady().then(async () => { 
  app.setName('HackLog'); 
  createWindow(); 
  await startBackend(); 
});

app.on('window-all-closed', () => { 
  if (backendProcess && !backendProcess.killed) backendProcess.kill(); 
  if (process.platform !== 'darwin') app.quit(); 
});

app.on('before-quit', () => { 
  if (backendProcess && !backendProcess.killed) backendProcess.kill(); 
});

app.on('activate', () => { 
  if (!mainWindow) createWindow(); 
});