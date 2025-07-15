const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startTunnel: (options) => ipcRenderer.send('start-tunnel', options),
  stopTunnel: () => ipcRenderer.send('stop-tunnel'),
  onTunnelStarted: (callback) => ipcRenderer.on('tunnel-started', callback),
  onTunnelClosed: (callback) => ipcRenderer.on('tunnel-closed', (event, data) => callback(data)),
  onLogData: (callback) => ipcRenderer.on('log-data', (event, data) => callback(data)),
});