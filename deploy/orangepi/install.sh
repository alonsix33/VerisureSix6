#!/usr/bin/env bash
# Sheriff Home — Install script para Orange Pi 5 (Ubuntu 22.04 ARM64)
set -euo pipefail

REPO_DIR="/home/ubuntu/verisure-home-platform"
VENV="$REPO_DIR/venv"
SERVICE_DIR="/etc/systemd/system"

echo "╔══════════════════════════════════════════╗"
echo "║  Sheriff Home — Setup Orange Pi 5        ║"
echo "╚══════════════════════════════════════════╝"

# ── Dependencias del sistema ──
echo "[1/7] Instalando dependencias del sistema..."
sudo apt-get update -qq
sudo apt-get install -y -qq \
    python3.11 python3.11-venv python3-pip \
    git curl nginx \
    gnuradio rtl-sdr librtlsdr-dev \
    nodejs npm

# ── Clonar / actualizar repo ──
echo "[2/7] Clonando repositorio..."
if [ -d "$REPO_DIR/.git" ]; then
    git -C "$REPO_DIR" pull
else
    git clone https://github.com/alonsix33/VerisureSix6.git "$REPO_DIR"
fi

# ── Python venv + dependencias ──
echo "[3/7] Configurando entorno Python..."
if [ ! -d "$VENV" ]; then
    python3.11 -m venv "$VENV"
fi
"$VENV/bin/pip" install --quiet --upgrade pip
"$VENV/bin/pip" install --quiet -r "$REPO_DIR/backend/requirements.txt"

# ── .env ──
echo "[4/7] Configurando variables de entorno..."
if [ ! -f "$REPO_DIR/.env" ]; then
    cp "$REPO_DIR/.env.example" "$REPO_DIR/.env"
    echo ""
    echo "⚠️  EDITA $REPO_DIR/.env con tus credenciales antes de arrancar."
    echo "   Variables mínimas: ANTHROPIC_API_KEY, OPENAI_API_KEY"
    echo ""
fi

# ── Frontend build ──
echo "[5/7] Building frontend..."
cd "$REPO_DIR/dashboard"
npm install --silent
VITE_API_URL="http://192.168.68.100:8000" npm run build --silent

# ── Nginx ──
echo "[6/7] Configurando Nginx..."
sudo tee /etc/nginx/sites-available/sheriff > /dev/null <<'NGINX'
server {
    listen 80;
    server_name _;

    root /home/ubuntu/verisure-home-platform/dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/sheriff /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# ── Systemd services ──
echo "[7/7] Instalando servicios systemd..."
sudo cp "$REPO_DIR/deploy/orangepi/services/"*.service "$SERVICE_DIR/"
sudo systemctl daemon-reload
sudo systemctl enable sheriff-backend
sudo systemctl enable sheriff-rf-listener
sudo systemctl restart sheriff-backend

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅ Sheriff Home instalado               ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Frontend: http://192.168.68.100         ║"
echo "║  API:      http://192.168.68.100:8000    ║"
echo "║  Docs:     http://192.168.68.100:8000/docs║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Próximos pasos:"
echo "  1. sudo nano $REPO_DIR/.env   # Agregar API keys"
echo "  2. sudo systemctl restart sheriff-backend"
echo "  3. Abrir http://192.168.68.100 en el navegador"
