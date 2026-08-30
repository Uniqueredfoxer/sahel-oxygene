import jwt from 'jsonwebtoken';
import { UserRole } from '../models/index.js';

/** Vérifie le JWT et attache req.user = { id, email, name }. */
function authentifier(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session invalide ou expirée' });
  }
}

/**
 * Vérifie que l'utilisateur authentifié possède l'un des rôles requis.
 * Le rôle est toujours relu en base (jamais fait confiance au token seul
 * au-delà de l'identité), conformément au §5.2 : vérifications de rôle
 * réalisées côté serveur, jamais à partir du navigateur.
 */
function exigerRole(...rolesAutorises) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentification requise' });
    const roles = await UserRole.findAll({ where: { userId: req.user.id } });
    const roleNames = roles.map((r) => r.role);
    req.roles = roleNames;
    const autorise = roleNames.some((r) => rolesAutorises.includes(r));
    if (!autorise) {
      return res.status(403).json({ error: 'Accès refusé : rôle insuffisant' });
    }
    next();
  };
}

export { authentifier, exigerRole };
