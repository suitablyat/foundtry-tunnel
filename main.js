const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const env = require('./env');

let tunnelProcess = null;
let tunnelKilledByUser = false;

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 580,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: true
  });

  win.setMenu(null);
  win.loadFile('index.html');

  win.on('close', (event) => {
    if (tunnelProcess) {
      event.preventDefault();

      tunnelKilledByUser = true;
      tunnelProcess.kill();
      tunnelProcess = null;

      setTimeout(() => {
        win.destroy();
      }, 300);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function startTunnel(win, debug = false) {
  tunnelKilledByUser = false;

  const baseArgs = [
    '-N',
    '-R', `${env.REMOTE_BIND}:${env.REMOTE_PORT}:${env.LOCAL_HOST}:${env.LOCAL_PORT}`,
    `${env.SSH_USER}@${env.SSH_HOST}`
  ];
  const args = debug ? ['-vvv', ...baseArgs] : baseArgs;

  win.webContents.send('log-data', `Starting SSH with:\nssh ${args.join(' ')}\n\n`);

  tunnelProcess = spawn('ssh', args);

  tunnelProcess.stdout.on('data', (data) => {
    win.webContents.send('log-data', data.toString());
  });

  tunnelProcess.stderr.on('data', (data) => {
    win.webContents.send('log-data', data.toString());
  });
  
  tunnelProcess.on('error', (err) => {
    win.webContents.send('log-data', `❌ Fehler beim Start des Tunnels: ${err.message}`);
  });

  tunnelProcess.on('close', (code) => {
    win.webContents.send('tunnel-closed', {
      code,
      killedByUser: tunnelKilledByUser
    });
  });

  win.webContents.send('tunnel-started');
}

function stopTunnel(win) {
  if (tunnelProcess) {
    tunnelKilledByUser = true;
    tunnelProcess.kill();
    tunnelProcess = null;
  }
}

ipcMain.on('start-tunnel', (event, options) => {
  const win = BrowserWindow.getFocusedWindow();
  startTunnel(win, options?.debug === true);
});

ipcMain.on('stop-tunnel', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  stopTunnel(win);
});
