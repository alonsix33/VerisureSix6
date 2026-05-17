#!/usr/bin/env bash
set -euo pipefail

echo "=== Instalando VerisureSix6 en Orange Pi 5 ==="

sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.11 python3-pip python3.11-venv git gnuradio rtl-sdr

git clone https://github.com/alonsix33/VerisureSix6.git /home/orangepi/verisure
cd /home/orangepi/verisure/backend

python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
echo "=== EDITAR .env con credenciales ==="

sudo cp /home/orangepi/verisure/deploy/orangepi/services/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable verisure-backend
sudo systemctl enable verisure-rf-listener
sudo systemctl start verisure-backend
sudo systemctl start verisure-rf-listener

echo "=== Instalación completa ==="
