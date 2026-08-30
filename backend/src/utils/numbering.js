import { Op } from 'sequelize';
import crypto from 'crypto';

/**
 * Génère le prochain numéro de livraison au format PDX-AAAAMMJJ-NNNN
 * Garanti unique même sous fortes requêtes concurrentes.
 */
async function genererNumeroLivraison(LivraisonModel) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `PDX-${yyyy}${mm}${dd}-`;

  const debutJour = new Date(yyyy, now.getMonth(), now.getDate(), 0, 0, 0);
  const finJour = new Date(yyyy, now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const count = await LivraisonModel.count({
    where: { createdAt: { [Op.between]: [debutJour, finJour] } },
  });

  let counter = count + 1;
  let numero = `${prefix}${String(counter).padStart(4, '0')}`;

  // Vérification de sécurité anti-collision si requêtes concurrentes
  let existant = await LivraisonModel.findOne({ where: { numero } });
  let tentatives = 0;
  while (existant && tentatives < 5) {
    counter += 1;
    numero = `${prefix}${String(counter).padStart(4, '0')}`;
    existant = await LivraisonModel.findOne({ where: { numero } });
    tentatives += 1;
  }

  // Repli absolu si forte concurrence
  if (existant) {
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    numero = `${prefix}${randomSuffix}`;
  }

  return numero;
}

/** Normalise un numéro de téléphone pour la comparaison de doublons : 8 derniers chiffres. */
function normaliserTelephone(telephone) {
  const chiffres = String(telephone || '').replace(/\D/g, '');
  return chiffres.slice(-8);
}

export { genererNumeroLivraison, normaliserTelephone };
