import express from 'express';
import { sequelize, Livraison } from '../models/index.js';
import { authentifier, exigerRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/clients — base clients regroupée par numéro unique (§3.3.3)
// Nombre de livraisons, chiffre d'affaires (livrées uniquement, §4), dernière commande.
router.get('/', authentifier, exigerRole('administrateur', 'gestionnaire'), async (req, res) => {
  const clients = await Livraison.findAll({
    attributes: [
      'clientTelephoneNormalise',
      [sequelize.fn('MAX', sequelize.col('client_nom')), 'clientNom'],
      [sequelize.fn('MAX', sequelize.col('client_telephone')), 'clientTelephone'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'nombreLivraisons'],
      [
        sequelize.fn(
          'SUM',
          sequelize.literal(`CASE WHEN statut = 'livree' THEN montant ELSE 0 END`)
        ),
        'chiffreAffaires',
      ],
      [sequelize.fn('MAX', sequelize.col('created_at')), 'derniereCommande'],
    ],
    group: ['clientTelephoneNormalise'],
    order: [[sequelize.literal('"derniereCommande"'), 'DESC']],
  });
  res.json(clients);
});

export default router;
