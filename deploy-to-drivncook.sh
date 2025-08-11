#!/bin/bash

# === CONFIGURATION ===
SERVER_USER=ubuntu
SERVER_IP=193.70.0.27
DEPLOY_PATH=/home/ubuntu/drivncook

echo "🚀 Début du déploiement DrivNCook..."

# === ACTIVER BUILDX ===
echo "📋 Activation de Docker Buildx..."
docker buildx create --use || true

# === NETTOYAGE LOCAL ===
echo "🧹 Nettoyage des images locales..."
docker image prune -f || true

# === BUILD DES IMAGES ===
echo "🔨 Build backend..."
docker buildx build --platform linux/amd64 -t backend -f ./backend/Dockerfile ./backend --load

echo "🔨 Build admin..."
docker buildx build --platform linux/amd64 -t frontend-admin -f ./frontend-admin/Dockerfile.prod ./frontend-admin --load

echo "🔨 Build franchise..."
docker buildx build --platform linux/amd64 -t frontend-franchise -f ./frontend-franchise/Dockerfile.prod ./frontend-franchise --load

# === VÉRIFICATION DES IMAGES ===
echo "🔍 Vérification des images créées..."
docker images | grep -E "(backend|frontend-admin|frontend-franchise)"

# === EXPORT DES IMAGES ===
echo "📦 Export des images..."
docker save backend > backend.tar
docker save frontend-admin > admin.tar
docker save frontend-franchise > franchise.tar

# === VÉRIFICATION DES FICHIERS ===
echo "📋 Vérification des fichiers à transférer..."
ls -la *.tar devops/docker-compose.prod.yml devops/.env.prod

# === TRANSFERT SCP ===
echo "📤 Envoi des fichiers vers le serveur..."
scp backend.tar admin.tar franchise.tar devops/docker-compose.prod.yml devops/.env.prod "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH"

# === COMMANDES SERVEUR ===
echo "🚀 Exécution des commandes sur le serveur distant..."
ssh $SERVER_USER@$SERVER_IP << EOF
    cd $DEPLOY_PATH

    echo "🔄 Arrêt des conteneurs existants..."
    docker compose -f docker-compose.prod.yml --env-file .env.prod down || true

    echo "📦 Chargement des nouvelles images..."
    docker load < backend.tar
    docker load < admin.tar
    docker load < franchise.tar

    echo "🧹 Nettoyage des images non utilisées..."
    docker image prune -f

    echo "🚀 Démarrage des services..."
    docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

    echo "⏳ Attente du démarrage des services..."
    sleep 10

    echo "🔍 Vérification du statut des conteneurs..."
    docker compose -f docker-compose.prod.yml --env-file .env.prod ps

    echo "📋 Vérification des logs..."
    docker compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=5
EOF

# === MIGRATIONS Laravel ===
echo "🔄 Lancement des migrations Laravel..."
ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH && docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend php artisan migrate --force"

# === NETTOYAGE LOCAL ===
echo "🧹 Nettoyage des fichiers temporaires..."
rm -f backend.tar admin.tar franchise.tar



# === INSTRUCTIONS FINALES ===
echo "✅ Déploiement terminé !"
echo "--------------------------------------------------------"
echo "🌐 Services accessibles sur :"
echo "   - Backend (Laravel): http://$SERVER_IP:8000"
echo "   - Frontend Admin: http://$SERVER_IP:5173"
echo "   - Frontend Franchise: http://$SERVER_IP:5174"
echo "--------------------------------------------------------"
echo "🔧 Commandes utiles :"
echo "   Voir les logs: ssh $SERVER_USER@$SERVER_IP 'cd $DEPLOY_PATH && docker compose -f docker-compose.prod.yml logs -f'"
echo "   Redémarrer: ssh $SERVER_USER@$SERVER_IP 'cd $DEPLOY_PATH && docker compose -f docker-compose.prod.yml restart'"
echo "--------------------------------------------------------"