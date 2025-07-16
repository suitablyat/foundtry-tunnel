<script>
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';
  
  let tunnelRunning = false;
  let log = '';
  let debug = false;
  let validationError = '';

  // Lokale Werte für Bindings
  let SSH_HOST = '';
  let SSH_USER = '';
  let REMOTE_BIND = '';
  let REMOTE_PORT = '';
  let LOCAL_HOST = '';
  let LOCAL_PORT = '';

  // Beim Laden: Werte aus Store übernehmen
  onMount(async () => {
    SSH_HOST = 'foundry.lappenbande.de';
    SSH_USER = 'foundryuser';
    REMOTE_BIND = '127.0.0.1';
    REMOTE_PORT = '31000';
    LOCAL_HOST = 'localhost';
    LOCAL_PORT = '30000';
	
    await listen('log', event => {
      log += `[${new Date().toLocaleTimeString()}] ${event.payload}\n`;
    });
    await listen('tunnel_error', async (event) => {
      log += `[${new Date().toLocaleTimeString()}] ❌ Fehler: ${event.payload}\n`;
      await stopTunnelFrontend();
    });
  });
  
  async function toggleTunnel() {
    if (!tunnelRunning) {
      log = `[${new Date().toLocaleTimeString()}] 🔄 Starting tunnel...\n`;
      try {
        await invoke('start_tunnel', {
          config: {
            ssh_host: SSH_HOST.trim(),
            ssh_user: SSH_USER.trim(),
            remote_bind: REMOTE_BIND.trim(),
            remote_port: REMOTE_PORT.trim(),
            local_host: LOCAL_HOST.trim(),
            local_port: LOCAL_PORT.trim(),
            debug
          }	
        });
        tunnelRunning = true;
        log += `[${new Date().toLocaleTimeString()}] ✅ Tunnel started.\n`;
      } catch (err) {
        log += `[${new Date().toLocaleTimeString()}] ❌ ${err}\n`;
      }
    } else {
      log += `[${new Date().toLocaleTimeString()}] 🛑 Stopping tunnel...\n`;
      await invoke('stop_tunnel');
      tunnelRunning = false;
      log += `[${new Date().toLocaleTimeString()}] ✅ Tunnel stopped.\n`;
    }
  }
  
  function handleSubmit() {
    const form = document.querySelector('form');
    if (!form?.checkValidity()) {
      form.reportValidity();
      return;
    }

    toggleTunnel();
  }
  
  async function stopTunnelFrontend() {
    try {
      await invoke('stop_tunnel');
      tunnelRunning = false;
      log += `[${new Date().toLocaleTimeString()}] ✅ Tunnel stopped.\n`;
    } catch (err) {
      log += `[${new Date().toLocaleTimeString()}] ⚠️ Error while stopping the tunnel: ${err}\n`;
    }
  }
</script>

<style>
  main {
    font-family: 'Segoe UI', sans-serif;
    padding: 0 2rem;
    max-width: 700px;
    margin: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: #f9f9f9;
    border-radius: 1rem;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }
  
  form  {
    font-family: 'Segoe UI', sans-serif;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  h1 {
    font-size: 1.8rem;
    text-align: center;
  }

  .field-row {
    display: flex;
    gap: 1rem;
  }
  
  .field {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .field label {
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
    color: #333;
  }
  
  .field-row input {
    flex: 1;
    padding: 0.6rem;
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    font-size: 1rem;
    background: #fff;
    transition: border 0.2s;
  }

  input:focus {
    border-color: #0077cc;
    outline: none;
  }

  .debug-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding-left: 0.2rem;
  }

  button {
    padding: 0.7rem 1.5rem;
    font-size: 1rem;
    border: none;
    background-color: #0077cc;
    color: white;
    border-radius: 0.5rem;
    cursor: pointer;
    align-self: center;
    transition: background 0.2s;
  }

  button:hover {
    background-color: #005fa3;
  }

  pre {
    background: #111;
    color: #0f0;
    padding: 1rem;
    height: 200px;
    overflow-y: auto;
    font-size: 0.85rem;
    white-space: pre-wrap;
    user-select: text;
    border-radius: 0.75rem;
    font-family: 'Courier New', monospace;
    box-shadow: inset 0 0 4px rgba(0, 255, 0, 0.2);
    margin: 0;
  }

  @media (max-width: 599px) {
    .field-row {
      flex-direction: column;
    }

    button {
      width: 100%;
    }
  }
</style>

<main>
  <h1>Foundry SSH Tunnel</h1>
  <form on:submit|preventDefault={handleSubmit}>
    <div class="field-row">
      <div class="field">
        <label for="ssh-host">SSH Host</label>
        <input id="ssh-host" type="text" bind:value={SSH_HOST} disabled={tunnelRunning} required />
      </div>
      <div class="field">
        <label for="ssh-user">SSH User</label>
        <input id="ssh-user" type="text" bind:value={SSH_USER} disabled={tunnelRunning} required />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="remote-bind">Remote Bind</label>
        <input id="remote-bind" type="text" bind:value={REMOTE_BIND} disabled={tunnelRunning} required />
      </div>
      <div class="field">
        <label for="remote-port">Remote Port</label>
        <input id="remote-port" type="text" bind:value={REMOTE_PORT} disabled={tunnelRunning} required />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="local-host">Local Host</label>
        <input id="local-host" type="text" bind:value={LOCAL_HOST} disabled={tunnelRunning} required />
      </div>
      <div class="field">
        <label for="local-port">Local Port</label>
        <input id="local-port" type="text" bind:value={LOCAL_PORT} disabled={tunnelRunning} required />
      </div>
    </div>

    <div class="debug-container">
      <label>
        <input type="checkbox" bind:checked={debug} disabled={tunnelRunning} />
        Debug Mode (-vvv)
      </label>
    </div>
    
    <button type="submit">
      {tunnelRunning ? 'Stop Tunnel' : 'Start Tunnel'}
    </button>
  </form>
  <pre>{log}</pre>
</main>