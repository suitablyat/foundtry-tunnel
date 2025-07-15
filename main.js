const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');
dotenv.config();

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

  // Wenn Fenster geschlossen wird, Tunnel stoppen
  win.on('close', (event) => {
    if (tunnelProcess) {
      event.preventDefault(); // Verhindert sofortiges Schließen

      tunnelKilledByUser = true;
      tunnelProcess.kill();
      tunnelProcess = null;

      // Gib dem Prozess etwas Zeit zum Beenden, dann schließen
      setTimeout(() => {
        win.destroy(); // Fenster dann wirklich schließen
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
    '-R', `${process.env.REMOTE_BIND}:${process.env.REMOTE_PORT}:${process.env.LOCAL_HOST}:${process.env.LOCAL_PORT}`,
    `${process.env.SSH_USER}@${process.env.SSH_HOST}`
  ];
  const args = debug ? ['-vvv', ...baseArgs] : baseArgs;

  win.webContents.send('log-data', `SSH wird gestartet mit:\nssh ${args.join(' ')}\n\n`);

  tunnelProcess = spawn('ssh', args);

  tunnelProcess.stdout.on('data', (data) => {
    win.webContents.send('log-data', data.toString());
  });

  tunnelProcess.stderr.on('data', (data) => {
    win.webContents.send('log-data', data.toString());
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
