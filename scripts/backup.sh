#!/bin/bash

# Script de sauvegarde pour Beer Exchange
# Usage: ./scripts/backup.sh [backup-name]

BACKUP_NAME=${1:-"backup-$(date +%Y%m%d_%H%M%S)"}
BACKUP_DIR="./backups"
MONGO_CONTAINER="beer-exchange-mongodb"

echo "🗄️  Début de la sauvegarde Beer Exchange..."
echo "Nom de la sauvegarde: $BACKUP_NAME"

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"

# Vérifier si le conteneur MongoDB est en cours d'exécution
if ! docker ps | grep -q "$MONGO_CONTAINER"; then
    echo "❌ Le conteneur MongoDB n'est pas en cours d'exécution"
    echo "Démarrez l'application avec: docker-compose up -d"
    exit 1
fi

# Créer la sauvegarde de la base de données
echo "📦 Sauvegarde de la base de données..."
docker exec "$MONGO_CONTAINER" mongodump --db beer-exchange --out /tmp/backup

# Copier la sauvegarde du conteneur vers l'hôte
echo "📁 Copie de la sauvegarde..."
docker cp "$MONGO_CONTAINER:/tmp/backup" "$BACKUP_DIR/$BACKUP_NAME"

# Nettoyer la sauvegarde temporaire dans le conteneur
docker exec "$MONGO_CONTAINER" rm -rf /tmp/backup

# Créer une archive compressée
echo "🗜️  Compression de la sauvegarde..."
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

# Afficher les informations de la sauvegarde
BACKUP_SIZE=$(du -h "$BACKUP_NAME.tar.gz" | cut -f1)
echo "✅ Sauvegarde terminée!"
echo "📁 Fichier: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "📊 Taille: $BACKUP_SIZE"

# Garder seulement les 10 dernières sauvegardes
echo "🧹 Nettoyage des anciennes sauvegardes..."
ls -t "$BACKUP_DIR"/*.tar.gz | tail -n +11 | xargs -r rm

echo "🎉 Sauvegarde complète!"
