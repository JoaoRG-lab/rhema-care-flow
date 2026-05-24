# UHS HealthOS — Ubuntu VPS + Nginx + Cloudflare Tunnel Staging

This runbook defines the staging path for UHS HealthOS using an Ubuntu VPS, Nginx, FastAPI, React/Vite and Cloudflare Tunnel.

It complements:

- Issue #91 — AI Lab and Cloud Production Track
- PR #90 — Replit MVP backend/frontend skeleton

## Product framing

```txt
UHS HealthOS = multi-specialty clinical operating platform
Rhema Care Flow Lite = first operational vertical
Rheumatology = first clinical validation domain, not the product boundary
```

## Goal

Create a low-cost 24/7 staging environment without relying on:

- Replit paid deploy
- Vercel
- Supabase Auth
- Google OAuth
- Apple OAuth
- Magic Link
- the unstable root `reumatismos.com` flow

Preferred staging hostname:

```txt
app.reumatismos.com
```

## Target architecture

```txt
User
  ↓
Cloudflare DNS / Tunnel
  ↓
Ubuntu VPS
  ↓
Nginx
  ├── /      → React/Vite static build
  └── /api   → FastAPI/Uvicorn on 127.0.0.1:8000
        ↓
SQLite initially; PostgreSQL later
```

## Non-negotiable safety rules

- Do not use real patient data in this staging phase.
- Do not commit `.env` files.
- Do not use weak seed credentials in a public environment.
- Do not point the root domain `reumatismos.com` to this staging app yet.
- Do not expose Uvicorn directly to the public internet.
- Prefer Cloudflare Tunnel instead of opening ports 80/443 directly.
- Keep GitHub branch/PR as source of truth.

## Prerequisites

- Ubuntu 22.04 or 24.04 LTS VPS.
- SSH access.
- A non-root sudo user.
- Cloudflare account controlling `reumatismos.com`.
- GitHub access to `JoaoRG-lab/rhema-care-flow`.
- Branch: `feat/mvp-replit`.

## 1. Base server setup

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ca-certificates gnupg ufw nginx python3 python3-venv python3-pip
```

Install Node 20 using NodeSource or an equivalent trusted source:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Enable basic firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
sudo ufw status
```

If Cloudflare Tunnel is the only public ingress, port 80 can later be restricted.

## 2. Create app user and directories

```bash
sudo adduser --disabled-password --gecos "" uhs
sudo usermod -aG sudo uhs
sudo mkdir -p /opt/uhs-healthos
sudo chown -R uhs:uhs /opt/uhs-healthos
```

Switch to app user:

```bash
sudo -iu uhs
```

## 3. Clone repository

```bash
cd /opt/uhs-healthos
git clone https://github.com/JoaoRG-lab/rhema-care-flow.git app
cd app
git checkout feat/mvp-replit
```

## 4. Backend setup

```bash
cd /opt/uhs-healthos/app/apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Create environment file on server only:

```bash
nano /opt/uhs-healthos/app/apps/api/.env
```

Example values:

```env
DATABASE_URL=sqlite:////opt/uhs-healthos/data/rhema.db
JWT_SECRET=replace-with-long-random-secret
JWT_EXPIRY_HOURS=24
ENVIRONMENT=staging
CORS_ORIGINS=https://app.reumatismos.com
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=replace-with-strong-password
SEED_ADMIN_NAME=UHS Admin
```

Create data directory:

```bash
mkdir -p /opt/uhs-healthos/data
```

Manual backend smoke test:

```bash
cd /opt/uhs-healthos/app/apps/api
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

From another SSH session:

```bash
curl http://127.0.0.1:8000/api/health
```

Expected:

```json
{"ok":true,"service":"rhema-care-flow-lite-api","environment":"staging"}
```

## 5. Backend systemd service

Create service:

```bash
sudo nano /etc/systemd/system/uhs-api.service
```

Content:

