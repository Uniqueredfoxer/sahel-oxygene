import express from 'express';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { Livraison, User, ActionLog, GpsPosition } from '../models/index.js';
import { authentifier, exigerRole } from '../middleware/auth.js';
import { calculerTarif, distanceHaversine } from '../utils/tarif.js';
import { genererNumeroLivraison, normaliserTelephone } from '../utils/numbering.js';
import { genererRecuPDF } from '../utils/receipt.js';
import { obtenirNomPlateforme } from '../utils/branding.js';

const router = express.Router();
const TOUS_ROLES = ['administrateur', 'gestionnaire', 'livreur'];
const STAFF = ['administrateur', 'gestionnaire'];

function urlVerification(qrToken) {
  const base = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
  return `${base}/verifier/${qrToken}`;
}

// GET /api/livraisons — boîte de réception opérationnelle (§3.3.2), recherche + filtre statut
router.get('/', authentifier, exigerRole(...STAFF), async (req, res) => {
  const { statut, recherche } = req.query;
  const where = {};
  if (statut) where.statut = statut;
  if (recherche) {
    where[Op.or] = [
      { numero: { [Op.iLike]: `%${recherche}%` } },
      { clientNom: { [Op.iLike]: `%${recherche}%` } },
      { clientTelephone: { [Op.iLike]: `%${recherche}%` } },
      { adresseDepart: { [Op.iLike]: `%${recherche}%` } },
      { adresseDestination: { [Op.iLike]: `%${recherche}%` } },
    ];
  }
  const livraisons = await Livraison.findAll({
    where,
    include: [
      { model: User, as: 'livreur', attributes: ['id', 'name', 'phone'] },
      { model: User, as: 'creePar', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 500,
  });
  res.json(livraisons);
});

function verifierAccesLivreur(req, livraison) {
  const roles = req.roles || [];
  if (roles.includes('administrateur') || roles.includes('gestionnaire')) return true;
  return livraison.livreurId === req.user.id;
}

// GET /api/livraisons/mine — courses assignées au livreur connecté (§3.2)
router.get('/mine', authentifier, exigerRole('livreur', ...STAFF), async (req, res) => {
  const { statut } = req.query;
  const where = { livreurId: req.user.id };

  if (statut && ['en_cours', 'livree', 'annulee'].includes(statut)) {
    where.statut = statut;
  } else if (!statut || statut === 'actives') {
    where.statut = 'en_cours';
  }

  const livraisons = await Livraison.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: 100,
  });
  res.json(livraisons);
});

// GET /api/livraisons/doublons — détection de fiches partageant un numéro équivalent (§3.3.6)
router.get('/doublons', authentifier, exigerRole(...STAFF), async (req, res) => {
  const groupes = await Livraison.findAll({
    attributes: [
      'clientTelephoneNormalise',
      [Livraison.sequelize.fn('array_agg', Livraison.sequelize.col('id')), 'ids'],
      [Livraison.sequelize.fn('array_agg', Livraison.sequelize.col('client_telephone')), 'telephones'],
      [Livraison.sequelize.fn('array_agg', Livraison.sequelize.col('client_nom')), 'noms'],
      [Livraison.sequelize.fn('COUNT', Livraison.sequelize.col('id')), 'total'],
    ],
    group: ['clientTelephoneNormalise'],
    having: Livraison.sequelize.literal(
      'COUNT(DISTINCT client_telephone) > 1'
    ),
  });
  res.json(groupes);
});

