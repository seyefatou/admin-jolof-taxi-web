#!/bin/bash

echo "🚀 Déploiement en cours..."

cd /var/www/jolof_admin_v2 || exit

echo "📥 Pull du code"
git pull origin production

echo "🐳 Rebuild & restart containers"
docker compose down
docker compose up -d --build

echo "✅ Déploiement terminé"
