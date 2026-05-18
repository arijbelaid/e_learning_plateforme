require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:admin_secure_password@mongodb:27017/users_db?authSource=admin';

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use('/api/', limiter);
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check — répond toujours
app.get('/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: mongoState === 1 ? 'ok' : 'degraded',
    service: 'user-service',
    version: '1.0.0',
    mongodb: states[mongoState] || 'unknown',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Démarre le serveur HTTP immédiatement
app.listen(PORT, '0.0.0.0', () => {
  console.log(`User Service running on port ${PORT}`);
  connectMongo();
});

// Connexion MongoDB avec retry automatique
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 20;

async function connectMongo(attempt = 1) {
  try {
    console.log(`[MongoDB] Connection attempt ${attempt}/${MAX_RETRIES}...`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      // CRITIQUE: désactive le buffering pour éviter les timeouts nginx
      // Sans cela, les requêtes restent en attente infinie → nginx 502 → HTML → JSON.parse fail
      bufferCommands: false,
    });
    console.log('[MongoDB] Connected successfully');
  } catch (err) {
    console.error(`[MongoDB] Connection failed (attempt ${attempt}): ${err.message}`);
    if (attempt >= MAX_RETRIES) {
      console.error('[MongoDB] Max retries reached. Restarting in 30s...');
      setTimeout(() => connectMongo(1), 30000);
      return;
    }
    console.log(`[MongoDB] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
    setTimeout(() => connectMongo(attempt + 1), RETRY_DELAY_MS);
  }
}

// Reconnexion automatique si la connexion est perdue
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection lost. Reconnecting...');
  setTimeout(() => connectMongo(), RETRY_DELAY_MS);
});

mongoose.connection.on('connected', () => {
  console.log('[MongoDB] Mongoose connection established.');
});
