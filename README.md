# 🛠️ Foundry Tunnel

A lightweight Electron-based application that establishes a secure **SSH reverse tunnel** for hosting self-hosted [Foundry VTT](https://foundryvtt.com/) instances—without relying on services like playit.gg.

---

## ✨ Features

- 🔐 Connects via SSH using your system's default private key (`~/.ssh/id_rsa`)
- 🌐 Binds Foundry VTT to a public domain or IP using reverse tunneling
- 🖱️ Simple toggle interface: Start/Stop tunnel
- 🪵 Live log output with optional `-vvv` debug mode
- 🔄 Auto-cleans stale tunnels
- ⚙️ Customizable via `.env` file
- 📦 Packaged as a Windows `.exe`

---

## 📁 Project Structure

```
foundry-tunnel/
├── main.js             # Main Electron process
├── preload.js          # Preload bridge to renderer
├── renderer.js         # UI logic and tunnel control
├── index.html          # UI layout
├── icon.png            # App icon
├── .env                # SSH settings (ignored by Git)
├── .gitignore
└── package.json
```

---

## 🧪 Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a `.env` file:

```env
SSH_USER=test-user
SSH_HOST=ip-or-domain-where-the-proxy-is
REMOTE_BIND=127.0.0.1
REMOTE_PORT=31000
LOCAL_HOST=localhost
LOCAL_PORT=30000
```

> ⚠️ This file is ignored via `.gitignore` and **should not be committed.**

### 3. Start in dev mode

```bash
npm start
```

Use the **"Debug" checkbox** to enable verbose SSH logging (`-vvv`).

---

## 🛠️ Build the App (Windows)

```bash
npm run dist
```

> Requires `electron-builder` and Windows OS for `.exe` generation.

---

## 📡 Example SSH Command Used

```bash
ssh -N -R 127.0.0.1:31000:localhost:30000 foundryuser@foundry.lappenbande.de
```

---

## 📦 Release

To package and publish a new version to GitHub:

```bash
npm run dist
gh release create v1.0.0 dist/*.exe --title "Foundry Tunnel v1.0.0" --notes "Initial release"
```

---

## 📋 License

MIT © [suitablyat](https://github.com/suitablyat)

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
    ServerName foundry.lappenbande.de

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
