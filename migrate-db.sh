#!/bin/bash

# === EXPORT VIA DOCKER LOCAL ===
SERVER_USER=ubuntu
SERVER_IP=193.70.0.27
DEPLOY_PATH=/home/ubuntu/drivncook
LOCAL_DB_NAME=drive_n_cook
BACKUP_FILE=drivncook_backup_$(date +%Y%m%d_%H%M%S).sql

echo "🗄️  Export via Docker local..."

# Vérifiez si Docker est en cours d'exécution localement
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution localement"
    echo "Veuillez démarrer Docker ou utiliser une autre méthode"
    exit 1
fi

# Trouvez le conteneur MySQL local
MYSQL_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -i mysql | head -1)

if [ -z "$MYSQL_CONTAINER" ]; then
    echo "❌ Aucun conteneur MySQL trouvé en cours d'exécution"
    echo "Conteneurs disponibles:"
    docker ps --format "table {{.Names}}\t{{.Image}}"
    echo ""
    echo "Démarrez votre environnement local avec: docker compose up -d"
    exit 1
fi

echo "📤 Export depuis le conteneur: $MYSQL_CONTAINER"

# Export via le conteneur Docker
docker exec $MYSQL_CONTAINER mysqldump -u root -proot $LOCAL_DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Export local réussi: $BACKUP_FILE"
    ls -lh $BACKUP_FILE
else
    echo "❌ Erreur lors de l'export via Docker"
    echo "Vérifiez les paramètres de connexion (utilisateur: root, mot de passe: root, base: $LOCAL_DB_NAME)"
    exit 1
fi

# === TRANSFERT ET IMPORT (reste identique) ===
echo "📤 Transfert du fichier SQL vers le serveur..."
scp $BACKUP_FILE "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH/"

if [ $? -eq 0 ]; then
    echo "✅ Transfert réussi"
else
    echo "❌ Erreur lors du transfert"
    exit 1
fi

echo "📥 Import dans la base de données de production..."
ssh $SERVER_USER@$SERVER_IP << EOF
    cd $DEPLOY_PATH

    echo "📥 Import du fichier SQL dans MySQL..."
    docker compose -f docker-compose.prod.yml exec -T mysql mysql -u root -proot $LOCAL_DB_NAME < $BACKUP_FILE

    if [ \$? -eq 0 ]; then
        echo "✅ Import réussi dans la base de production"
    else
        echo "❌ Erreur lors de l'import"
        exit 1
    fi

    echo "🧹 Nettoyage du fichier temporaire..."
    rm -f $BACKUP_FILE

    echo "✅ Import terminé avec succès !"
EOF

# Nettoyage local
rm -f $BACKUP_FILE
echo "🎉 Migration de base de données terminée !"