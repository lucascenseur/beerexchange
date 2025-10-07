const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { sequelize, testConnection } = require('./config/database');
const priceEngine = require('./utils/priceEngine');
require('dotenv').config();

const { router: productRoutes, setSocketIO } = require('./routes/products');
const saleRoutes = require('./routes/sales');
const adminRoutes = require('./routes/admin');
const sumupRoutes = require('./routes/sumup');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

// Configuration trust proxy pour éviter l'erreur rate-limit
app.set('trust proxy', 1);

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par windowMs
});
app.use(limiter);

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connexion à MariaDB
const initializeDatabase = async () => {
  try {
    await testConnection();
    await sequelize.sync({ alter: true });
    console.log('✅ Base de données MariaDB synchronisée');
  } catch (error) {
    console.error('❌ Erreur de connexion MariaDB:', error);
    process.exit(1);
  }
};

initializeDatabase();

// Routes
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sumup', sumupRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Beer Exchange API is running!' });
});

// Servir les fichiers statiques du frontend en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Gérer le routage côté client pour React Router
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
} else {
  // En développement, rediriger vers le serveur de développement React
  app.get('*', (req, res) => {
    res.redirect('http://localhost:3001' + req.originalUrl);
  });
}

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur interne' });
});

// Gestion Socket.io
io.on('connection', (socket) => {
  console.log('👤 Utilisateur connecté:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`👤 Utilisateur ${socket.id} a rejoint la room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('👤 Utilisateur déconnecté:', socket.id);
  });
});

// Export io pour utilisation dans les routes
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur Beer Exchange démarré sur le port ${PORT}`);
  console.log(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
  
  // Démarrer le moteur de prix
  priceEngine.start(io);
  setSocketIO(io);
});

// Arrêter le moteur de prix à l'arrêt du serveur
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  priceEngine.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  priceEngine.stop();
  process.exit(0);
});
