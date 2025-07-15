const toggleBtn = document.getElementById('toggleBtn');
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const debugCheckbox = document.getElementById('debugMode');

let tunnelRunning = false;
let lastClosedCode = undefined;

toggleBtn.addEventListener('click', () => {
  if (!tunnelRunning) {
    clearLog();
    log('🔄 Starting tunnel...');
    window.electronAPI.startTunnel({
      debug: debugCheckbox.checked
    });
    lastClosedCode = undefined;
    debugCheckbox.disabled = true;
  } else {
    log('🛑 Stopping tunnel...');
    window.electronAPI.stopTunnel();
  }
});

window.electronAPI.onTunnelStarted(() => {
  tunnelRunning = true;
  statusEl.textContent = '🟢 Tunnel active';
  toggleBtn.textContent = 'Stop Tunnel';
});

window.electronAPI.onTunnelClosed(({ code, killedByUser }) => {
  if (code === lastClosedCode) return;
  lastClosedCode = code;

  tunnelRunning = false;
  statusEl.textContent = '🔴 Tunnel inactive';
  toggleBtn.textContent = 'Start Tunnel';
  debugCheckbox.disabled = false;

  if (killedByUser) {
    log('✅ Tunnel was stopped manually.');
  } else if (code === 0) {
    log('✅ Tunnel exited cleanly.');
  } else {
    log(`❌ Tunnel exited unexpectedly (Code: ${code ?? 'null'}).`);
  }
});

window.electronAPI.onLogData((data) => {
  formatAndLog(data);
});

window.onerror = function (msg, url, lineNo, columnNo, error) {
  log(`JS Error: ${msg} in ${url} [${lineNo}:${columnNo}]`);
};

function formatAndLog(text) {
  const lines = text.split('\n');
  lines.forEach((line) => {
    if (!line.trim()) return;

    if (line.includes('debug')) {
      log(`🧩 ${line}`);
    } else if (line.includes('Connection') || line.includes('forwarding')) {
      log(`🔗 ${line}`);
    } else if (line.includes('error') || line.toLowerCase().includes('failed')) {
      log(`❌ ${line}`);
    } else {
      log(line);
    }
  });
}

function log(message) {
  const time = new Date().toLocaleTimeString();
  logEl.textContent += `[${time}] ${message}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() {
  logEl.textContent = '';
}