// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::{
    io::BufRead,
    process::{Child, Command, Stdio},
    sync::{Arc, Mutex},
};
use tauri::{AppHandle, Emitter, State};

#[derive(Debug, Deserialize, Serialize, Default, Clone)]
struct TunnelConfig {
    ssh_host: String,
    ssh_user: String,
    remote_bind: String,
    remote_port: String,
    local_host: String,
    local_port: String,
    debug: bool,
}

struct TunnelState {
    child: Mutex<Option<Child>>,
}

#[tauri::command]
fn start_tunnel(
    app: AppHandle,
    config: TunnelConfig,
    state: State<Arc<TunnelState>>,
) -> Result<(), String> {
    let mut args = vec![
        "-N".into(),
        "-R".into(),
        format!(
            "{}:{}:{}:{}",
            config.remote_bind, config.remote_port, config.local_host, config.local_port
        ),
        format!("{}@{}", config.ssh_user, config.ssh_host),
    ];

    if config.debug {
        args.insert(0, "-vvv".into());
    }

    let mut child = Command::new("ssh")
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            let msg = format!("❌ Fehler beim Starten: {e}");
            let _ = app.emit("tunnel_error", msg.clone());
            msg
        })?;

    let child_stdout = child.stdout.take().unwrap();
    let child_stderr = child.stderr.take().unwrap();

    let app_stdout = app.clone();
    std::thread::spawn(move || {
        let reader = std::io::BufReader::new(child_stdout);
        for line in reader.lines().flatten() {
          app_stdout.emit("log", line).ok();
        }
    });

    let app_stderr = app.clone();
    std::thread::spawn(move || {
        let reader = std::io::BufReader::new(child_stderr);
        for line in reader.lines().flatten() {
          app_stderr.emit("log", line).ok();
        }
    });

    *state.child.lock().unwrap() = Some(child);
    Ok(())
}

#[tauri::command]
fn stop_tunnel(state: State<Arc<TunnelState>>) {
    if let Some(mut child) = state.child.lock().unwrap().take() {
        let _ = child.kill();
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_log::Builder::new().build())
        .manage(Arc::new(TunnelState {
            child: Mutex::new(None),
        }))
        .invoke_handler(tauri::generate_handler![start_tunnel, stop_tunnel])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
