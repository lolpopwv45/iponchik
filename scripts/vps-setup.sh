#!/usr/bin/env bash
# Первый запуск на чистом Ubuntu 24.04 (Timeweb VPS).
# Запускать с сервера от root:
#   git clone https://github.com/lolpopwv45/iponchik.git /opt/iponchik
#   cp /opt/iponchik/.env.example /opt/iponchik/.env   # заполнить ключи и SITE_DOMAIN
#   bash /opt/iponchik/scripts/vps-setup.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/iponchik}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Запустите скрипт от root."
  exit 1
fi

if [[ ! -f "${APP_DIR}/docker-compose.yml" ]]; then
  echo "Нет ${APP_DIR}/docker-compose.yml. Склонируйте репозиторий в ${APP_DIR}."
  exit 1
fi

if [[ ! -f "${APP_DIR}/.env" ]]; then
  echo "Создайте ${APP_DIR}/.env из .env.example и вставьте ключи с Vercel + SITE_DOMAIN."
  exit 1
fi

if ! grep -qE '^SITE_DOMAIN=.+' "${APP_DIR}/.env"; then
  echo "В .env должен быть заполнен SITE_DOMAIN (например example.ru,www.example.ru)."
  exit 1
fi

if [[ ! -f /swapfile ]]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

if ! command -v docker >/dev/null 2>&1; then
  apt-get update
  apt-get install -y ca-certificates curl git
  curl -fsSL https://get.docker.com | sh
fi

if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw allow 443/udp
  ufw --force enable
fi

cd "${APP_DIR}"
docker compose up -d --build

echo
echo "Контейнеры запущены."
echo "DNS: A-записи @ и www на IP этого VPS, записи Vercel удалить."
echo "Порты 80 и 443 должны быть открыты в панели Timeweb."
echo "Повторный деплой: cd ${APP_DIR} && git pull && docker compose up -d --build"
