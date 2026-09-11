#!/bin/sh
set -e

echo "============================================"
echo " Car Marketplace API — Starting..."
echo "============================================"

echo "[1/2] Applying migrations..."
python manage.py migrate --noinput

echo "[2/2] Starting Django development server..."
exec python manage.py runserver 0.0.0.0:8000
