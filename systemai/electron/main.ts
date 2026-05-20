import path from 'node:path';
import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron';
import { initDatabase } from './db';
import { registerIpcHandlers } from './ipcHandlers';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let autoStartEnabled = false;

/** Applies OS login item settings. */
const setAutoStart = (enabled: boolean): void => {
  autoStartEnabled = enabled;
  app.setLoginItemSettings({ openAtLogin: enabled });
};

const getAutoStart = (): boolean => autoStartEnabled;

const createMainWindow = (): BrowserWindow => {
  const window = new BrowserWindow({
    width: 1520,
    height: 920,
    minWidth: 1280,
    minHeight: 760,
    webPreferences: {
      preload: path.join(__dirname, 'preload.ts'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    },
    backgroundColor: '#020617',
    title: 'SYSTEMAI.EXE'
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    window.loadURL('http://localhost:5173');
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    window.loadFile(path.resolve(process.cwd(), 'dist/index.html'));
  }

  window.on('closed', () => {
    mainWindow = null;
  });

  return window;
};

const createTray = (): void => {
  const iconPath = path.resolve(process.cwd(), 'systemai/docs/tray-icon.png');
  const image = nativeImage.createFromPath(iconPath);
  tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open SYSTEMAI',
      click: () => {
        if (!mainWindow) {
          mainWindow = createMainWindow();
        }
        mainWindow.show();
      }
    },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);
  tray.setToolTip('SYSTEMAI.EXE');
  tray.setContextMenu(contextMenu);
};

app.whenReady().then(() => {
  const db = initDatabase(path.resolve(process.cwd(), 'systemai/database'));
  registerIpcHandlers(db, setAutoStart, getAutoStart);

  mainWindow = createMainWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
