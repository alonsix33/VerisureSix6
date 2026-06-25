#!/usr/bin/env bash
# Configurar Cloudflare Tunnel para acceso remoto
set -euo pipefail

echo "=== Configurando Cloudflare Tunnel ==="

# Instalar cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb
rm cloudflared.deb

# Login
echo "Iniciando sesión en Cloudflare..."
cloudflared tunnel login

# Crear tunnel
TUNNEL_NAME="sheriff-home"
cloudflared tunnel create "$TUNNEL_NAME"

# Obtener UUID del tunnel
TUNNEL_UUID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
echo "Tunnel UUID: $TUNNEL_UUID"

# Crear config
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml <<EOF
tunnel: $TUNNEL_UUID
credentials-file: /home/ubuntu/.cloudflared/$TUNNEL_UUID.json

ingress:
  - hostname: sheriff.YOUR_DOMAIN.com
    service: http://localhost:80
  - service: http_status:404
EOF

echo ""
echo "Edita ~/.cloudflared/config.yml y reemplaza YOUR_DOMAIN.com"
echo "Luego ejecuta:"
echo "  cloudflared tunnel route dns $TUNNEL_NAME sheriff.YOUR_DOMAIN.com"
echo "  sudo cloudflared service install"
echo "  sudo systemctl start cloudflared"
