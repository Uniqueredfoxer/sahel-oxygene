import express from 'express';
import { AdminWhatsapp } from '../models/index.js';
import { authentifier, exigerRole } from '../middleware/auth.js';

const router = express.Router();
const STAFF = ['administrateur', 'gestionnaire'];

// GET /api/whatsapp — numéros admin recevant les notifications de commande
router.get('/', authentifier, exigerRole(...STAFF), async (req, res) => {
  const numeros = await AdminWhatsapp.findAll({ order: [['principal', 'DESC'], ['createdAt', 'ASC']] });
  res.json(numeros);
});

// POST /api/whatsapp — enregistrer un numéro
router.post('/', authentifier, exigerRole('administrateur'), async (req, res) => {
  const { numero, label, principal } = req.body;
  if (!numero) return res.status(400).json({ error: 'Numéro requis' });

  if (principal) {
    await AdminWhatsapp.update({ principal: false }, { where: {} });
  }
  const entree = await AdminWhatsapp.create({
    numero,
    label: label || null,
    principal: Boolean(principal),
  });
  res.status(201).json(entree);
});

// PATCH /api/whatsapp/:id — activer/désactiver, définir comme principal
router.patch('/:id', authentifier, exigerRole('administrateur'), async (req, res) => {
  const entree = await AdminWhatsapp.findByPk(req.params.id);
  if (!entree) return res.status(404).json({ error: 'Numéro introuvable' });

  if (req.body.principal) {
    await AdminWhatsapp.update({ principal: false }, { where: {} });
    entree.principal = true;
  }
  if (typeof req.body.actif === 'boolean') entree.actif = req.body.actif;
  await entree.save();
  res.json(entree);
});

// DELETE /api/whatsapp/:id
router.delete('/:id', authentifier, exigerRole('administrateur'), async (req, res) => {
  await AdminWhatsapp.destroy({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
