# 🛠️ Foundry Tunnel (Tauri Edition)

A lightweight, portable **Tauri-based** desktop app to securely expose self-hosted [Foundry VTT](https://foundryvtt.com/) instances using an SSH reverse tunnel – with a modern Svelte UI.

---

## ✨ Features

- 🔐 SSH tunnel using your local key (`~/.ssh/id_rsa`)
- 🌐 Exposes Foundry via remote port forwarding (reverse tunnel)
- ⚙️ Custom host/user/port configuration via UI
- 💾 Automatically saves last-used SSH settings
- 🪵 Live terminal-style log output
- 🐞 Toggle debug mode (`-vvv`)
- 🛑 Automatically stops tunnel if an SSH error is detected
- ✅ Browser-native validation for required fields
- 📦 Fully portable `.exe` (no installer required)

---

## 🧰 Usage

### 1. Download & Run

- Run the `.exe` file from the `target/release/` folder after build.
- No installation needed (fully portable).
- You’ll see a simple UI where you can configure SSH tunnel details.

### 2. Configure connection

Fill in:

- `SSH Host` (e.g. `foundry.example.com`)
- `SSH User` (e.g. `foundry`)
- Remote bind (defaults to `127.0.0.1`)
- Remote port (e.g. `31000`)
- Local host (`localhost`)
- Local port (e.g. `30000`)

These values are saved automatically and restored on next launch.

---

## 🧪 Development

### 1. Install dependencies

```bash
npm install
```

### 2. Run dev server

```bash
npm run tauri dev
```

---

## 🏗️ Build portable `.exe`

```bash
npm run tauri build
```

- Produces a portable Windows `.exe` in `src-tauri/target/release/`
- No installer is created (see `tauri.conf.json` → `installer: false`)

---

## 🧱 SSH Command Equivalent

The app internally runs a command like:

```bash
ssh -N -R 127.0.0.1:31000:localhost:30000 foundry@foundry.example.com
```

---

---

## 🐧 Linux Setup (Apache Reverse Proxy)

To serve Foundry VTT securely via a domain name using Apache on your Linux server:

### 1. Enable required Apache modules

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod headers
sudo systemctl restart apache2
```

### 2. Configure a Virtual Host

Create or modify your Apache site config:

```bash
sudo nano /etc/apache2/sites-available/foundry.conf
```

Example config:

```apache
<VirtualHost *:80>
    ServerName foundry.example.com
    Redirect permanent / https://foundry.example.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName foundry.example.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/foundry.example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/foundry.example.com/privkey.pem

    ProxyPreserveHost On
    ProxyRequests Off

    ProxyPass /socket.io/ http://127.0.0.1:31000/socket.io/ upgrade=WebSocket
    ProxyPassReverse /socket.io/ http://127.0.0.1:31000/socket.io/

    ProxyPass / http://127.0.0.1:31000/
    ProxyPassReverse / http://127.0.0.1:31000/

    Header always set Strict-Transport-Security "max-age=31536000"
    Header always set X-Content-Type-Options "nosniff"
</VirtualHost>

```

Then enable the site:

```bash
sudo a2ensite foundry.conf
sudo systemctl reload apache2
```

### 3. DNS and SSL

- Make sure your domain (e.g., `foundry.example.com`) points to your server.
- For HTTPS, use [Let's Encrypt](https://certbot.eff.org/) via Certbot:
  ```bash
  sudo apt install certbot python3-certbot-apache
  sudo certbot --apache
  ```

---

## ⚠️ Potential Pitfalls

- ❌ Apache won’t restart? Check config syntax: `sudo apachectl configtest`
- ❌ `"Header"` directive errors? Make sure `mod_headers` is enabled.
- ❌ `Service Unavailable`? Confirm the SSH tunnel is active and listening on `localhost:31000`.
- ❌ Foundry loads only the splash screen? WebSockets might be blocked or the proxy not forwarding correctly — verify `proxy_wstunnel` is active.
- ❌ Tunnel won’t start? Make sure port `31000` is free and not firewalled.
- ✅ Test port with: `sudo lsof -i :31000`

---

## 📋 License

MIT © [suitablyat](https://github.com/suitablyat)

---