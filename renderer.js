const toggleBtn = document.getElementById('toggleBtn');
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const debugCheckbox = document.getElementById('debugMode');

let tunnelRunning = false;
let lastClosedCode = undefined;

toggleBtn.addEventListener('click', () => {
  if (!tunnelRunning) {
    clearLog();
    log('🔄 Tunnel wird gestartet...');
    window.electronAPI.startTunnel({
      debug: debugCheckbox.checked
    });
    lastClosedCode = undefined;
    debugCheckbox.disabled = true;
  } else {
    log('🛑 Tunnel wird gestoppt...');
    window.electronAPI.stopTunnel();
  }
});

window.electronAPI.onTunnelStarted(() => {
  tunnelRunning = true;
  statusEl.textContent = '🟢 Tunnel aktiv';
  toggleBtn.textContent = 'Tunnel stoppen';
});

window.electronAPI.onTunnelClosed(({ code, killedByUser }) => {
  if (code === lastClosedCode) return;
  lastClosedCode = code;

  tunnelRunning = false;
  statusEl.textContent = '🔴 Tunnel aus';
  toggleBtn.textContent = 'Tunnel starten';
  debugCheckbox.disabled = false;

  if (killedByUser) {
    log('✅ Tunnel wurde manuell beendet.');
  } else if (code === 0) {
    log('✅ Tunnel hat sich regulär beendet.');
  } else {
    log(`❌ Tunnel wurde unerwartet beendet (Code: ${code ?? 'null'}).`);
  }
});

window.electronAPI.onLogData((data) => {
  formatAndLog(data);
});

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