```ini
[Unit]
Description=UHS HealthOS FastAPI staging service
After=network.target

[Service]
User=uhs
Group=uhs
WorkingDirectory=/opt/uhs-healthos/app/apps/api
EnvironmentFile=/opt/uhs-healthos/app/apps/api/.env
ExecStart=/opt/uhs-healthos/app/apps/api/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now uhs-api
sudo systemctl status uhs-api --no-pager
journalctl -u uhs-api -f
```

## 6. Frontend build

```bash
cd /opt/uhs-healthos/app/apps/web
npm install
VITE_API_BASE_URL=/api npm run build
```

Expected output:

```txt
apps/web/dist
```

## 7. Nginx config

Create site config:

```bash
sudo nano /etc/nginx/sites-available/uhs-healthos
```

Content:

```nginx
server {
    listen 80;
    server_name app.reumatismos.com;

    root /opt/uhs-healthos/app/apps/web/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/uhs-healthos /etc/nginx/sites-enabled/uhs-healthos
sudo nginx -t
sudo systemctl reload nginx
```

Local test on VPS:

```bash
curl http://127.0.0.1/api/health
```

## 8. Cloudflare Tunnel

Install `cloudflared` according to the current official Cloudflare Linux instructions.

Then authenticate:

```bash
cloudflared tunnel login
```

Create tunnel:

```bash
cloudflared tunnel create uhs-healthos-staging
```

Create config directory:

```bash
sudo mkdir -p /etc/cloudflared
```

Create config file:

```bash
sudo nano /etc/cloudflared/config.yml
```

Example:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/uhs/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: app.reumatismos.com
    service: http://localhost:80
  - service: http_status:404
```

Route DNS:

```bash
cloudflared tunnel route dns uhs-healthos-staging app.reumatismos.com
```

Install and start as service:

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared --no-pager
journalctl -u cloudflared -f
```

## 9. Smoke tests

Public tests:

```bash
curl https://app.reumatismos.com/api/health
```

Browser tests:

```txt
https://app.reumatismos.com
login
Dashboard
Pacientes
Novo paciente
Agenda
Scores
```

Acceptance criteria:

- `https://app.reumatismos.com` opens.
- `/api/health` returns OK.
- Login works.
- Dashboard loads.
- Patient creation works.
- Patient listing works.
- Appointment creation works.
- Scores screen loads.
- Services survive reboot.

## 10. Update procedure

```bash
sudo -iu uhs
cd /opt/uhs-healthos/app
git fetch origin
git checkout feat/mvp-replit
git pull

cd apps/api
source .venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart uhs-api

cd ../web
npm install
VITE_API_BASE_URL=/api npm run build
sudo systemctl reload nginx
```

## 11. Rollback

List recent commits:

```bash
cd /opt/uhs-healthos/app
git log --oneline -n 10
```

Rollback to a known commit:

```bash
git checkout <COMMIT_SHA>
sudo systemctl restart uhs-api
cd apps/web
VITE_API_BASE_URL=/api npm run build
sudo systemctl reload nginx
```

## 12. Backup SQLite

```bash
mkdir -p /opt/uhs-healthos/backups
sqlite3 /opt/uhs-healthos/data/rhema.db ".backup '/opt/uhs-healthos/backups/rhema-$(date +%F-%H%M).db'"
```

Add cron later after staging is validated.

## Codex task

Codex should implement, validate and refine this staging runbook without changing product scope.

Priority:

1. Make PR #90 build locally.
2. Make `apps/api` run cleanly.
3. Make `apps/web` build cleanly.
4. Validate this runbook against the actual repo layout.
5. Add missing deploy scripts only if they reduce operational risk.
6. Do not add Vercel, Supabase Auth, OAuth or Magic Link.
7. Do not introduce real patient data.

## Future migration

Once staging is stable:

- move SQLite to PostgreSQL;
- add Dockerfiles;
- add CI smoke tests;
- consider AWS App Runner/ECS + RDS for production.
