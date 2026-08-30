import express from 'express';
import { User, UserRole } from '../models/index.js';
import { authentifier, exigerRole } from '../middleware/auth.js';

const router = express.Router();
const ROLES_VALIDES = ['administrateur', 'gestionnaire', 'livreur', 'vendeur_gaz'];

// GET /api/team — liste des comptes avec leurs rôles (réservé administrateur, §3.3.7)
router.get('/', authentifier, exigerRole('administrateur'), async (req, res) => {
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
    }))
  );
});

// POST /api/team/:userId/roles — attribuer un rôle (promotion manuelle, §2)
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
