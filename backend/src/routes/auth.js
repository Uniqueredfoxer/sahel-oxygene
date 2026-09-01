import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/index.js';
import { authentifier } from '../middleware/auth.js';
import createRateLimiter from '../middleware/rateLimiter.js';
import validateEnv from '../config/env.js';
import { 
  isValidEmail, 
  isValidPassword, 
  isValidName 
} from '../validators.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const config = validateEnv();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

// Rate limiter for auth endpoints (5 requests per 15 minutes)
const authRateLimiter = createRateLimiter(config.rateLimitWindowMs, config.rateLimitMaxRequests);

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// POST /api/auth/register
// L'inscription publique est désactivée. Les comptes sont exclusivement créés par l'administrateur.
router.post('/register', async (req, res) => {
  return res.status(403).json({
    error: 'L\'inscription publique est désactivée. Les comptes sont créés et attribués exclusivement par l\'administrateur.',
  });
});

// POST /api/auth/login
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user || !user.active) {
      logger.warn('Login attempt for non-existent or inactive user', { email: email.toLowerCase() });
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const valide = await bcrypt.compare(password, user.passwordHash);
    if (!valide) {
      logger.warn('Login attempt with invalid password', { email: email.toLowerCase() });
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = signToken(user);
    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// GET /api/auth/me — profil + rôles de l'utilisateur connecté
router.get('/me', authentifier, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const roles = await UserRole.findAll({ where: { userId: user.id } });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles: roles.map((r) => r.role),
  });
});

export default router;