// POST /api/livraisons — saisie d'une commande reçue par téléphone (§3.3.1)
router.post('/', authentifier, exigerRole(...STAFF), async (req, res) => {
  try {
    const {
      clientNom,
      clientTelephone,
      adresseDepart,
      adresseDestination,
      departLat,
      departLng,
      destinationLat,
      destinationLng,
      distanceKm: distanceFournie,
    } = req.body;

    if (!clientTelephone || !adresseDepart || !adresseDestination) {
      return res.status(400).json({ error: 'Téléphone, départ et destination sont obligatoires' });
    }

    let distanceKm = distanceFournie ? Number(distanceFournie) : null;
    if (!distanceKm && departLat && departLng && destinationLat && destinationLng) {
      distanceKm = Number(
        distanceHaversine(departLat, departLng, destinationLat, destinationLng).toFixed(2)
      );
    }
    if (!distanceKm) {
      return res.status(400).json({ error: 'Distance manquante (distanceKm ou coordonnées GPS)' });
    }

    const montant = calculerTarif(distanceKm);
    const numero = await genererNumeroLivraison(Livraison);
    const qrToken = crypto.randomBytes(16).toString('hex');

    const livraison = await Livraison.create({
      numero,
      clientNom: clientNom || null,
      clientTelephone,
      clientTelephoneNormalise: normaliserTelephone(clientTelephone),
      adresseDepart,
      adresseDestination,
      departLat: departLat || null,
      departLng: departLng || null,
      destinationLat: destinationLat || null,
      destinationLng: destinationLng || null,
      distanceKm,
      montant,
      statut: 'en_attente',
      qrToken,
      creeParId: req.user.id,
    });

    await ActionLog.create({
      livraisonId: livraison.id,
      type: 'commande',
      acteurId: req.user.id,
      message: 'Commande saisie par un gestionnaire',
    });

    res.status(201).json(livraison);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création', details: err.message });
  }
});

// PATCH /api/livraisons/:id/attribuer — attribution à un livreur (§3.3.2)
router.patch('/:id/attribuer', authentifier, exigerRole(...STAFF), async (req, res) => {
  const livraison = await Livraison.findByPk(req.params.id);
  if (!livraison) return res.status(404).json({ error: 'Livraison introuvable' });

  const livreurId = req.body.livreurId || req.user.id;
  const livreur = await User.findByPk(livreurId);
  if (!livreur || !livreur.active) {
    return res.status(400).json({ error: 'Livreur introuvable ou compte inactif' });
  }

  livraison.livreurId = livreur.id;
  livraison.statut = 'en_cours';
  livraison.assignedAt = new Date();
  await livraison.save();

  await ActionLog.create({
    livraisonId: livraison.id,
    type: 'attribution',
    acteurId: req.user.id,
    message: `Attribuée à ${livreur.name}`,
  });

  // Temps réel : la course apparaît immédiatement chez le livreur (§6)
  if (req.app.get('io')) {
    req.app.get('io').to(`livreur:${livreur.id}`).emit('livraison:attribuee', livraison);
    req.app.get('io').to('staff').emit('livraison:maj', livraison);
  }

  res.json(livraison);
});

// PATCH /api/livraisons/:id/statut — changement de statut manuel
router.patch('/:id/statut', authentifier, exigerRole(...STAFF), async (req, res) => {
  const { statut } = req.body;
  if (!['en_attente', 'en_cours', 'livree', 'annulee'].includes(statut)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }
  const livraison = await Livraison.findByPk(req.params.id);
  if (!livraison) return res.status(404).json({ error: 'Livraison introuvable' });

  livraison.statut = statut;
  if (statut === 'livree') livraison.deliveredAt = new Date();
  if (statut === 'annulee') livraison.cancelledAt = new Date();
  await livraison.save();

  await ActionLog.create({
    livraisonId: livraison.id,
    type: 'statut',
    acteurId: req.user.id,
    message: `Statut changé vers ${statut}`,
  });

  res.json(livraison);
});

// DELETE /api/livraisons/:id — suppression, réservée à l'administrateur (§2)
router.delete('/:id', authentifier, exigerRole('administrateur'), async (req, res) => {
  const livraison = await Livraison.findByPk(req.params.id);
  if (!livraison) return res.status(404).json({ error: 'Livraison introuvable' });
  await livraison.destroy();
  res.json({ ok: true });
});

