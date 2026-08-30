/**
 * Input validation helpers and middleware
 */

// Email validation
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return Boolean(email && regex.test(email));
}

// Password validation (min 8 chars, at least one number and one letter)
export function isValidPassword(password) {
  return Boolean(password && password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password));
}

// Phone validation (Burkina Faso / West Africa: 8 to 20 digits, e.g., 70123456 or +22670123456)
export function isValidPhone(phone) {
  if (!phone) return false;
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

// Name validation
export function isValidName(name) {
  return Boolean(name && name.trim().length >= 2 && name.trim().length <= 100);
}

// GPS coordinates validation
export function isValidGPS(latitude, longitude) {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// Delivery status validation
export function isValidDeliveryStatus(status) {
  const valid = ['en_attente', 'en_cours', 'livree', 'annulee'];
  return valid.includes(status);
}

// Role validation
export function isValidRole(role) {
  const valid = ['administrateur', 'gestionnaire', 'livreur', 'vendeur_gaz'];
  return valid.includes(role);
}

// Date validation helper (returns Date object or null if invalid)
export function parseValidDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Middleware to validate request body fields
export function validateRequired(...fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        return res.status(400).json({ error: `Le champ '${field}' est obligatoire` });
      }
    }
    next();
  };
}

// Middleware to validate email format
export function validateEmail(req, res, next) {
  const email = req.body.email || '';
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: "Format d'email invalide" });
  }
  next();
}

// Middleware to validate password strength
export function validatePasswordStrength(req, res, next) {
  const password = req.body.password || '';
  if (password && !isValidPassword(password)) {
    return res.status(400).json({
      error: 'Le mot de passe doit contenir au moins 8 caractères avec chiffres et lettres',
    });
  }
  next();
}

export default {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidName,
  isValidGPS,
  isValidDeliveryStatus,
  isValidRole,
  parseValidDate,
  validateRequired,
  validateEmail,
  validatePasswordStrength,
};
