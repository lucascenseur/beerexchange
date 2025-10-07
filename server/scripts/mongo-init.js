// Script d'initialisation MongoDB pour Docker
db = db.getSiblingDB('beer-exchange');

// Créer les collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('sales');

// Créer les index
db.users.createIndex({ "username": 1 }, { unique: true });
db.products.createIndex({ "name": 1 });
db.products.createIndex({ "category": 1 });
db.sales.createIndex({ "timestamp": -1 });
db.sales.createIndex({ "product": 1, "timestamp": -1 });
db.sales.createIndex({ "server": 1, "timestamp": -1 });

print('✅ Base de données beer-exchange initialisée avec succès');
