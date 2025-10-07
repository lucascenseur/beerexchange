#!/bin/bash

# Script de restauration pour Beer Exchange
# Usage: ./scripts/restore.sh backup-name.tar.gz

if [ $# -eq 0 ]; then
    echo "❌ Usage: $0 <backup-file.tar.gz>"
    echo "📁 Sauvegardes disponibles:"
    ls -la ./backups/*.tar.gz 2>/dev/null || echo "Aucune sauvegarde trouvée"
    exit 1
fi

BACKUP_FILE="$1"
BACKUP_DIR="./backups"
MONGO_CONTAINER="beer-exchange-mongodb"

# Vérifier si le fichier de sauvegarde existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Fichier de sauvegarde non trouvé: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Début de la restauration Beer Exchange..."
echo "📁 Fichier de sauvegarde: $BACKUP_FILE"

# Vérifier si le conteneur MongoDB est en cours d'exécution
if ! docker ps | grep -q "$MONGO_CONTAINER"; then
    echo "❌ Le conteneur MongoDB n'est pas en cours d'exécution"
    echo "Démarrez l'application avec: docker-compose up -d"
    exit 1
fi

# Demander confirmation
read -p "⚠️  Cette opération va remplacer toutes les données actuelles. Continuer? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restauration annulée"
    exit 1
fi

# Extraire la sauvegarde
echo "📦 Extraction de la sauvegarde..."
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Trouver le répertoire de la base de données
DB_DIR=$(find "$TEMP_DIR" -name "beer-exchange" -type d | head -1)
if [ -z "$DB_DIR" ]; then
    echo "❌ Structure de sauvegarde invalide"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Arrêter l'application temporairement
echo "⏸️  Arrêt de l'application..."
docker-compose stop server client

# Supprimer la base de données actuelle
echo "🗑️  Suppression de la base de données actuelle..."
docker exec "$MONGO_CONTAINER" mongosh --eval "db.dropDatabase()" beer-exchange

# Restaurer la base de données
echo "📥 Restauration de la base de données..."
docker cp "$DB_DIR" "$MONGO_CONTAINER:/tmp/restore"
docker exec "$MONGO_CONTAINER" mongorestore --db beer-exchange /tmp/restore/beer-exchange

# Nettoyer
echo "🧹 Nettoyage..."
docker exec "$MONGO_CONTAINER" rm -rf /tmp/restore
rm -rf "$TEMP_DIR"

# Redémarrer l'application
echo "🚀 Redémarrage de l'application..."
docker-compose up -d

echo "✅ Restauration terminée!"
echo "🌐 L'application est accessible sur: http://localhost:3000"
