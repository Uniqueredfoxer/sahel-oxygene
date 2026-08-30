import express from 'express';
import crypto from 'crypto';
import { Livraison, User, AdminWhatsapp, ActionLog } from '../models/index.js';
import { calculerTarif, distanceHaversine } from '../utils/tarif.js';
import { genererNumeroLivraison, normaliserTelephone } from '../utils/numbering.js';
import { lienWhatsApp, messageNouvelleCommande } from '../utils/whatsapp.js';
import { genererRecuPDF } from '../utils/receipt.js';
import { obtenirNomPlateforme } from '../utils/branding.js';

const router = express.Router();

function urlVerification(qrToken) {
  const base = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
  return `${base}/verifier/${qrToken}`;
}

// POST /api/public/livraisons — formulaire de commande client, sans compte (§3.1)
router.post('/livraisons', async (req, res) => {
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
      return res.status(400).json({
        error: 'Téléphone, adresse de départ et destination sont obligatoires',
      });
    }

    let distanceKm = distanceFournie ? Number(distanceFournie) : null;
    if (!distanceKm && departLat && departLng && destinationLat && destinationLng) {
      distanceKm = Number(
        distanceHaversine(departLat, departLng, destinationLat, destinationLng).toFixed(2)
      );
    }
    if (!distanceKm) {
      return res.status(400).json({
        error:
          'Impossible de calculer la distance. Fournissez distanceKm ou les coordonnées GPS des deux points.',
      });
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
    });

    await ActionLog.create({
      livraisonId: livraison.id,
      type: 'commande',
      message: 'Commande passée par le client',
    });

    // Numéro admin principal (à défaut, le premier numéro actif enregistré)
    const adminPrincipal =
      (await AdminWhatsapp.findOne({ where: { principal: true, actif: true } })) ||
      (await AdminWhatsapp.findOne({ where: { actif: true } }));

    let lienNotification = null;
    if (adminPrincipal) {
      lienNotification = lienWhatsApp(
        adminPrincipal.numero,
        messageNouvelleCommande(livraison, urlVerification(qrToken), await obtenirNomPlateforme())
      );
    }

    req.app.get('io').to('staff').emit('livraison:nouvelle', livraison);

    res.status(201).json({
      livraison,
      lienWhatsAppNotification: lienNotification,
      urlVerification: urlVerification(qrToken),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création de la commande', details: err.message });
  }
});

// GET /api/public/estimation?distanceKm=10 — calcul du tarif avant validation
router.get('/estimation', (req, res) => {
  try {
    const distanceKm = Number(req.query.distanceKm);
    const montant = calculerTarif(distanceKm);
    res.json({ distanceKm, montant });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/public/suivi/:numero — suivi d'une commande par son numéro
router.get('/suivi/:numero', async (req, res) => {
  const livraison = await Livraison.findOne({
    where: { numero: req.params.numero },
    include: [{ model: User, as: 'livreur', attributes: ['id', 'name', 'phone'] }],
  });
  if (!livraison) return res.status(404).json({ error: 'Commande introuvable' });

  const positions = await livraison.getPositions
    ? await livraison.getPositions({ order: [['recordedAt', 'DESC']], limit: 1 })
    : [];

  res.json({ livraison, dernierePosition: positions[0] || null });
});

// GET /api/public/verifier/:qrToken — page publique de vérification (§3.4)
router.get('/verifier/:qrToken', async (req, res) => {
  const livraison = await Livraison.findOne({
    where: { qrToken: req.params.qrToken },
    include: [{ model: User, as: 'livreur', attributes: ['id', 'name'] }],
  });
  if (!livraison) return res.status(404).json({ error: 'Reçu introuvable' });
  res.json({
    numero: livraison.numero,
    statut: livraison.statut,
    clientTelephone: livraison.clientTelephone,
    adresseDepart: livraison.adresseDepart,
    adresseDestination: livraison.adresseDestination,
    montant: livraison.montant,
    livreur: livraison.livreur ? livraison.livreur.name : null,
    livree_le: livraison.deliveredAt,
    signee: Boolean(livraison.signatureDataUrl),
  });
});

// GET /api/public/recu/:qrToken.pdf — téléchargement du reçu (accessible via QR code)
router.get('/recu/:qrToken', async (req, res) => {
  const livraison = await Livraison.findOne({
    where: { qrToken: req.params.qrToken },
    include: [{ model: User, as: 'livreur', attributes: ['id', 'name'] }],
  });
  if (!livraison) return res.status(404).json({ error: 'Reçu introuvable' });
  const pdfBuffer = await genererRecuPDF(livraison, urlVerification(livraison.qrToken), await obtenirNomPlateforme());
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `inline; filename="${livraison.numero}.pdf"`);
  res.send(pdfBuffer);
});

export default router;
