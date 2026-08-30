/**
 * Application-wide constants
 */

// User roles
export const USER_ROLES = {
  ADMIN: 'administrateur',
  MANAGER: 'gestionnaire',
  DRIVER: 'livreur',
  GAS_VENDOR: 'vendeur_gaz',
};

// Delivery statuses
export const DELIVERY_STATUSES = {
  PENDING: 'en_attente',
  IN_PROGRESS: 'en_cours',
  DELIVERED: 'livree',
  CANCELLED: 'annulee',
};

// Numbering prefixes
export const NUMBERING = {
  DELIVERY_PREFIX: 'PDX',
};

// Socket.IO channels
export const SOCKET_CHANNELS = {
  STAFF: 'staff', // for admin/manager broadcasts
  DRIVER: (userId) => `livreur:${userId}`, // driver-specific assignments
};

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentification requise',
  INVALID_SESSION: 'Session invalide ou expirée',
  INSUFFICIENT_ROLE: 'Accès refusé : rôle insuffisant',
  INTERNAL_ERROR: 'Erreur serveur interne',
};

export default {
  USER_ROLES,
  DELIVERY_STATUSES,
  NUMBERING,
  SOCKET_CHANNELS,
  ERROR_MESSAGES,
};
