import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { sequelize, Setting } from './models/index.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import livraisonsRoutes from './routes/livraisons.js';
import clientsRoutes from './routes/clients.js';
import reportsRoutes from './routes/reports.js';
import teamRoutes from './routes/team.js';
import whatsappRoutes from './routes/whatsapp.js';
import gazRoutes from './routes/gaz.js';
import settingsRoutes from './routes/settings.js';
import validateEnv from './config/env.js';
import createSocketAuthMiddleware from './middleware/socketAuth.js';
import { logger } from './utils/logger.js';

dotenv.config();

// Validate environment variables before starting
let config;
try {
  config = validateEnv();
  logger.info('Environment variables validated successfully');
} catch (err) {
  logger.error('Failed to validate environment variables', { error: err.message });
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Helper for dynamic CORS validation
const estOrigineAutorisee = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (config.allowedOrigins.includes(origin) || config.allowedOrigins.includes('*')) {
    return callback(null, true);
  }
  if (/^https?:\/\/(www\.)?saheloxygene\.com$/.test(origin)) {
    return callback(null, true);
  }
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
    return callback(null, true);
  }
  if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
    return callback(null, true);
  }
  return callback(null, true);
};

// Socket.IO with dynamic CORS configuration
const io = new Server(server, {
  cors: {
    origin: estOrigineAutorisee,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Apply rate limiting and authentication middleware to Socket.IO
io.use(createSocketAuthMiddleware(config.jwtSecret));

// CORS configured for allowed origins (including saheloxygene.com & www.saheloxygene.com)
app.use(
  cors({
    origin: estOrigineAutorisee,
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' })); 


app.set('io', io);

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'sahel-oxygene-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/livraisons', livraisonsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/gaz', gazRoutes);
app.use('/api/settings', settingsRoutes);

// --- Temps réel (§6 : une course attribuée apparaît immédiatement chez le livreur) ---
io.on('connection', (socket) => {
  logger.debug('User connected to Socket.IO', { userId: socket.userId });

  socket.on('rejoindre', ({ userId, roles }) => {
    // Only allow users to join their own driver channel
    if (userId !== socket.userId) {
      logger.warn('Attempted unauthorized channel join', { 
        attemptedUserId: userId, 
        authenticatedUserId: socket.userId 
      });
      socket.emit('error', 'Unauthorized');
      return;
    }

    socket.join('staff'); // canal pour l'administration/gestion
    if (userId) socket.join(`livreur:${userId}`);
    logger.debug('User joined channels', { userId, channels: ['staff', `livreur:${userId}`] });
  });

  socket.on('disconnect', () => {
    logger.debug('User disconnected from Socket.IO', { userId: socket.userId });
  });
});

// Middleware simple pour diffuser les événements depuis les routes :
// req.app.get('io').to('staff').emit('livraison:maj', livraison)
// req.app.get('io').to(`livreur:${livreurId}`).emit('livraison:attribuee', livraison)

// Error handler middleware - should be the last middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // Don't expose internal error details to client in production
  const statusCode = err.statusCode || 500;
  const message = 
    process.env.NODE_ENV === 'production' 
      ? 'Erreur serveur interne' 
      : err.message;

  res.status(statusCode).json({ error: message });
});

app.set('io', io);

async function demarrer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    await sequelize.sync(); // en dev : crée/actualise les tables automatiquement
    logger.info('Database schema synchronized');

    // Migration légère : ajoute la valeur d'enum 'vendeur_gaz' si elle n'existe pas encore
    // (sequelize.sync() ne modifie pas les ENUM PostgreSQL existants automatiquement).
    try {
      await sequelize.query(
        `ALTER TYPE "enum_user_roles_role" ADD VALUE IF NOT EXISTS 'vendeur_gaz'`
      );
      logger.debug('Added vendeur_gaz role to enum');
    } catch (e) {
      // Le type n'existe pas encore avec ce nom exact la 1ère fois : sync() l'aura déjà créé avec la bonne valeur.
      logger.debug('vendeur_gaz role already exists or type does not yet exist');
    }

    // Nom de plateforme par défaut si jamais défini
    const [setting] = await Setting.findOrCreate({ where: { key: 'app_name' }, defaults: { key: 'app_name', value: 'SAHEL OXYGENE' } });
    if (setting && (!setting.value || setting.value === 'Gaz')) {
      setting.value = 'SAHEL OXYGENE';
      await setting.save();
    }
    logger.info('Default platform settings initialized');

    server.listen(config.port, () => {
      logger.info(`Server started successfully`, { 
        port: config.port, 
        environment: config.nodeEnv,
        allowedOrigins: config.allowedOrigins
      });
      console.log(`✅ SAHEL OXYGENE — API démarrée sur le port ${config.port}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    console.error('❌ Impossible de démarrer le serveur :', err);
    process.exit(1);
  }
}

demarrer();

export { app, server, io };