// POST /api/livraisons/:id/position — partage de la position GPS par le livreur (§3.2)
router.post('/:id/position', authentifier, exigerRole('livreur', ...STAFF), async (req, res) => {
  const { lat, lng } = req.body;
  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'lat et lng requis' });
  }
  const livraison = await Livraison.findByPk(req.params.id);
  if (!livraison) return res.status(404).json({ error: 'Livraison introuvable' });

  if (!verifierAccesLivreur(req, livraison)) {
    return res.status(403).json({ error: 'Accès non autorisé à cette livraison' });
  }

  const position = await GpsPosition.create({
    livraisonId: livraison.id,
    livreurId: req.user.id,
    lat,
    lng,
  });

  await ActionLog.create({
    livraisonId: livraison.id,
    type: 'position',
    acteurId: req.user.id,
    meta: { lat, lng },
  });

  req.app.get('io').to('staff').emit('position:maj', { livraisonId: livraison.id, lat, lng });

  res.status(201).json(position);
});

// GET /api/livraisons/:id/positions — trajet complet pour la carte de suivi (§3.4)
router.get('/:id/positions', authentifier, exigerRole(...TOUS_ROLES), async (req, res) => {
  const livraison = await Livraison.findByPk(req.params.id);
  if (!livraison) return res.status(404).json({ error: 'Livraison introuvable' });

  if (!verifierAccesLivreur(req, livraison)) {
    return res.status(403).json({ error: 'Accès non autorisé à cette livraison' });
  }

  const positions = await GpsPosition.findAll({
    where: { livraisonId: req.params.id },
    order: [['recordedAt', 'ASC']],
  });
  res.json(positions);
});

// GET /api/livraisons/:id/historique — chronologie des actions (§3.4)
router.get('/:id/historique', authentifier, exigerRole(...STAFF), async (req, res) => {
  const historique = await ActionLog.findAll({
    where: { livraisonId: req.params.id },
    order: [['createdAt', 'ASC']],
  });
  res.json(historique);
});

// POST /api/livraisons/:id/valider — validation avec signature + reçu (§3.2)
router.post('/:id/valider', authentifier, exigerRole('livreur', ...STAFF), async (req, res) => {
  const { signatureDataUrl } = req.body;
  const livraison = await Livraison.findByPk(req.params.id);
  if (!livraison) return res.status(404).json({ error: 'Livraison introuvable' });

  if (!verifierAccesLivreur(req, livraison)) {
    return res.status(403).json({ error: 'Accès non autorisé à cette livraison' });
  }

  livraison.signatureDataUrl = signatureDataUrl || livraison.signatureDataUrl;
  livraison.statut = 'livree';
  livraison.deliveredAt = new Date();
  await livraison.save();

  await ActionLog.create({
    livraisonId: livraison.id,
    type: 'validation',
    acteurId: req.user.id,
    message: 'Livraison validée avec signature du client',
  });

  req.app.get('io').to('staff').emit('livraison:maj', livraison);

  res.json(livraison);
});

// GET /api/livraisons/:id/recu — reçu PDF (staff + livreur assigné)
router.get('/:id/recu', authentifier, exigerRole(...TOUS_ROLES), async (req, res) => {
  const livraison = await Livraison.findByPk(req.params.id, {
    include: [{ model: User, as: 'livreur', attributes: ['id', 'name'] }],
  });
  if (!livraison) return res.status(404).json({ error: 'Livraison introuvable' });

  if (!verifierAccesLivreur(req, livraison)) {
    return res.status(403).json({ error: 'Accès non autorisé à cette livraison' });
  }

  const pdfBuffer = await genererRecuPDF(livraison, urlVerification(livraison.qrToken), await obtenirNomPlateforme());
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `inline; filename="${livraison.numero}.pdf"`);
  res.send(pdfBuffer);
});

export default router;
