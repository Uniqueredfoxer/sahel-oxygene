import express from 'express';
import bcrypt from 'bcryptjs';
import { GasVendor, User, UserRole } from '../models/index.js';
import { authentifier, exigerRole } from '../middleware/auth.js';
import { distanceHaversine } from '../utils/tarif.js';
import { lienItineraire } from '../utils/itineraire.js';
import { isValidGPS, isValidEmail, isValidPassword } from '../validators.js';

const router = express.Router();

// GET /api/gaz/proche?lat=&lng= — les 3 coins actifs les plus proches ayant du gaz (public, sans compte)
router.get('/proche', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!isValidGPS(lat, lng)) {
    return res.status(400).json({ error: 'Position GPS (lat, lng) requise et valide' });
  }

  const vendeurs = await GasVendor.findAll({ where: { actif: true, disponible: true } });

  const proches = vendeurs
    .map((v) => ({
      id: v.id,
      nom: v.nom,
      telephone: v.telephone,
      description: v.description,
      lat: v.lat,
      lng: v.lng,
      distanceKm: Number(distanceHaversine(lat, lng, v.lat, v.lng).toFixed(2)),
      itineraire: lienItineraire(lat, lng, v.lat, v.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  res.json(proches);
});

// GET /api/gaz/vendeurs — liste complète (admin, gestion §"L'administrateur gère les vendeurs")
router.get('/vendeurs', authentifier, exigerRole('administrateur'), async (req, res) => {
  const vendeurs = await GasVendor.findAll({
    include: [{ model: User, as: 'vendeur', attributes: ['id', 'name', 'email', 'phone'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(vendeurs);
});

// POST /api/gaz/vendeurs — créer un coin, avec option de créer le compte du vendeur en même temps
router.post('/vendeurs', authentifier, exigerRole('administrateur'), async (req, res) => {
  try {
    const { nom, telephone, description, lat, lng, creerCompte, email, password } = req.body;
    if (!nom || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Nom et coordonnées GPS (lat, lng) requis' });
    }

    if (!isValidGPS(lat, lng)) {
      return res.status(400).json({ error: 'Coordonnées GPS invalides' });
    }

    let userId = null;
    if (creerCompte) {
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: 'Email valide requis pour créer le compte vendeur' });
      }
      if (!password || !isValidPassword(password)) {
        return res.status(400).json({
          error: 'Le mot de passe doit contenir au moins 8 caractères avec lettres et chiffres',
        });
      }
      const existant = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existant) {
        return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        name: nom,
        email: email.toLowerCase(),
        phone: telephone || null,
        passwordHash,
      });
      await UserRole.create({ userId: user.id, role: 'vendeur_gaz' });
      userId = user.id;
    }

    const vendeur = await GasVendor.create({
      nom,
      telephone: telephone || null,
      description: description || null,
      lat,
      lng,
      userId,
    });

    res.status(201).json(vendeur);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création du coin', details: err.message });
  }
});

// PATCH /api/gaz/vendeurs/:id — modifier un coin (position, nom, statut actif/inactif)
router.patch('/vendeurs/:id', authentifier, exigerRole('administrateur'), async (req, res) => {
  const vendeur = await GasVendor.findByPk(req.params.id);
  if (!vendeur) return res.status(404).json({ error: 'Coin introuvable' });

  const { nom, telephone, description, lat, lng, actif } = req.body;
  if (nom !== undefined) vendeur.nom = nom;
  if (telephone !== undefined) vendeur.telephone = telephone;
  if (description !== undefined) vendeur.description = description;
  if (lat !== undefined) vendeur.lat = lat;
  if (lng !== undefined) vendeur.lng = lng;
  if (actif !== undefined) vendeur.actif = actif;
  await vendeur.save();

  res.json(vendeur);
});

// DELETE /api/gaz/vendeurs/:id
router.delete('/vendeurs/:id', authentifier, exigerRole('administrateur'), async (req, res) => {
  await GasVendor.destroy({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// GET /api/gaz/mon-point — le vendeur connecté consulte son propre coin
router.get('/mon-point', authentifier, exigerRole('vendeur_gaz', 'administrateur'), async (req, res) => {
  const point = await GasVendor.findOne({ where: { userId: req.user.id } });
  if (!point) return res.status(404).json({ error: 'Aucun coin rattaché à ce compte' });
  res.json(point);
});

// PATCH /api/gaz/mon-point/disponibilite — le vendeur active/désactive lui-même le bouton "j'ai du gaz"
router.patch('/mon-point/disponibilite', authentifier, exigerRole('vendeur_gaz'), async (req, res) => {
  const point = await GasVendor.findOne({ where: { userId: req.user.id } });
  if (!point) return res.status(404).json({ error: 'Aucun coin rattaché à ce compte' });

  point.disponible = Boolean(req.body.disponible);
  await point.save();
  res.json(point);
});

export default router;
