import express from 'express';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/index.js';
import { authentifier, exigerRole } from '../middleware/auth.js';
import { isValidEmail, isValidPassword } from '../validators.js';

const router = express.Router();
const ROLES_VALIDES = ['administrateur', 'gestionnaire', 'livreur', 'vendeur_gaz'];

// GET /api/team — liste des comptes avec leurs rôles (réservé administrateur)
router.get('/', authentifier, exigerRole('administrateur'), async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: UserRole, as: 'roles' }],
      order: [['createdAt', 'DESC']],
    });
    res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        active: u.active,
        roles: u.roles ? u.roles.map((r) => r.role) : [],
        createdAt: u.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs', details: err.message });
  }
});

// POST /api/team — création d'un collaborateur par l'administrateur
router.post('/', authentifier, exigerRole('administrateur'), async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Le nom, l\'adresse email et le mot de passe sont obligatoires' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Format d\'adresse email invalide' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 8 caractères, dont au moins une lettre et un chiffre',
      });
    }

    const emailNormalise = email.toLowerCase().trim();
    const existant = await User.findOne({ where: { email: emailNormalise } });
    if (existant) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cette adresse email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: emailNormalise,
      phone: phone ? phone.trim() : null,
      passwordHash,
      active: true,
    });

    const initialRole = role && ROLES_VALIDES.includes(role) ? role : 'livreur';
    await UserRole.create({
      userId: user.id,
      role: initialRole,
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      active: user.active,
      roles: [initialRole],
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création du compte', details: err.message });
  }
});

// PUT /api/team/:userId — modifier les coordonnées d'un collaborateur
router.put('/:userId', authentifier, exigerRole('administrateur'), async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone ? phone.trim() : null;

    if (email) {
      const emailNormalise = email.toLowerCase().trim();
      if (!isValidEmail(emailNormalise)) {
        return res.status(400).json({ error: 'Format d\'email invalide' });
      }
      if (emailNormalise !== user.email) {
        const autre = await User.findOne({ where: { email: emailNormalise } });
        if (autre) {
          return res.status(409).json({ error: 'Un autre compte utilise déjà cette adresse email' });
        }
        user.email = emailNormalise;
      }
    }

    await user.save();
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      active: user.active,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la modification', details: err.message });
  }
});

// POST /api/team/:userId/password — réinitialiser / définir le mot de passe d'un utilisateur
router.post('/:userId/password', authentifier, exigerRole('administrateur'), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || !isValidPassword(password)) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 8 caractères, dont au moins une lettre et un chiffre',
      });
    }

    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe', details: err.message });
  }
});

// DELETE /api/team/:userId — supprimer un compte collaborateur
router.delete('/:userId', authentifier, exigerRole('administrateur'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte administrateur.' });
    }

    const roles = await UserRole.findAll({ where: { userId: user.id } });
    const estAdmin = roles.some((r) => r.role === 'administrateur');

    if (estAdmin) {
      const totalAdmins = await UserRole.count({ where: { role: 'administrateur' } });
      if (totalAdmins <= 1) {
        return res.status(400).json({
          error: 'Impossible de supprimer le seul administrateur actif du système.',
        });
      }
    }

    // Supprimer les rôles puis l'utilisateur
    await UserRole.destroy({ where: { userId: user.id } });
    await user.destroy();

    res.json({ ok: true, message: 'Compte supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression', details: err.message });
  }
});

// POST /api/team/:userId/roles — attribuer un rôle
router.post('/:userId/roles', authentifier, exigerRole('administrateur'), async (req, res) => {
  const { role } = req.body;
  if (!ROLES_VALIDES.includes(role)) {
    return res.status(400).json({ error: 'Rôle invalide' });
  }
  const user = await User.findByPk(req.params.userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const [userRole] = await UserRole.findOrCreate({
    where: { userId: user.id, role },
    defaults: { userId: user.id, role },
  });
  res.status(201).json(userRole);
});

// DELETE /api/team/:userId/roles/:role — retirer un rôle
router.delete('/:userId/roles/:role', authentifier, exigerRole('administrateur'), async (req, res) => {
  const { userId, role } = req.params;

  // Sécurité : éviter qu'un administrateur supprime le dernier rôle admin du système
  if (role === 'administrateur') {
    const totalAdmins = await UserRole.count({ where: { role: 'administrateur' } });
    if (totalAdmins <= 1) {
      return res.status(400).json({
        error: 'Impossible de retirer le dernier rôle administrateur du système.',
      });
    }
  }

  await UserRole.destroy({ where: { userId, role } });
  res.json({ ok: true });
});

// PATCH /api/team/:userId — activer/désactiver un compte
router.patch('/:userId', authentifier, exigerRole('administrateur'), async (req, res) => {
  const user = await User.findByPk(req.params.userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  // Sécurité : empêcher de désactiver son propre compte s'il est le seul admin
  if (req.body.active === false && user.id === req.user.id) {
    const totalAdmins = await UserRole.count({ where: { role: 'administrateur' } });
    if (totalAdmins <= 1) {
      return res.status(400).json({
        error: 'Impossible de désactiver le seul compte administrateur actif.',
      });
    }
  }

  if (typeof req.body.active === 'boolean') user.active = req.body.active;
  await user.save();
  res.json({ id: user.id, active: user.active });
});

export default router;
